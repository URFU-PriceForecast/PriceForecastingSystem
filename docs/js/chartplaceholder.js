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

  let currentScenario = "positive"; // positive / neutral / negative
  let currentPeriod = 30;           // 7 / 30 / 90

  const scenarioMap = {
    positive: "optimist",
    neutral: "neutral",
    negative: "pessimist"
  };

  // Фейковые рекомендации по сценариям (fallback, если API недоступно)
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


  const optimistReasons = [
    "для максимизации прибыли",
    "для опережения рыночного роста",
    "для использования благоприятной конъюнктуры",
    "для увеличения маржинальности"
  ];

  const pessimistReasons = [
    "для минимизации рисков",
    "для защиты от падения продаж",
    "для ускорения товарооборота",
    "для сохранения конкурентного преимущества"
  ];

  const holdReasons = [
    "из-за неопределенности на рынке",
    "для наблюдения за развитием ситуации",
    "так как текущая цена оптимальна",
    "из-за недостаточной уверенности в прогнозе"
  ];

  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function normalizeRecommendation(raw) {
    // 1) price_action
    const actionRaw = (raw?.PriceAction || "").toString().toLowerCase();
    let price_action = "hold";
    if (actionRaw === "increase" || actionRaw === "decrease" || actionRaw === "hold") {
      price_action = actionRaw;
    }

    // 2) percentage (-25.0..25.0, 1 decimal, знак по действию)
    let base = Number(raw?.Percentage);
    if (!isFinite(base)) base = 0;
    let absBase = Math.min(Math.abs(base), 25);
    let percentage;

    if (price_action === "increase") {
      percentage = +absBase;
    } else if (price_action === "decrease") {
      percentage = -absBase;
    } else {
      percentage = 0;
    }
    percentage = Number(percentage.toFixed(1));

    // 3) confidence (0.00..1.00, 2 decimals)
    let confidence = Number(raw?.Confidence);
    if (!isFinite(confidence)) confidence = 0;
    if (confidence < 0) confidence = 0;
    if (confidence > 1) confidence = 1;
    confidence = Number(confidence.toFixed(2));

    // 4) timeframe
    let timeframe;
    if (price_action === "hold" || percentage === 0) {
      timeframe = "наблюдать";
    } else {
      const absP = Math.abs(percentage);
      if (absP >= 15) timeframe = "немедленно";
      else if (absP >= 10) timeframe = "1-3 дня";
      else if (absP >= 5) timeframe = "3-7 дней";
      else timeframe = "7-14 дней";
    }

    // 5) analytics (past/future)
    const past_period = currentPeriod;
    const future_period = currentPeriod;

    // прошлое: слабее, в ту же сторону, ограничиваем ±5%
    let past_change_raw = percentage * 0.5;
    if (past_change_raw > 5) past_change_raw = 5;
    if (past_change_raw < -5) past_change_raw = -5;
    const past_change_percent = Number(past_change_raw.toFixed(1));

    let past_trend;
    if (past_change_percent > 0) past_trend = "выросла";
    else if (past_change_percent < 0) past_trend = "упала";
    else past_trend = "изменилась менее чем на 5%";

    // будущее — как предсказано
    const future_change_percent = Number(percentage.toFixed(1));
    let future_trend;
    if (future_change_percent > 1) future_trend = "вырастет";
    else if (future_change_percent < -1) future_trend = "упадёт";
    else future_trend = "изменится менее чем на 5%";

    // действие по-русски
    let actionRu;
    if (price_action === "increase") actionRu = "повысить";
    else if (price_action === "decrease") actionRu = "понизить";
    else actionRu = "оставить";

    // причина (reason) в зависимости от сценария и действия
    const scenarioType = scenarioMap[currentScenario] || "neutral";

    let reason;
    if (actionRu === "оставить") {
      reason = getRandomItem(holdReasons);
    } else {
      if (scenarioType === "optimist") {
        reason = getRandomItem(optimistReasons);
      } else if (scenarioType === "pessimist") {
        reason = getRandomItem(pessimistReasons);
      } else {
        const mixed = optimistReasons.concat(pessimistReasons);
        reason = getRandomItem(mixed);
      }
    }

    const analytics = {
      past_trend,
      past_change_percent,
      past_period,
      future_trend,
      future_change_percent,
      future_period,
      action: actionRu,
      reason
    };

    const human_readable = {
      analysis:
        `Цена в последние ${analytics.past_period} дней ${analytics.past_trend} ` +
        `на ${analytics.past_change_percent}%. По прогнозу цена в ближайшие ` +
        `${analytics.future_period} дней ${analytics.future_trend} ` +
        `на ${analytics.future_change_percent}%.`,
      recommendation:
        `Рекомендуем ${analytics.action} цену на ${Math.abs(percentage).toFixed(1)}% ` +
        `в течение ${timeframe} ${analytics.reason}.`
    };

    const normalized = {
      price_action,
      percentage,
      timeframe,
      confidence,
      human_readable,
      analytics
    };

    console.log("Normalized recommendation object:", normalized);
    return normalized;
  }

  function buildRecommendationHtml(r) {
    if (!r) {
      return `<p>${getFakeRec()}</p>`;
    }

    const analysis = r.human_readable?.analysis || "";
    const recommendation = r.human_readable?.recommendation || "";
    const confPercent = typeof r.confidence === "number"
      ? Math.round(r.confidence * 100)
      : null;

    let moodSummary = "";
    switch (r.price_action) {
      case "increase":
        moodSummary =
          "Динамика выглядит положительной: можно аккуратно повышать цену и дополнительно заработать на ожидаемом росте.";
        break;
      case "decrease":
        moodSummary =
          "Динамика скорее отрицательная: снижение цены поможет сохранить спрос и конкурентоспособность.";
        break;
      case "hold":
        moodSummary =
          "Сильного сигнала к изменению цены нет: логично сохранить текущий уровень и наблюдать за ситуацией.";
        break;
      default:
        moodSummary = "";
    }

    return `
      <p><strong>Анализ динамики:</strong> ${analysis}</p>
      <p><strong>Рекомендация по цене:</strong> ${recommendation}</p>
      ${moodSummary ? `<p>${moodSummary}</p>` : ""}
      ${confPercent !== null ? `<p><em>Уверенность модели: ${confPercent}%.</em></p>` : ""}
    `;
  }

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

      const raw = await res.json();
      console.log("Raw Recommendations API Response:", JSON.stringify(raw, null, 2));

      const normalized = normalizeRecommendation(raw);
      const html = buildRecommendationHtml(normalized);

      if (recText) {
        recText.innerHTML = html;
      } else {
        console.error("recText element not found!");
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      if (recText) {
        recText.innerHTML = `
          <p>${getFakeRec()}</p>
          <p><em>Детальные рекомендации недоступны: используется базовый сценарий.</em></p>
        `;
      }
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

      let labels = data.dates || [];
      let values = data.values || [];

      console.log("Using labels:", labels.length, "values:", values.length);

      const validData = [];
      for (let i = 0; i < Math.min(labels.length, values.length); i++) {
        const value = values[i];
        if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
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
              borderColor:
                currentScenario === "positive"
                  ? "green"
                  : currentScenario === "negative"
                    ? "red"
                    : "blue",
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
        console.log("Chart created successfully!");
        hideSkeletons();
      } catch (chartError) {
        console.error("Chart creation error:", chartError);
      }

    } catch {
      // Оставляем существующий текст, если был
      if (recText) recText.textContent = recText.textContent;
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
