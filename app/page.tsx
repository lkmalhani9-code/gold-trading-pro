
"use client";

import { useEffect, useState } from "react";

type Direction = "LONG" | "SHORT" | "WAIT";

type Coin = {
  symbol: string;
  name: string;
  icon: string;
};

type Signal = {
  symbol: string;
  name: string;
  icon: string;
  direction: Direction;
  price: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rsi: number;
  ema20: number;
  ema50: number;
  atr: number;
};

const COINS: Coin[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },
  { symbol: "BNBUSDT", name: "BNB", icon: "◆" },
  { symbol: "SOLUSDT", name: "Solana", icon: "◎" },
  { symbol: "XRPUSDT", name: "XRP", icon: "✕" },
  { symbol: "ADAUSDT", name: "Cardano", icon: "₳" },
  { symbol: "DOGEUSDT", name: "Dogecoin", icon: "Ð" },
  { symbol: "TRXUSDT", name: "TRON", icon: "◈" },
  { symbol: "LINKUSDT", name: "Chainlink", icon: "⬡" },
  { symbol: "LTCUSDT", name: "Litecoin", icon: "Ł" },
];

type Candle = {
  high: number;
  low: number;
  close: number;
};

function calculateEMA(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

function calculateRSI(values: number[], period = 14) {
  let gains = 0;
  let losses = 0;

  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];

    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) return 100;

  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

function calculateATR(candles: Candle[], period = 14) {
  const ranges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    ranges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );
  }

  const recent = ranges.slice(-period);
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}

async function getSignal(coin: Coin): Promise<Signal> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=15m&limit=100`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Market data unavailable");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length < 50) {
    throw new Error("Insufficient market data");
  }

  const closed = data.slice(0, -1);

  const candles: Candle[] = closed.map((item: unknown[]) => ({
    high: Number(item[2]),
    low: Number(item[3]),
    close: Number(item[4]),
  }));

  const closes = candles.map((candle) => candle.close);
  const price = closes[closes.length - 1];

  const ema20 = calculateEMA(closes.slice(-60), 20);
  const ema50 = calculateEMA(closes.slice(-80), 50);
  const rsi = calculateRSI(closes);
  const atr = calculateATR(candles);

  let direction: Direction = "WAIT";

  if (ema20 > ema50 && rsi >= 52 && rsi <= 68) {
    direction = "LONG";
  } else if (ema20 < ema50 && rsi >= 32 && rsi <= 48) {
    direction = "SHORT";
  }

  const entry = price;
  const distance = atr * 1.5;

  const stopLoss =
    direction === "LONG"
      ? entry - distance
      : entry + distance;

  const takeProfit =
    direction === "LONG"
      ? entry + distance * 2
      : entry - distance * 2;

  return {
    symbol: coin.symbol,
    name: coin.name,
    icon: coin.icon,
    direction,
    price,
    entry,
    stopLoss,
    takeProfit,
    rsi,
    ema20,
    ema50,
    atr,
  };
}

function money(value: number) {
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const [balance, setBalance] = useState("100");
  const [riskPercent, setRiskPercent] = useState("1");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const results = await Promise.all(
          COINS.map(async (coin) => {
            try {
              return await getSignal(coin);
            } catch {
              return null;
            }
          })
        );

        if (!active) return;

        const valid = results.filter(
          (item): item is Signal => item !== null
        );

        setSignals(valid);
        setError(
          valid.length === 0
            ? "Market data unavailable. Please try again."
            : ""
        );
        setUpdatedAt(new Date().toLocaleTimeString());
      } catch {
        if (active) {
          setError("Unable to load market data.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    refresh();

    const timer = setInterval(refresh, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const account = Math.max(0, Number(balance) || 0);
  const risk = Math.min(100, Math.max(0, Number(riskPercent) || 0));
  const riskAmount = account * risk / 100;

  const longCount = signals.filter((s) => s.direction === "LONG").length;
  const shortCount = signals.filter((s) => s.direction === "SHORT").length;
  const waitCount = signals.filter((s) => s.direction === "WAIT").length;

  const visibleSignals = signals.filter((s) =>
    filter === "ALL" ? true : s.direction === filter
  );

  return (
    <main className="site">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: #080d18;
          color: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
        }
        button, input { font: inherit; }
        .site { min-height: 100vh; background: #080d18; }
        .container { width: min(1160px, 92%); margin: auto; }
        .navbar {
          border-bottom: 1px solid #1d293b;
          background: #0b1220;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-inner {
          min-height: 68px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .brand { font-size: 19px; font-weight: 800; letter-spacing: -.5px; }
        .brand span { color: #38bdf8; }
        .nav-links { display: flex; gap: 22px; flex-wrap: wrap; }
        .nav-links a {
          color: #a6b4c8;
          text-decoration: none;
          font-size: 13px;
        }
        .nav-links a:hover { color: #38bdf8; }
        .hero { padding: 65px 0 38px; }
        .eyebrow {
          color: #38bdf8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        h1 {
          font-size: clamp(34px, 6vw, 58px);
          line-height: 1.08;
          max-width: 760px;
          margin: 17px 0;
          letter-spacing: -2px;
        }
        .hero p {
          color: #9aaac0;
          line-height: 1.8;
          max-width: 650px;
          font-size: 15px;
        }
        .hero-actions { display: flex; gap: 12px; margin-top: 25px; flex-wrap: wrap; }
        .btn {
          padding: 12px 18px;
          border-radius: 9px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          background: #38bdf8;
          color: #07111f;
        }
        .btn.secondary {
          background: #172337;
          color: #e2e8f0;
          border: 1px solid #2a3b53;
        }
        .section { padding: 30px 0; }
        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        h2 { font-size: 23px; margin: 0 0 7px; }
        .muted { color: #8fa0b8; font-size: 13px; }
        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 13px;
        }
        .panel, .stat, .signal-card {
          background: #101a2b;
          border: 1px solid #1e2c42;
          border-radius: 13px;
        }
        .stat { padding: 19px; }
        .stat-label { color: #91a2ba; font-size: 12px; }
        .stat-value { font-size: 27px; font-weight: 800; margin-top: 10px; }
        .blue { color: #38bdf8; }
        .green { color: #34d399; }
        .red { color: #fb7185; }
        .yellow { color: #fbbf24; }
        .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-button {
          background: #111d30;
          color: #9fb0c7;
          border: 1px solid #293950;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .filter-button.active {
          background: #12334a;
          color: #7dd3fc;
          border-color: #287ca5;
        }
        .signal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .signal-card { padding: 18px; }
        .coin-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .coin-name { font-size: 16px; font-weight: 700; }
        .coin-symbol { color: #8fa0b8; font-size: 11px; margin-top: 5px; }
        .coin-icon {
          display: inline-grid;
          place-items: center;
          width: 35px;
          height: 35px;
          background: #1a2a40;
          color: #7dd3fc;
          border-radius: 10px;
          margin-right: 10px;
          font-weight: 800;
        }
        .signal-badge {
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 800;
        }
        .badge-long { background: #123d34; color: #6ee7b7; }
        .badge-short { background: #48232e; color: #fda4af; }
        .badge-wait { background: #463719; color: #fcd34d; }
        .price-line {
          margin: 20px 0;
          font-size: 24px;
          font-weight: 800;
        }
        .data-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }
        .data-item {
          background: #0b1423;
          border-radius: 8px;
          padding: 11px;
          min-width: 0;
        }
        .data-label { color: #8496af; font-size: 10px; margin-bottom: 7px; }
        .data-value { font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
        .indicator-line {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid #213047;
          margin-top: 14px;
          padding-top: 12px;
          color: #93a4bb;
          font-size: 11px;
        }
        .panel { padding: 23px; }
        .calculator {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: center;
        }
        .field { margin-top: 15px; }
        .field label {
          display: block;
          color: #9aabc0;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .field input {
          width: 100%;
          padding: 13px;
          border: 1px solid #2a3b53;
          background: #0b1423;
          color: white;
          border-radius: 8px;
          outline: none;
        }
        .risk-result {
          background: #0b1423;
          border: 1px solid #233650;
          border-radius: 12px;
          padding: 22px;
        }
        .risk-result strong { display: block; font-size: 30px; margin: 10px 0; }
        .academy-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .academy-card {
          background: #101a2b;
          border: 1px solid #1e2c42;
          border-radius: 12px;
          padding: 20px;
        }
        .academy-card h3 { font-size: 15px; }
        .academy-card p {
          color: #94a5bc;
          font-size: 13px;
          line-height: 1.7;
        }
        .notice {
          border: 1px solid #544326;
          background: #211b12;
          color: #e8c98b;
          padding: 17px;
          border-radius: 10px;
          line-height: 1.7;
          font-size: 12px;
        }
        footer {
          border-top: 1px solid #1e2c42;
          padding: 25px 0;
          color: #8293aa;
          font-size: 12px;
          margin-top: 35px;
        }
        .loading {
          padding: 35px;
          text-align: center;
          color: #9fb0c7;
          background: #101a2b;
          border-radius: 12px;
        }
        @media (max-width: 700px) {
          .nav-inner { align-items: flex-start; flex-direction: column; padding: 15px 0; }
          .nav-links { gap: 14px; }
          .hero { padding-top: 42px; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          .signal-grid, .calculator { grid-template-columns: 1fr; }
          .academy-grid { grid-template-columns: 1fr; }
          .data-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <header className="navbar">
        <div className="container nav-inner">
          <div className="brand">CRYPTO <span>SIGNALS PRO</span></div>
          <nav className="nav-links">
            <a href="#markets">Markets</a>
            <a href="#signals">Signals</a>
            <a href="#risk">Risk Calculator</a>
            <a href="#academy">Academy</a>
          </nav>
        </div>
      </header>

      <section className="hero container">
        <div className="eyebrow">Market education · Data · Discipline</div>
        <h1>Understand the market. <span className="blue">Plan every trade.</span></h1>
        <p>
          Explore crypto market indicators, understand rule-based signals
          and learn why risk management matters. Build knowledge before
          making decisions.
        </p>
        <div className="hero-actions">
          <a className="btn" href="#signals">Explore Market Signals</a>
          <a className="btn secondary" href="#academy">Learn Trading Basics</a>
        </div>
      </section>

      <section className="section container" id="markets">
        <div className="section-heading">
          <div>
            <h2>Market Overview</h2>
            <div className="muted">10 selected cryptocurrency markets · 15-minute timeframe</div>
          </div>
          <div className="muted">
            {updatedAt ? `Updated ${updatedAt}` : "Connecting to market data..."}
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-label">Markets tracked</div>
            <div className="stat-value blue">{signals.length}/10</div>
          </div>
          <div className="stat">
            <div className="stat-label">LONG setups</div>
            <div className="stat-value green">{longCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">SHORT setups</div>
            <div className="stat-value red">{shortCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">WAIT / No setup</div>
            <div className="stat-value yellow">{waitCount}</div>
          </div>
        </div>
      </section>

      <section className="section container" id="signals">
        <div className="section-heading">
          <div>
            <h2>Trading Signals</h2>
            <div className="muted">EMA 20/50 · RSI 14 · ATR 14 · Rule-based analysis</div>
          </div>
          <div className="filter-row">
            {["ALL", "LONG", "SHORT", "WAIT"].map((item) => (
              <button
                key={item}
                className={`filter-button ${filter === item ? "active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading">Loading market data...</div>}

        {error && <div className="notice">{error}</div>}

        {!loading && visibleSignals.length === 0 && !error && (
          <div className="loading">No markets match this filter.</div>
        )}

        <div className="signal-grid">
          {visibleSignals.map((signal) => (
            <article className="signal-card" key={signal.symbol}>
              <div className="coin-head">
                <div>
                  <div className="coin-name">
                    <span className="coin-icon">{signal.icon}</span>
                    {signal.name}
                  </div>
                  <div className="coin-symbol">{signal.symbol} · 15m</div>
                </div>
                <span className={`signal-badge ${
                  signal.direction === "LONG"
                    ? "badge-long"
                    : signal.direction === "SHORT"
                    ? "badge-short"
                    : "badge-wait"
                }`}>
                  {signal.direction}
                </span>
              </div>

              <div className="price-line">{money(signal.price)}</div>

              <div className="data-grid">
                <div className="data-item">
                  <div className="data-label">ENTRY</div>
                  <div className="data-value">{money(signal.entry)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">STOP LOSS</div>
                  <div className="data-value red">{money(signal.stopLoss)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">TAKE PROFIT</div>
                  <div className="data-value green">{money(signal.takeProfit)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">RSI 14</div>
                  <div className="data-value">{signal.rsi.toFixed(2)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">EMA 20</div>
                  <div className="data-value">{money(signal.ema20)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">EMA 50</div>
                  <div className="data-value">{money(signal.ema50)}</div>
                </div>
              </div>

              <div className="indicator-line">
                <span>ATR 14</span>
                <strong>{money(signal.atr)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section container" id="risk">
        <div className="section-heading">
          <div>
            <h2>Risk Calculator</h2>
            <div className="muted">Plan a maximum risk amount before considering a trade.</div>
          </div>
        </div>

        <div className="panel calculator">
          <div>
            <div className="field">
              <label>Account balance (USD)</label>
              <input
                type="number"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Risk percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                valu
