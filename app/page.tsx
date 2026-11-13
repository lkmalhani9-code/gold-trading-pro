
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
        throw new Error(data.error || "Market data unavailable");
      }

      setCandles(data.values || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setLoading(false);
    }
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

  const changes = closes.slice(1)
    .map((v, i) => v - closes[i]);

  const recentChanges = changes.slice(-14);

  const gains = recentChanges.map(v => Math.max(v, 0));
  const losses = recentChanges.map(v => Math.max(-v, 0));

  const avgGain = gains.length
    ? gains.reduce((a, b) => a + b, 0) / gains.length
    : 0;

  const avgLoss = losses.length
    ? losses.reduce((a, b) => a + b, 0) / losses.length
    : 0;

  const rsi = avgGain === 0 && avgLoss === 0
    ? 50
    : avgLoss === 0
    ? 100
    : 100 - (100 / (1 + avgGain / avgLoss));

  const ordered = [...candles].reverse();

  const ranges = ordered.slice(1).map((c, i) => {
    const prev = Number(ordered[i].close);

    return Math.max(
      Number(c.high) - Number(c.low),
      Math.abs(Number(c.high) - prev),
      Math.abs(Number(c.low) - prev)
    );
  });

  const recentRanges = ranges.slice(-14);

  const atr = recentRanges.length
    ? recentRanges.reduce((a, b) => a + b, 0) / recentRanges.length
    : 0;

  const enoughData = candles.length >= 50 && atr > 0;

  const signal = !enoughData
    ? "WAIT"
    : ema20 > ema50 && rsi > 50 && rsi < 70
    ? "LONG"
    : ema20 < ema50 && rsi < 50 && rsi > 30
    ? "SHORT"
    : "WAIT";

  const strength = signal === "WAIT"
    ? "No clear setup"
    : Math.abs(rsi - 50) >= 10
    ? "Strong conditions"
    : "Moderate conditions";

  const entry = price;

  const stopLoss = signal === "LONG"
    ? entry - atr * 1.5
    : signal === "SHORT"
    ? entry + atr * 1.5
    : 0;

  const tp1 = signal === "LONG"
    ? entry + atr * 1.5
    : signal === "SHORT"
    ? entry - atr * 1.5
    : 0;

  const tp2 = signal === "LONG"
    ? entry + atr * 2
    : signal === "SHORT"
    ? entry - atr * 2
    : 0;

  const tp3 = signal === "LONG"
    ? entry + atr * 3
    : signal === "SHORT"
    ? entry - atr * 3
    : 0;

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
        style={{
          padding: "12px",
          width: "100%",
          borderRadius: "8px"
        }}
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
<div style={{
  marginTop: "15px",
  background: "#0f172a",
  borderRadius: "10px",
  overflow: "hidden"
}}>
  <iframe
    key={symbol}
    src={`https://s.tradingview.com/widgetembed/?symbol=${symbol === "XAU/USD" ? "OANDA:XAUUSD" : symbol === "EUR/USD" ? "FX:EURUSD" : symbol === "GBP/USD" ? "FX:GBPUSD" : symbol === "USD/JPY" ? "FX:USDJPY" : symbol === "BTC/USD" ? "BINANCE:BTCUSDT" : "BINANCE:ETHUSDT"}&interval=15&theme=dark&style=1&locale=en`}
    width="100%"
    height="400"
    frameBorder="0"
    allowFullScreen
  />
</div>
        {loading && <p>Loading market data...</p>}

        {error && (
          <p style={{ color: "#ef4444" }}>{error}</p>
        )}

        {!loading && !error && latest && (
          <>
            <h1>${price.toFixed(2)}</h1>
            <p>Latest available price</p>
            <p>Time: {latest.datetime}</p>
            <p>Candles received: {candles.length}</p>
          </>
        )}

        <button
          onClick={loadMarket}
          style={{
            padding: "12px",
            width: "100%",
            marginTop: "15px",
            borderRadius: "8px"
          }}
        >
          Refresh Market
        </button>
      </section>

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
        <p>ATR 14: {atr.toFixed(2)}</p>
      </section>

      <section style={{
        background: "#151e30",
        padding: "18px",
        marginTop: "20px",
        borderRadius: "12px"
      }}>
        <h2>Entry & Risk Levels</h2>

        {signal !== "WAIT" ? (
          <>
            <p>Entry Price: {entry.toFixed(2)}</p>
            <p style={{ color: "#ef4444" }}>
              Stop Loss: {stopLoss.toFixed(2)}
            </p>
            <p style={{ color: "#22c55e" }}>
              Take Profit 1: {tp1.toFixed(2)}
            </p>
            <p style={{ color: "#22c55e" }}>
              Take Profit 2: {tp2.toFixed(2)}
            </p>
            <p style={{ color: "#22c55e" }}>
              Take Profit 3: {tp3.toFixed(2)}
            </p>
          </>
        ) : (
          <p>WAIT — No trade levels available.</p>
        )}
      </section>

      <p style={{
        color: "#94a3b8",
        fontSize: "12px",
        marginTop: "20px"
      }}>
        Educational indicator analysis only. Signals are not guaranteed.
        Test on a demo account before considering any live trade.
      </p>

    </main>
  );
    }
