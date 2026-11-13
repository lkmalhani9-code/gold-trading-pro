"use client";

import { useEffect, useState } from "react";

type Candle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export default function Home() {
  const [symbol, setSymbol] = useState("XAU/USD");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMarket() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/market?symbol=${encodeURIComponent(symbol)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Data load nahi hua");
      }

      setCandles(data.values || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }

    setLoading(false);
  }
    useEffect(() => {
    loadMarket();
  }, [symbol]);

  const latest = candles[0];
  const price = latest ? Number(latest.close) : 0;
  const closes = [...candles]
    .reverse()
    .map(c => Number(c.close));

  function getEMA(period: number) {
    if (closes.length < period) return 0;

    const k = 2 / (period + 1);
    let ema = closes.slice(0, period)
      .reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }

    return ema;
  }

  const ema20 = getEMA(20);
  const ema50 = getEMA(50);
    const changes = closes.slice(1).map((v, i) => v - closes[i]);

  const gains = changes.map(v => Math.max(v, 0));
  const losses = changes.map(v => Math.max(-v, 0));

  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;

  const rsi = avgLoss === 0
    ? 100
    : 100 - (100 / (1 + avgGain / avgLoss));

  const signal =
    ema20 > ema50 && rsi > 50 && rsi < 70
      ? "LONG"
      : ema20 < ema50 && rsi < 50 && rsi > 30
      ? "SHORT"
      : "WAIT";

  const strength =
    signal === "WAIT"
      ? "No clear setup"
      : Math.abs(rsi - 50) >= 10
      ? "Strong conditions"
      : "Moderate conditions";
  return (
    <main style={{
      background: "#080d18",
      color: "white",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial"
    }}>
      <h1>Gold Trading Pro</h1>
      <p>Live Market Signals</p>

      <select
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        style={{ padding: "12px", width: "100%" }}
      >
        <option value="XAU/USD">Gold - XAU/USD</option>
        <option value="EUR/USD">EUR/USD</option>
        <option value="GBP/USD">GBP/USD</option>
        <option value="USD/JPY">USD/JPY</option>
        <option value="BTC/USD">Bitcoin</option>
        <option value="ETH/USD">Ethereum</option>
      </select>
            <section style={{
        background: "#151e30",
        padding: "18px",
        marginTop: "20px",
        borderRadius: "12px"
      }}>
        <h2>{symbol}</h2>

        {loading && <p>Loading market data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <>
            <h1>${price.toFixed(2)}</h1>
            <p>Latest available price</p>
            <p>Time: {latest?.datetime || "—"}</p>
            <p>Candles received: {candles.length}</p>
          </>
        )}
      <section style={{
        background: "#151e30",
        padding: "18px",
        marginTop: "20px",
        borderRadius: "12px"
      }}>
        <h2>Trading Signal</h2>

        <h1 style={{
          color: signal === "LONG"
            ? "#22c55e"
            : signal === "SHORT"
            ? "#ef4444"
            : "#facc15"
        }}>
          {signal}
        </h1>

        <p>Signal strength: {strength}</p>
        <p>EMA 20: {ema20.toFixed(2)}</p>
        <p>EMA 50: {ema50.toFixed(2)}</p>
        <p>RSI 14: {rsi.toFixed(2)}</p>
      </section>
        <button
          onClick={loadMarket}
          style={{
            padding: "12px",
            width: "100%",
            marginTop: "15px"
          }}
        >
          Refresh Market
        </button>
      </section>
    </main>
  );
}
