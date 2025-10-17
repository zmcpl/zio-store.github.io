const priceEl = document.getElementById("price");
const balanceEl = document.getElementById("balance");
const historyBody = document.querySelector("#history tbody");
const amountEl = document.getElementById("amount");
const updateTimeEl = document.getElementById("update-time");
const priceWrapperEl = document.querySelector(".price-wrapper");

let balance = parseFloat(localStorage.getItem("balance")) || 10000;
let investments = JSON.parse(localStorage.getItem("investments") || "[]");
let prices = [];
let chart;
let lastPrice = null;

const GRAM_PER_OUNCE = 31.1035;

// Pobranie kursu USD/PLN
async function fetchUsdPln() {
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=PLN");
    const data = await res.json();
    return data.rates.PLN || 3.63;
  } catch (err) {
    console.error("Błąd pobrania kursu USD/PLN:", err);
    return 3.63;
  }
}

// Pobranie ceny złota i przeliczenie na PLN/g
async function fetchGoldPrice() {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU");
    const data = await res.json();
    const goldPriceUsdPerOunce = data.price;
    const usdPln = await fetchUsdPln();
    return (goldPriceUsdPerOunce * usdPln) / GRAM_PER_OUNCE;
  } catch (err) {
    console.error("Błąd pobrania ceny złota:", err);
    return prices.length ? prices[prices.length - 1] : 500;
  }
}

// Animacja ceny (pełny cykl fade-out)
function animatePriceUpdate(price, changeDirection) {
  priceEl.classList.remove("price-up", "price-down", "price-stable");
  priceWrapperEl.classList.remove("price-up-fade", "price-down-fade");
  void priceEl.offsetWidth;

  priceEl.textContent = `${price.toFixed(2)} PLN/g`;

  if (changeDirection === "up") {
    priceWrapperEl.classList.add("price-up-fade");
    priceEl.classList.add("price-up");
  } else if (changeDirection === "down") {
    priceWrapperEl.classList.add("price-down-fade");
    priceEl.classList.add("price-down");
  } else {
    priceEl.classList.add("price-stable");
  }

  priceWrapperEl.addEventListener("animationend", function handler() {
    priceWrapperEl.classList.remove("price-up-fade", "price-down-fade");
    priceEl.classList.remove("price-up", "price-down");
    priceEl.classList.add("price-stable");
    priceWrapperEl.removeEventListener("animationend", handler);
  });
}

// Aktualizacja ceny i wykresu
async function updatePrice() {
  const price = await fetchGoldPrice();
  let changeDirection = "stable";

  if (lastPrice !== null) {
    if (price > lastPrice) changeDirection = "up";
    else if (price < lastPrice) changeDirection = "down";
  }

  animatePriceUpdate(price, changeDirection);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("pl-PL");
  updateTimeEl.textContent = `Ostatnia aktualizacja: ${timeLabel}`;

  // Zachowujemy tylko 10 ostatnich punktów na wykresie
  prices.push({ price, time: timeLabel });
  if (prices.length > 10) prices.shift();

  lastPrice = price;

  if (chart) {
    chart.data.labels = prices.map(p => p.time);
    chart.data.datasets[0].data = prices.map(p => p.price);
    chart.update();
  }

  renderInvestments();
  renderBalance();
}

// Zapis stanu
function saveState() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("investments", JSON.stringify(investments));
}

// Render salda
function renderBalance() {
  balanceEl.textContent = balance.toFixed(2);
}

// Render historii inwestycji z zyskiem/stratą
function renderInvestments() {
  historyBody.innerHTML = "";

  investments.forEach((inv, i) => {
    const valueNow = inv.grams * lastPrice;
    const profitPLN = valueNow - inv.amount;
    const profitPercent = (profitPLN / inv.amount) * 100;

    const profitColor = profitPLN >= 0 ? "var(--color-accent-green)" : "var(--color-accent-red)";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Zakup</td>
      <td>${inv.amount.toFixed(2)}</td>
      <td>${inv.price.toFixed(2)}</td>
      <td>${inv.grams.toFixed(3)}</td>
      <td style="color:${profitColor}">${profitPLN.toFixed(2)} (${profitPercent.toFixed(2)}%)</td>
      <td>${inv.time}</td>
      <td><button onclick="sell(${i})">Sprzedaj</button></td>
    `;
    historyBody.appendChild(tr);
  });
}

// Kupno inwestycji
function buy() {
  const amount = parseFloat(amountEl.value);
  if (!amount || amount <= 0) return console.error("Podaj kwotę!");
  if (amount > balance) return console.error("Za mało środków!");

  const grams = amount / lastPrice;
  const now = new Date();

  investments.unshift({
    amount,
    grams,
    price: lastPrice,
    time: now.toLocaleTimeString("pl-PL"),
  });

  balance -= amount;
  amountEl.value = "";
  saveState();

  setTimeout(() => {
    renderInvestments();
    renderBalance();
  }, 0);
}

function sell(idx) {
  const inv = investments[idx];
  const valueNow = inv.grams * lastPrice;
  balance += valueNow;
  investments.splice(idx, 1);
  saveState();

  setTimeout(() => {
    renderInvestments();
    renderBalance();
  }, 0);
}

// Inicjalizacja wykresu
function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map(p => p.time),
      datasets: [{
        label: "Cena złota 999.99 (PLN/g)",
        data: prices.map(p => p.price),
        borderColor: "var(--color-accent-gold)",
        backgroundColor: "rgba(255,215,0,0.1)",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const i = context.dataIndex;
              const current = prices[i].price;
              const prev = i > 0 ? prices[i-1].price : current;
              const changePercent = ((current - prev)/prev*100).toFixed(2);
              return [
                `Godz: ${prices[i].time}`,
                `Kurs: ${current.toFixed(2)} zł/g`,
                `Wzrost/Spadek: ${changePercent}%`
              ];
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

// Odświeżanie co 30 sekund na pełną minutę
function startAutoUpdate() {
  const now = new Date();
  const delay = (30 - now.getSeconds() % 30) * 1000;

  setTimeout(() => {
    updatePrice();
    setInterval(updatePrice, 30000);
  }, delay);
}

// Start aplikacji
function start() {
  renderBalance();
  initChart();
  updatePrice();
  startAutoUpdate();
  document.getElementById("buy").addEventListener("click", buy);
}

start();
