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
    if (infoText) infoText.innerHTML = '<div class="skeleton" style="height:16px;width:80%"></div>';
    if (recText) recText.innerHTML = '<div class="skeleton" style="height:16px;width:80%"></div>';
    if (chartSkeleton) chartSkeleton.style.display = "block";
    if (ctx) ctx.style.display = "none";
  }

  function hideSkeletons() {
    if (chartSkeleton) chartSkeleton.style.display = "none";
    if (ctx) ctx.style.display = "block";
  }

  const menuBtn = document.querySelector(".menu-btn");
  const menuContainer = document.querySelector(".menu-container");

  if (menuBtn && menuContainer) {
    menuBtn.addEventListener("click", () => {
      menuContainer.classList.toggle("open");
    });
  }

  const menuButtons = document.querySelectorAll(".menu-dropdown button");
  menuButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const scenario = btn.dataset.scenario;
      if (!scenario) return;

      currentScenario = scenario;

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

    try {
      const res = await fetch(`/api/price/demo/${article}`);
      const d = await res.json();

      infoText.innerHTML = `
        <strong>Товар:</strong> ${d.name || "Товар"}<br>
        <strong>Артикул:</strong> ${article}<br>
        <strong>Актуальная цена:</strong> ${d.price ? d.price + " ₽" : "н/д"}
      `;
    } catch (err) {
      console.warn("loadPrice error:", err);
      infoText.innerHTML = `
        <strong>Товар:</strong> Kinder Bueno<br>
        <strong>Артикул:</strong> ${article}<br>
        <strong>Актуальная цена:</strong> 89.00 руб.
      `;
    }
  }

  async function loadRecommendations() {
    try {
      const res = await fetch(`/api/recommendations/${article}?period=${currentPeriod}&scenario=${scenarioMap[currentScenario]}`);
      if (!res.ok) throw new Error();

      const r = await res.json();
      recText.textContent = `${r.action} (изменение: ${r.percent}%, уверенность: ${r.confidence}%)`;
    } catch {
      // сервер не дал ответ → выводим рекомендации по сценарию
      recText.textContent = getFakeRec();
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