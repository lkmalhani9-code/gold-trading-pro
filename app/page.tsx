
"use client";

import { useEffect, useState } from "react";
import RiskCalculator from "../components/RiskCalculator";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function getGoldPrice() {
      try {
        const response = await fetch("/api/gold", {
          cache: "no-store"
        });

        if (!response.ok) throw new Error("Price unavailable");

        const data = await response.json();
        const value = Number(data.spot_usd_oz);

        if (!Number.isFinite(value) || value <= 0) {
          throw new Error("Invalid price data");
        }

        if (active) {
          setPrice(value);
          setUpdatedAt(data.updated_at || new Date().toISOString());
          setError("");
        }
      } catch {
        if (active) setError("Live price temporarily unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }

    getGoldPrice();
    const timer = setInterval(getGoldPrice, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const metrics = [
    { label: "Market", value: "XAU / USD", note: "Gold vs US Dollar" },
    { label: "Timeframe", value: "5 min", note: "TradingView chart" },
    { label: "Trend status", value: "Chart connected", note: "Visual market data" }
  ];

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <div>
            <strong>GOLD TRADING PRO</strong>
            <small>MARKET INTELLIGENCE</small>
          </div>
        </div>
        <span className="status"><i /> LIVE PRICE FEED</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">TRADING WORKSPACE</p>
          <h1>Trade with a <em>clear plan.</em></h1>
          <p className="sub">
            A focused workspace for gold-market observation,
            technical analysis and disciplined risk planning.
          </p>
        </div>

        <div className="hero-price">
          <small>XAU/USD SPOT PRICE</small>
          <strong>
            {loading && price === null
              ? "Loading..."
              : price !== null
              ? `$${price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : "Unavailable"}
          </strong>
          <span>
            {error || (updatedAt
              ? `Updated: ${new Date(updatedAt).toLocaleTimeString()}`
              : "Connecting to price source...")}
          </span>
          <span>Source: xaus.com · Indicative spot price</span>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((m) => (
          <article className="metric" key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
            <span>{m.note}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LIVE MARKET CHART</p>
              <h2>Gold 5-minute chart</h2>
            </div>
            <span className="tag">TRADINGVIEW</span>
          </div>

          <div style={{ width: "100%", height: "480px", overflow: "hidden" }}>
            <iframe
              title="XAU USD Gold Live Chart"
              src="https://s.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&locale=en"
              style={{
                width: "100%",
                height: "100%",
                border: "0"
              }}
              allowFullScreen
              loading="lazy"
            />
          </div>

          <p className="notice">
            TradingView chart data may differ from Exness prices.
            This chart is for market observation, not a trading signal.
          </p>
        </article>

        <article className="panel analysis-panel">
          <p className="eyebrow">ANALYSIS STATUS</p>
          <h2>Technical overview</h2>
          <div className="indicator">
            <span>EMA 20 / EMA 50</span>
            <b>Not calculated</b>
          </div>
          <div className="indicator">
            <span>RSI (14)</span>
            <b>Not calculated</b>
          </div>
          <div className="indicator">
            <span>MACD</span>
            <b>Not calculated</b>
          </div>
          <div className="indicator">
            <span>ATR (14)</span>
            <b>Not calculated</b>
          </div>
          <p className="notice">
            Technical indicators are not connected yet.
            No buy/sell signal is being issued.
          </p>
        </article>
      </section>

      <section className="panel calculator-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">POSITION PLANNING</p>
            <h2>Risk calculator</h2>
          </div>
          <span className="tag">ESTIMATE</span>
        </div>
        <RiskCalculator />
      </section>

      <footer>
        Gold Trading Pro · Educational tool only. Trading involves risk.
      </footer>
    </main>
  );
      }
