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
      const res = await fetch(`http://localhost:5229/api/price/demo/${article}`);
      const priceInfo = await res.json();

      card.querySelector(".info").textContent =
      `Цена: ${priceInfo.price}₽, обновлено: ${priceInfo.date}`;

    } catch (err) {
      card.querySelector(".info").textContent = "Ошибка загрузки";
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
});