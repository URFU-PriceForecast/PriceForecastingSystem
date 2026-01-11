window.addEventListener("load", () => {
  const p1 = document.getElementById("popup1");
  if (p1) p1.style.display = "flex";
});

const popup1Next = document.getElementById("popup1Next");
if (popup1Next) {
  popup1Next.onclick = () => {
    const p1 = document.getElementById("popup1");
    const p2 = document.getElementById("popup2");
    if (p1) p1.style.display = "none";
    if (p2) p2.style.display = "flex";
  };
}

const popup2Close = document.getElementById("popup2Close");
if (popup2Close) {
  popup2Close.onclick = () => {
    const p2 = document.getElementById("popup2");
    if (p2) p2.style.display = "none";
  };
}

// ============================
//  ОСНОВНОЙ КОД
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const article = urlParams.get("article") || "demo";

  const ctx = document.getElementById("chart");
  const chartSkeleton = document.getElementById("chartSkeleton");
  let chart;

  const infoText = document.getElementById("info-text");
  const recText = document.getElementById("recommendations-text");


  let currentScenario = "positive";
  let currentPeriod = 30;

  const scenarioMap = {
    positive: "optimist",
    neutral: "neutral",
    negative: "pessimist"
  };

    // Фейковые рекомендации по сценариям
  const fakeScenarioRecommendations = {
    positive: [
      "Рынок растёт: можно повышать цену на 3–7% в ближайшие недели.",
      "Позитивная динамика: подходящее время для закупки дополнительных партий товара.",
      "Спрос увеличивается: стоит рассмотреть расширение ассортимента."
    ],
    neutral: [
      "Цены стабильны: удерживайте текущий уровень без резких изменений.",
      "Нейтральная динамика: можно закупать небольшие объёмы по мере необходимости.",
      "Ситуация спокойная: следите за изменениями на рынке без срочных действий."
    ],
    negative: [
      "Рынок снижается: рекомендуется снижать цены на 5–10% для поддержания спроса.",
      "Негативная динамика: избегайте крупных закупок, возможны дальнейшие падения.",
      "Спрос падает: оптимизируйте складские остатки, избегайте заморозки средств."
    ]
  };

  function getFakeRec() {
    const list = fakeScenarioRecommendations[currentScenario];
    return list[Math.floor(Math.random() * list.length)];
  }

  function showSkeletons() {
    // Показываем только skeleton для графика, текст оставляем как есть
    if (chartSkeleton) chartSkeleton.style.display = "block";
    if (ctx) ctx.style.display = "none";
  }

  function hideSkeletons() {
    if (chartSkeleton) chartSkeleton.style.display = "none";
    if (ctx) ctx.style.display = "block";
  }

  const menuBtn = document.getElementById("menuBtn");
  const menuContainer = document.querySelector(".menu-container");

  console.log("Menu elements found:", { menuBtn: !!menuBtn, menuContainer: !!menuContainer });

  if (menuBtn && menuContainer) {
    menuBtn.addEventListener("click", () => {
      console.log("Menu button clicked");
      menuContainer.classList.toggle("open");
      console.log("Menu container classes:", menuContainer.classList);
    });
  } else {
    console.error("Menu elements not found!", { menuBtn, menuContainer });
  }

  const menuButtons = document.querySelectorAll(".menu-dropdown button");
  console.log("Menu buttons found:", menuButtons.length);

  menuButtons.forEach(btn => {
    console.log("Setting up button:", btn.dataset.scenario);
    btn.addEventListener("click", () => {
      const scenario = btn.dataset.scenario;
      console.log("Scenario button clicked:", scenario);
      if (!scenario) return;

      currentScenario = scenario;
      console.log("Current scenario set to:", currentScenario);

      if (menuContainer) menuContainer.classList.remove("open");

      loadAll();
    });
  });

  const periodItems = document.querySelectorAll(".period-list li");

  periodItems.forEach(li => {
    li.addEventListener("click", () => {
      periodItems.forEach(el => el.classList.remove("active"));
      li.classList.add("active");

      currentPeriod = parseInt(li.dataset.period) || currentPeriod;

      loadAll();
    });
  });

  async function loadPrice() {
    if (!infoText) return;

    console.log("Loading price for article:", article);
    try {
      const url = `http://localhost:5229/api/price/demo/${article}`;
      console.log("Fetching price:", url);
      const res = await fetch(url);
      console.log("Price response status:", res.status);

      const d = await res.json();
      console.log("Price API Response:", JSON.stringify(d, null, 2));

      infoText.innerHTML = `
        <strong>Товар:</strong> ${d.product?.name || d.name || "Товар"}<br>
        <strong>Артикул:</strong> ${article}<br>
        <strong>Актуальная цена:</strong> ${d.price ? d.price + " ₽" : "н/д"}
      `;
      console.log("Updated price info");
    } catch (err) {
      console.warn("loadPrice error:", err);
      infoText.innerHTML = `
        <strong>Товар:</strong> неизвестно<br>
        <strong>Артикул:</strong> ${article}<br>
        <strong>Актуальная цена:</strong> ошибка загрузки
      `;
    }
  }

  async function loadRecommendations() {
    console.log("Loading recommendations for article:", article);
    try {
      const url = `http://localhost:5229/api/recommendations/${article}?period=${currentPeriod}&scenario=${scenarioMap[currentScenario]}`;
      console.log("Fetching:", url);
      const res = await fetch(url);
      console.log("Response status:", res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const r = await res.json();
      console.log("Recommendations API Response:", JSON.stringify(r, null, 2));
      const recommendationText = `${r.PriceAction} (изменение: ${r.Percentage}%, уверенность: ${Math.round(r.Confidence * 100)}%)`;
      console.log("Setting recommendation text:", recommendationText);
      if (recText) {
        recText.textContent = recommendationText;
        console.log("Recommendation text set successfully, current content:", recText.textContent);
      } else {
        console.error("recText element not found!");
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      // сервер не дал ответ → выводим рекомендации по сценарию
      recText.textContent = getFakeRec();
    }
  }

  async function loadForecast() {
    console.log("Loading forecast for article:", article, "period:", currentPeriod);
    try {
      const url = `http://localhost:5229/api/forecast/${article}?days=${currentPeriod}`;
      console.log("Fetching forecast:", url);
      const res = await fetch(url);
      console.log("Forecast response status:", res.status);

      const data = await res.json();
      console.log("Forecast API Response:", JSON.stringify(data, null, 2));

      // Используем структуру из API ответа
      let labels = data.dates || [];
      let values = data.values || [];

      console.log("Using labels:", labels.length, "values:", values.length);

      // Validate and filter data before creating chart
      const validData = [];
      for (let i = 0; i < Math.min(labels.length, values.length); i++) {
        const value = values[i];
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          validData.push({ label: labels[i], value: value });
        }
      }

      console.log("Valid data points:", validData.length, "of", values.length);

      if (validData.length === 0) {
        console.error("No valid numeric values for chart!");
        return;
      }

      const chartLabels = validData.map(d => d.label);
      const chartValues = validData.map(d => d.value);

      if (chart) chart.destroy();

      console.log("Creating chart with valid data points:", validData.length);
      console.log("First few chart labels:", chartLabels.slice(0, 3));
      console.log("First few chart values:", chartValues.slice(0, 3));

      try {
        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: chartLabels,
            datasets: [{
              label: `Прогноз (${currentScenario})`,
              data: chartValues,
              borderColor: currentScenario === "positive" ? "green" : currentScenario === "negative" ? "red" : "blue",
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
        console.log("Chart created successfully!");
        hideSkeletons(); // Show the chart immediately
      } catch (chartError) {
        console.error("Chart creation error:", chartError);
      }

    } catch {
      recText.textContent = recText.textContent;
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