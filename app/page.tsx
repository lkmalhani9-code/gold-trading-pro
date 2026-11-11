"use client";

import { useEffect, useState } from "react";

type Coin = {
  symbol: string;
  name: string;
};

type Signal = {
  symbol: string;
  name: string;
  price: number;
  direction: string;
  ema20: number;
  ema50: number;
  rsi: number;
  atr: number;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
};

const COINS: Coin[] = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "BNB" },
  { symbol: "SOLUSDT", name: "Solana" },
  { symbol: "XRPUSDT", name: "XRP" },
  { symbol: "ADAUSDT", name: "Cardano" },
  { symbol: "DOGEUSDT", name: "Dogecoin" },
  { symbol: "TRXUSDT", name: "TRON" },
  { symbol: "LINKUSDT", name: "Chainlink" },
  { symbol: "LTCUSDT", name: "Litecoin" },
];

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let result = values[0];

  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k);
  }

  return result;
}

function rsi(values: number[]) {
  let gains = 0;
  let losses = 0;

  for (let i = values.length - 15; i < values.length - 1; i++) {
    const change = values[i + 1] - values[i];
    if (change > 0) gains += change;
    else losses -= change;
  }

  if (losses === 0) return 100;

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function atr(candles: number[][]) {
  let total = 0;

  for (let i = candles.length - 14; i < candles.length; i++) {
    const high = candles[i][2];
    const low = candles[i][3];
    const previous = candles[i - 1][4];

    total += Math.max(
      high - low,
      Math.abs(high - previous),
      Math.abs(low - previous)
    );
  }

  return total / 14;
}
async function getSignal(coin: Coin): Promise<Signal> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=15m&limit=100`
  );

  if (!response.ok) throw new Error("Data unavailable");

  const data = await response.json();
  const candles = data.slice(0, -1).map((x: any) =>
    x.map(Number)
  );

  const closes = candles.map((x: number[]) => x[4]);
  const price = closes[closes.length - 1];

  const ema20 = ema(closes.slice(-50), 20);
  const ema50 = ema(closes, 50);
  const rsiValue = rsi(closes);
  const atrValue = atr(candles);

  let direction = "WAIT";
  let stopLoss = null;
  let tp1 = null;
  let tp2 = null;
  let tp3 = null;

  if (ema20 > ema50 && rsiValue >= 52 && rsiValue <= 68) {
    direction = "LONG";
    stopLoss = price - atrValue * 1.5;
    tp1 = price + atrValue * 1.5;
    tp2 = price + atrValue * 2;
    tp3 = price + atrValue * 3;
  }

  if (ema20 < ema50 && rsiValue >= 32 && rsiValue <= 48) {
    direction = "SHORT";
    stopLoss = price + atrValue * 1.5;
    tp1 = price - atrValue * 1.5;
    tp2 = price - atrValue * 2;
    tp3 = price - atrValue * 3;
  }

  return {
    symbol: coin.symbol,
    name: coin.name,
    price,
    direction,
    ema20,
    ema50,
    rsi: rsiValue,
    atr: atrValue,
    stopLoss,
    tp1,
    tp2,
    tp3,
  };
}
export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("BTCUSDT");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const results = await Promise.all(
        COINS.map((coin) => getSignal(coin))
      );

      setSignals(results);
      setError("");
    } catch {
      setError("Market data unavailable. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);

  const active = signals.find(
    (signal) => signal.symbol === selected
  );

  const price = (value: number | null) =>
    value === null ? "—" : value.toFixed(4);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080d18",
      color: "#f1f5f9",
      padding: "20px",
      fontFamily: "Arial"
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        borderBottom: "1px solid #263247",
        paddingBottom: "18px"
      }}>
        <h2>⚡ CRYPTO STRATEGY LAB</h2>
        <span style={{color:"#22c55e"}}>● MARKET LIVE</span>
      </header>

      <h1 style={{marginTop:"30px"}}>Strategy Dashboard</h1>
      <p style={{color:"#94a3b8"}}>
        Technical analysis and market signals · 15 MIN
      </p>

      <button
        onClick={refresh}
        style={{
          background:"#2563eb",
          color:"white",
          border:0,
          borderRadius:"8px",
          padding:"12px 20px",
          margin:"15px 0"
        }}
      >
        Refresh Signals
      </button>

      {loading && <p>Loading market signals...</p>}
      {error && <p style={{color:"#f87171"}}>{error}</p>}

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",
        gap:"12px"
      }}>
        {signals.map((signal) => (
          <button
            key={signal.symbol}
            onClick={() => setSelected(signal.symbol)}
            style={{
              background:selected===signal.symbol ? "#17365a" : "#111b2d",
              color:"white",
              border:"1px solid #263247",
              borderRadius:"12px",
              padding:"16px",
              textAlign:"left"
            }}
          >
            <strong>{signal.name}</strong>
            <h3 style={{
              color:signal.direction==="LONG" ? "#22c55e" :
              signal.direction==="SHORT" ? "#ef4444" : "#facc15"
            }}>
              {signal.direction}
            </h3>
            <small>${price(signal.price)}</small>
          </button>
        ))}
      </section>

      {active && (
        <section style={{
          marginTop:"25px",
          background:"#111b2d",
          border:"1px solid #263247",
          borderRadius:"14px",
          padding:"20px"
        }}>
          <h2>{active.name} Strategy</h2>
          <h1>${price(active.price)}</h1>

          <h3 style={{
            color:active.direction==="LONG" ? "#22c55e" :
            active.direction==="SHORT" ? "#ef4444" : "#facc15"
          }}>
            {active.direction}
          </h3>

          <hr style={{borderColor:"#263247"}} />

          <p>EMA 20: {price(active.ema20)}</p>
          <p>EMA 50: {price(active.ema50)}</p>
          <p>RSI 14: {active.rsi.toFixed(2)}</p>
          <p>ATR 14: {price(active.atr)}</p>

          <h3>Trade Levels</h3>
          <p>Entry: ${price(active.price)}</p>
          <p style={{color:"#ef4444"}}>
            Stop Loss: ${price(active.stopLoss)}
          </p>
          <p style={{color:"#22c55e"}}>
            Take Profit 1: ${price(active.tp1)}
          </p>
          <p style={{color:"#22c55e"}}>
            Take Profit 2: ${price(active.tp2)}
          </p>
          <p style={{color:"#22c55e"}}>
            Take Profit 3: ${price(active.tp3)}
          </p>
        </section>
      )}

      <footer style={{
        marginTop:"35px",
        borderTop:"1px solid #263247",
        paddingTop:"20px",
        color:"#94a3b8"
      }}>
        Educational analysis only. Signals are untested and do not guarantee profits.
      </footer>
    </main>
  );
}
