document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const article = urlParams.get("article");

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
      const res = await fetch(`/api/price/demo/${article}`);
      const d = await res.json();
      infoText.textContent = `Цена: ${d.price}₽, дата: ${d.date}`;
    } catch {
      infoText.textContent = "Ошибка загрузки";
    }
  }

  async function loadRecommendations() {
    try {
      const res = await fetch(
        `/api/recommendations/${article}?period=${currentPeriod}&scenario=${scenarioMap[currentScenario]}`
      );
      const r = await res.json();

      recText.textContent = `${r.action} (изменение: ${r.percent}%, уверенность: ${r.confidence}%)`;

    } catch {
      recText.textContent = "Ошибка рекомендаций";
    }
  }

  async function loadForecast() {
    try {
      const res = await fetch(
        `/api/forecast/${article}?days=${currentPeriod}`
      );
      const data = await res.json();

      const labels = data.values.map(v => v.date);
      const values = data.values.map(v => v.price);

      if (chart) chart.destroy();

      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: `Прогноз (${currentScenario})`,
            data: values,
            borderColor: currentScenario === "positive" ? "green" : "red",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });

    } catch {
      recText.textContent = "Ошибка построения графика";
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