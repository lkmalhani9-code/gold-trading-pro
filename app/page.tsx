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
