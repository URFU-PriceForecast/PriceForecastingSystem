document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cardsContainer");
  const addBtn = document.getElementById("addBtn");
  const modal = document.getElementById("modal");
  const saveBtn = document.getElementById("saveCard");
  const closeBtn = document.getElementById("closeModal");
  const input = document.getElementById("articleInput");

  let storedCards = JSON.parse(localStorage.getItem("cards")) || [];

  storedCards.forEach(c => loadCard(c.article));

  addBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    input.value = "";
    input.focus();
  });

  closeBtn.addEventListener("click", () => modal.style.display = "none");

  saveBtn.addEventListener("click", () => {
    const article = input.value.trim();
    if (!article) return alert("Введите артикул!");
    saveCard(article);
    loadCard(article);
    modal.style.display = "none";
  });

  async function loadCard(article) {
    const card = createEmptyCard(article);

    try {
      console.log(`Loading card for article: ${article}`);
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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

      const priceInfo = await res.json();
      console.log('Price info received:', priceInfo);

      // Update card content
      card.querySelector("h3").textContent = priceInfo.product?.Name || `Артикул ${article}`;
      card.querySelector(".info").textContent =
      `Цена: ${priceInfo.price}₽, обновлено: ${priceInfo.date}`;

      // Update stats
      updateStats();

    } catch (err) {
      console.error('Error loading card:', err);
      card.querySelector("h3").textContent = `Артикул ${article}`;
      card.querySelector(".info").textContent = `Ошибка загрузки: ${err.message}`;
      showNotification(`Не удалось загрузить данные для артикула ${article}`, 'error');
    }

    container.appendChild(card);
  }

  function createEmptyCard(article) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-article", article);

    card.innerHTML = `
      <button class="delete-btn">✖</button>
      <h3>${article}</h3>
      <p class="info">Загрузка...</p>
      <button class="btn">Подробнее</button>`
    ;

    card.querySelector(".delete-btn").onclick = () => deleteCard(article, card);

    card.querySelector(".btn").onclick = () => {
      window.location = `details.html?article=${article}`;
    };

    return card;
  }

  function saveCard(article) {
    storedCards.push({ article });
    localStorage.setItem("cards", JSON.stringify(storedCards));
  }

  function deleteCard(article, cardElement) {
    storedCards = storedCards.filter(c => c.article !== article);
    localStorage.setItem("cards", JSON.stringify(storedCards));
    cardElement.remove();
  }

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Initialize stats on page load
  updateStats();
});

// Stats update function
function updateStats() {
  const cards = JSON.parse(localStorage.getItem("cards")) || [];
  const totalProducts = cards.length;

  // Update stats if elements exist
  const totalProductsEl = document.getElementById("totalProducts");
  const activeAlertsEl = document.getElementById("activeAlerts");

  if (totalProductsEl) totalProductsEl.textContent = totalProducts;
  if (activeAlertsEl) {
    // Simulate active alerts (60% of products have recommendations)
    const activeAlerts = Math.floor(totalProducts * 0.6);
    activeAlertsEl.textContent = activeAlerts;

    if (activeAlerts > 0 && window.DashboardUtils) {
      window.DashboardUtils.showNotification(`У вас ${activeAlerts} активных рекомендаций по ценам`, "info");
    }
  }
}

// Notification function (fallback if DashboardUtils not available)
function showNotification(message, type = "info") {
  if (window.DashboardUtils && window.DashboardUtils.showNotification) {
    window.DashboardUtils.showNotification(message, type);
  } else {
    console.log(`Notification (${type}): ${message}`);
    // Fallback: show alert for important messages
    if (type === 'error') {
      alert(`Ошибка: ${message}`);
    }
  }
}