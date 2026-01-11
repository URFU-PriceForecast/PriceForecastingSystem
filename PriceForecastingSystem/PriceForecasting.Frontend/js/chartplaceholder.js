document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const article = urlParams.get("article");

  // Check if article parameter exists
  if (!article) {
    console.error("No article parameter found in URL");
    showError("Не указан артикул товара. Вернитесь на главную страницу и выберите товар.");
    return;
  }

  console.log(`Loading details for article: ${article}`);

  const ctx = document.getElementById("chart");
  const chartSkeleton = document.getElementById("chartSkeleton");

  let chart;

  const infoText = document.getElementById("info-text");
  const recText = document.getElementById("recommendations-text");

  let currentScenario = "positive";
  let currentPeriod = 30;

  const scenarioMap = {
    positive: "optimist",
    negative: "pessimist"
  };

  // Error handling function
  function showError(message) {
    const infoText = document.getElementById("info-text");
    const recText = document.getElementById("recommendations-text");

    if (infoText) infoText.textContent = `Ошибка: ${message}`;
    if (recText) recText.textContent = "Пожалуйста, вернитесь на главную страницу";

    console.error(message);
  }

  function showSkeletons() {
    infoText.innerHTML = <div class="skeleton" style="height:16px;width:80%"></div>;
    recText.innerHTML = <div class="skeleton" style="height:16px;width:80%"></div>;
    chartSkeleton.style.display = "block";
    ctx.style.display = "none";
  }

  function hideSkeletons() {
    chartSkeleton.style.display = "none";
    ctx.style.display = "block";
  }

  document.querySelector(".menu-btn").onclick = () =>
    document.querySelector(".menu-container").classList.toggle("open");

  document.querySelectorAll(".menu-dropdown button").forEach(btn => {
    btn.onclick = () => {
      currentScenario = btn.dataset.scenario;
      document.querySelector(".menu-container").classList.remove("open");
      loadAll();
    };
  });

  document.querySelectorAll(".period-list li").forEach(li => {
    li.onclick = () => {
      document.querySelectorAll(".period-list li")
        .forEach(el => el.classList.remove("active"));

      li.classList.add("active");
      currentPeriod = parseInt(li.dataset.period);

      loadAll();
    };
  });

  async function loadPrice() {
    try {
      console.log(`Loading price for article: ${article}`);
      const headers = {
        'Accept': 'application/json'
      };

      // Добавляем токен авторизации, если пользователь авторизован
      if (window.authManager && window.authManager.isAuthenticated()) {
        Object.assign(headers, window.authManager.getAuthHeaders());
      }

      const res = await fetch(`http://localhost:5229/api/price/demo/${article}`, {
        method: 'GET',
        headers: headers
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const d = await res.json();
      console.log('Price data received:', d);

      if (infoText) {
        infoText.textContent = `Цена: ${d.price}₽, дата: ${d.date}`;
      }
    } catch (err) {
      console.error('Error loading price:', err);
      if (infoText) {
        infoText.textContent = `Ошибка загрузки цены: ${err.message}`;
      }
    }
  }

  async function loadRecommendations() {
    try {
      console.log(`Loading recommendations for article: ${article}, period: ${currentPeriod}, scenario: ${scenarioMap[currentScenario]}`);

      const headers = {
        'Accept': 'application/json'
      };

      // Добавляем токен авторизации для защищенного эндпоинта
      if (window.authManager && window.authManager.isAuthenticated()) {
        Object.assign(headers, window.authManager.getAuthHeaders());
      }

      const res = await fetch(
        `http://localhost:5229/api/recommendations/${article}?period=${currentPeriod}&scenario=${scenarioMap[currentScenario]}`,
        {
          method: 'GET',
          headers: headers
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const r = await res.json();
      console.log('Recommendations data received:', r);

      if (recText) {
        recText.textContent = `${r.action || 'Недостаточно данных'} (изменение: ${r.percentage || 0}%, уверенность: ${Math.round((r.confidence || 0) * 100)}%)`;
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      if (recText) {
        recText.textContent = `Ошибка загрузки рекомендаций: ${err.message}`;
      }
    }
  }

  async function loadForecast() {
    try {
      console.log(`Loading forecast for article: ${article}, days: ${currentPeriod}`);

      const headers = {
        'Accept': 'application/json'
      };

      // Добавляем токен авторизации для защищенного эндпоинта
      if (window.authManager && window.authManager.isAuthenticated()) {
        Object.assign(headers, window.authManager.getAuthHeaders());
      }

      const res = await fetch(
        `http://localhost:5229/api/forecast/${article}?days=${currentPeriod}&scenario=${scenarioMap[currentScenario]}`,
        {
          method: 'GET',
          headers: headers
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Forecast data received:', data);

      if (!data || !data.values || !Array.isArray(data.values)) {
        throw new Error('Неверный формат данных прогноза');
      }

      const labels = data.values.map(v => v.date);
      const values = data.values.map(v => v.price);

      console.log('Chart data:', { labels, values });

      // Hide skeleton and show chart
      if (chartSkeleton) chartSkeleton.style.display = "none";
      if (ctx) ctx.style.display = "block";

      if (chart) chart.destroy();

      // Check if Chart is available
      if (typeof Chart === 'undefined') {
        throw new Error('Chart.js не загружен');
      }

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: `Прогноз (${currentScenario})`,
            data: values,
            borderColor: currentScenario === "positive" ? "green" : "red",
            borderWidth: 2,
            fill: false,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Дата'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Цена (₽)'
              }
            }
          }
        }
      });

      console.log('Chart created successfully');

    } catch (err) {
      console.error('Error loading forecast:', err);
      if (recText) {
        recText.textContent = `Ошибка построения графика: ${err.message}`;
      }
      // Show skeleton if chart failed to load
      if (chartSkeleton) chartSkeleton.style.display = "block";
      if (ctx) ctx.style.display = "none";
    }
  }

  async function loadAll() {
    showSkeletons();
    await Promise.all([
      loadPrice(),
      loadRecommendations(),
      loadForecast()
    ]);
    hideSkeletons();
  }

  setInterval(loadAll, 15000);

  loadAll();
});