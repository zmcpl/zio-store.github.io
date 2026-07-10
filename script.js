const priceEl = document.getElementById("price");
const priceChangeEl = document.getElementById("price-change");
const balanceEl = document.getElementById("balance");
const historyBody = document.querySelector("#history tbody");
const historyTable = document.getElementById("history");
const historyCountEl = document.getElementById("history-count");
const emptyStateEl = document.getElementById("empty-state");
const amountEl = document.getElementById("amount");
const buyForm = document.getElementById("buy-form");
const updateTimeEl = document.getElementById("update-time");
const priceWrapperEl = document.querySelector(".price-wrapper");
const balanceChipEl = document.querySelector(".balance-value");
const tickerTrackEl = document.getElementById("ticker-track");
const toastStackEl = document.getElementById("toast-stack");
const statPortfolioEl = document.getElementById("stat-portfolio");
const statInvestedEl = document.getElementById("stat-invested");
const statPlEl = document.getElementById("stat-pl");

let balance = parseFloat(localStorage.getItem("balance")) || 10000;
let investments = JSON.parse(localStorage.getItem("investments") || "[]");
let prices = [];
let chart;
let lastPrice = null;

const GRAM_PER_OUNCE = 31.1035;

// ============================================================
// TOASTY
// ============================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStackEl.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 3200);
}

// ============================================================
// POBIERANIE KURSU
// ============================================================
async function fetchUsdPln() {
  try {
    const res = await fetch("https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=xml");
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const rate = xml.querySelector("Mid");
    if (rate) return parseFloat(rate.textContent);
    return 3.63;
  } catch (err) {
    console.error("Błąd pobrania kursu USD/PLN (NBP):", err);
    return 3.63;
  }
}

async function fetchGoldPrice() {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU");
    const data = await res.json();
    const goldPriceUsdPerOunce = data.price;
    const usdPln = await fetchUsdPln();
    return (goldPriceUsdPerOunce * usdPln) / GRAM_PER_OUNCE;
  } catch (err) {
    console.error("Błąd pobrania ceny złota:", err);
    return prices.length ? prices[prices.length - 1].price : 500;
  }
}

// ============================================================
// ANIMACJA CENY
// ============================================================
function animatePriceUpdate(price, changeDirection, changePercent) {
  priceEl.classList.remove("price-up", "price-down");
  priceWrapperEl.classList.remove("flash-up", "flash-down");
  void priceEl.offsetWidth;

  priceEl.textContent = `${price.toFixed(2)} zł/g`;

  if (changeDirection === "up") {
    priceWrapperEl.classList.add("flash-up");
    priceEl.classList.add("price-up");
    priceChangeEl.textContent = `▲ ${changePercent}%`;
    priceChangeEl.className = "price-change up";
  } else if (changeDirection === "down") {
    priceWrapperEl.classList.add("flash-down");
    priceEl.classList.add("price-down");
    priceChangeEl.textContent = `▼ ${changePercent}%`;
    priceChangeEl.className = "price-change down";
  } else {
    priceChangeEl.textContent = "bez zmian";
    priceChangeEl.className = "price-change";
  }
}

// ============================================================
// TICKER TAPE
// ============================================================
function renderTicker() {
  if (!prices.length) return;

  const items = prices.map((p, i) => {
    const prev = i > 0 ? prices[i - 1].price : p.price;
    const dir = p.price > prev ? "up" : p.price < prev ? "down" : "";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    return `<span class="ticker-item ${dir}">XAU/PLN <span class="t-price">${arrow} ${p.price.toFixed(2)}</span><span class="t-time">${p.time}</span></span>`;
  });

  // duplikujemy zestaw, żeby przewijanie było płynne w pętli
  tickerTrackEl.innerHTML = items.join("") + items.join("");
}

// ============================================================
// GŁÓWNA AKTUALIZACJA
// ============================================================
async function updatePrice() {
  const price = await fetchGoldPrice();
  let changeDirection = "stable";
  let changePercent = "0.00";

  if (lastPrice !== null) {
    if (price > lastPrice) changeDirection = "up";
    else if (price < lastPrice) changeDirection = "down";
    changePercent = (((price - lastPrice) / lastPrice) * 100).toFixed(2);
  }

  animatePriceUpdate(price, changeDirection, changePercent);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("pl-PL");
  updateTimeEl.textContent = `Ostatnia aktualizacja: ${timeLabel}`;

  prices.push({ price, time: timeLabel });
  if (prices.length > 10) prices.shift();

  lastPrice = price;

  if (chart) {
    chart.data.labels = prices.map(p => p.time);
    chart.data.datasets[0].data = prices.map(p => p.price);
    chart.update();
  }

  renderTicker();
  renderInvestments();
  renderBalance();
  renderStats();
}

// ============================================================
// STAN / PORTFEL
// ============================================================
function saveState() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("investments", JSON.stringify(investments));
}

function renderBalance() {
  balanceEl.textContent = balance.toFixed(2);
}

function bumpBalance() {
  balanceChipEl.classList.remove("bump");
  void balanceChipEl.offsetWidth;
  balanceChipEl.classList.add("bump");
}

function renderStats() {
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const portfolioValue = lastPrice ? investments.reduce((sum, inv) => sum + inv.grams * lastPrice, 0) : 0;
  const totalPl = portfolioValue - totalInvested;

  statInvestedEl.textContent = `${totalInvested.toFixed(2)} PLN`;
  statPortfolioEl.textContent = `${portfolioValue.toFixed(2)} PLN`;
  statPlEl.textContent = `${totalPl >= 0 ? "+" : ""}${totalPl.toFixed(2)} PLN`;
  statPlEl.classList.toggle("positive", totalPl > 0);
  statPlEl.classList.toggle("negative", totalPl < 0);
}

function renderInvestments() {
  historyBody.innerHTML = "";

  const hasItems = investments.length > 0;
  emptyStateEl.classList.toggle("visible", !hasItems);
  historyTable.classList.toggle("hidden", !hasItems);
  historyCountEl.textContent = `${investments.length} ${pluralPozycje(investments.length)}`;

  investments.forEach((inv, i) => {
    const valueNow = inv.grams * lastPrice;
    const profitPLN = valueNow - inv.amount;
    const profitPercent = (profitPLN / inv.amount) * 100;
    const plClass = profitPLN >= 0 ? "pl-positive" : "pl-negative";
    const sign = profitPLN >= 0 ? "+" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Zakup</td>
      <td>${inv.amount.toFixed(2)}</td>
      <td>${inv.price.toFixed(2)}</td>
      <td>${inv.grams.toFixed(3)} g</td>
      <td class="${plClass}">${sign}${profitPLN.toFixed(2)} (${sign}${profitPercent.toFixed(2)}%)</td>
      <td>${inv.time}</td>
      <td><button class="sell-btn" type="button" data-idx="${i}">Sprzedaj</button></td>
    `;
    historyBody.appendChild(tr);
  });
}

function pluralPozycje(n) {
  if (n === 1) return "pozycja";
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "pozycje";
  return "pozycji";
}

// ============================================================
// KUPNO / SPRZEDAŻ
// ============================================================
function buy(amountOverride) {
  const amount = amountOverride ?? parseFloat(amountEl.value);

  if (!amount || amount <= 0) {
    showToast("Podaj poprawną kwotę inwestycji.", "error");
    return;
  }
  if (amount > balance) {
    showToast("Za mało środków na koncie.", "error");
    return;
  }
  if (!lastPrice) {
    showToast("Kurs jeszcze się wczytuje, spróbuj za chwilę.", "error");
    return;
  }

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
  bumpBalance();
  showToast(`Kupiono ${grams.toFixed(3)} g złota za ${amount.toFixed(2)} PLN.`, "success");

  renderInvestments();
  renderBalance();
  renderStats();
}

function sell(idx) {
  const inv = investments[idx];
  if (!inv) return;
  const valueNow = inv.grams * lastPrice;
  const profit = valueNow - inv.amount;

  balance += valueNow;
  investments.splice(idx, 1);
  saveState();
  bumpBalance();

  const verb = profit >= 0 ? "zyskiem" : "stratą";
  showToast(`Sprzedano za ${valueNow.toFixed(2)} PLN (z ${verb} ${Math.abs(profit).toFixed(2)} PLN).`, profit >= 0 ? "success" : "info");

  renderInvestments();
  renderBalance();
  renderStats();
}

// ============================================================
// WYKRES
// ============================================================
function initChart() {
  const ctx = document.getElementById("chart").getContext("2d");
  const styles = getComputedStyle(document.documentElement);
  const gold = styles.getPropertyValue("--gold").trim() || "#d4af37";
  const textSecondary = styles.getPropertyValue("--text-secondary").trim() || "#a89f8c";
  const border = styles.getPropertyValue("--border-soft").trim() || "#2a2418";

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map(p => p.time),
      datasets: [{
        label: "Cena złota 999.9 (PLN/g)",
        data: prices.map(p => p.price),
        borderColor: gold,
        backgroundColor: "rgba(212, 175, 55, 0.08)",
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: gold,
        pointBorderColor: "#0a0907",
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#161310",
          borderColor: border,
          borderWidth: 1,
          titleColor: "#f3ecdb",
          bodyColor: "#a89f8c",
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const i = context.dataIndex;
              const current = prices[i].price;
              const prev = i > 0 ? prices[i - 1].price : current;
              const changePercent = (((current - prev) / prev) * 100).toFixed(2);
              return [`Kurs: ${current.toFixed(2)} zł/g`, `Zmiana: ${changePercent}%`];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textSecondary, font: { family: "JetBrains Mono", size: 11 } },
          grid: { color: border },
        },
        y: {
          beginAtZero: false,
          ticks: { color: textSecondary, font: { family: "JetBrains Mono", size: 11 } },
          grid: { color: border },
        }
      }
    }
  });
}

// ============================================================
// AUTO-ODŚWIEŻANIE
// ============================================================
function startAutoUpdate() {
  const now = new Date();
  const delay = (30 - (now.getSeconds() % 30)) * 1000;

  setTimeout(() => {
    updatePrice();
    setInterval(updatePrice, 30000);
  }, delay);
}

// ============================================================
// START
// ============================================================
function start() {
  renderBalance();
  renderInvestments();
  renderStats();
  initChart();
  updatePrice();
  startAutoUpdate();

  buyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    buy();
  });

  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pct = parseFloat(btn.dataset.pct);
      amountEl.value = (balance * pct).toFixed(2);
    });
  });

  historyBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".sell-btn");
    if (!btn) return;
    sell(parseInt(btn.dataset.idx, 10));
  });
}

start();
