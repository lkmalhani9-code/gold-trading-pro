
"use client";

import { useEffect, useState } from "react";

const COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "BNB" },
  { symbol: "SOLUSDT", name: "Solana" },
  { symbol: "XRPUSDT", name: "XRP" },
  { symbol: "ADAUSDT", name: "Cardano" },
  { symbol: "DOGEUSDT", name: "Dogecoin" },
  { symbol: "TRXUSDT", name: "TRON" },
  { symbol: "LINKUSDT", name: "Chainlink" },
  { symbol: "LTCUSDT", name: "Litecoin" }
];

type Signal = {
  symbol: string;
  name: string;
  price: number;
  direction: "LONG" | "SHORT" | "WAIT";
  entry: number | null;
  stop: number | null;
  target: number | null;
  rsi: number;
  ema20: number;
  ema50: number;
  atr: number;
};

function calculateEMA(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  let result =
    values.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < values.length; i++) {
    result = (values[i] - result) * multiplier + result;
  }

  return result;
}

function calculateRSI(values: number[], period = 14) {
  const changes = values.slice(-period - 1);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < changes.length; i++) {
    const difference = changes[i] - changes[i - 1];

    if (difference > 0) gains += difference;
    else losses += Math.abs(difference);
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) return 100;

  return 100 - 100 / (1 + averageGain / averageLoss);
}

function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
) {
  const ranges: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    ranges.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }

  const recent = ranges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

async function getSignal(
  coin: (typeof COINS)[number]
): Promise<Signal> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=15m&limit=100`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error("Market data unavailable");

  const rows = (await response.json()) as Array<Array<string | number>>;

  // Use closed candles only, not the currently forming candle.
  const closed = rows.slice(0, -1);

  const closes = closed.map((row) => Number(row[4]));
  const highs = closed.map((row) => Number(row[2]));
  const lows = closed.map((row) => Number(row[3]));

  const price = closes[closes.length - 1];
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes);
  const atr = calculateATR(highs, lows, closes);

  let direction: Signal["direction"] = "WAIT";

  if (ema20 > ema50 && rsi >= 52 && rsi <= 68) {
    direction = "LONG";
  } else if (ema20 < ema50 && rsi <= 48 && rsi >= 32) {
    direction = "SHORT";
  }

  const distance = atr * 1.5;

  const stop =
    direction === "LONG"
      ? price - distance
      : direction === "SHORT"
      ? price + distance
      : null;

  const target =
    direction === "LONG"
      ? price + distance * 2
      : direction === "SHORT"
      ? price - distance * 2
      : null;

  return {
    symbol: coin.symbol,
    name: coin.name,
    price,
    direction,
    entry: direction === "WAIT" ? null : price,
    stop,
    target,
    rsi,
    ema20,
    ema50,
    atr
  };
}

function money(value: number | null) {
  if (value === null) return "—";

  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [balance, setBalance] = useState("100");
  const [riskPercent, setRiskPercent] = useState("1");

  useEffect(() => {
    let active = true;

    async function refreshSignals() {
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
      setLoading(false);
    }

    refreshSignals();
    const timer = setInterval(refreshSignals, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const accountBalance = Math.max(0, Number(balance) || 0);
  const riskRate = Math.max(0, Number(riskPercent) || 0);
  const riskAmount = accountBalance * riskRate / 100;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <strong>CRYPTO SIGNALS PRO</strong>
            <small>MARKET INTELLIGENCE</small>
          </div>
        </div>
        <span className="status">
          <i /> MARKET DATA
        </span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">CRYPTO TRADING WORKSPACE</p>
          <h1>Trade with a <em>clear plan.</em></h1>
          <p className="sub">
            Crypto market analysis, LONG and SHORT setups,
            entry prices and risk planning.
          </p>
        </div>
        <div className="hero-price">
          <small>TIMEFRAME</small>
          <strong>15 MIN</strong>
          <span>Auto refresh: 60 seconds</span>
          <span>Updated: {updatedAt || "Connecting..."}</span>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric">
          <small>COINS TRACKED</small>
          <strong>10</strong>
          <span>Major crypto markets</span>
        </article>
        <article className="metric">
          <small>ANALYSIS</small>
          <strong>EMA + RSI</strong>
          <span>ATR stop calculation</span>
        </article>
        <article className="metric">
          <small>DATA SOURCE</small>
          <strong>Binance</strong>
          <span>Public market candles</span>
        </article>
      </section>

      <section className="panel calculator-section">
        <p className="eyebrow">POSITION PLANNING</p>
        <h2>Risk Calculator</h2>

        <div className="metric-grid">
          <label className="metric">
            <small>ACCOUNT BALANCE (USD)</small>
            <input
              type="number"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px"
              }}
            />
          </label>

          <label className="metric">
            <small>RISK PER TRADE (%)</small>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px"
              }}
            />
          </label>

          <article className="metric">
            <small>MAXIMUM PLANNED LOSS</small>
            <strong>{money(riskAmount)}</strong>
            <span>Per trade risk budget</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">AUTOMATIC MARKET ANALYSIS</p>
            <h2>Crypto Signals</h2>
          </div>
          <span className="tag">15 MIN</span>
        </div>

        {loading && (
          <p className="notice">Loading crypto market data...</p>
        )}

        {error && <p className="notice">{error}</p>}

        <div className="metric-grid">
          {signals.map((signal) => {
            const isLong = signal.direction === "LONG";
            const isShort = signal.direction === "SHORT";
            const activeSignal = isLong || isShort;

            const distance =
              signal.entry !== null && signal.stop !== null
                ? Math.abs(signal.entry - signal.stop)
                : null;

            const quantity =
              distance && distance > 0
                ? riskAmount / distance
                : null;

            return (
              <article
                className="metric"
                key={signal.symbol}
                style={{
                  gridColumn: "span 1",
                  border: "1px solid #555",
                  borderRadius: "12px",
                  padding: "16px"
                }}
              >
                <small>{signal.name} / USDT</small>

                <h2
                  style={{
                    color: isLong
                      ? "#22c55e"
                      : isShort
                      ? "#ef4444"
                      : "#eab308"
                  }}
                >
                  {signal.direction}
                </h2>

                <strong>{money(signal.price)}</strong>
                <span>Current market price</span>

                <div style={{ marginTop: "12px" }}>
                  <p>Entry: {money(signal.entry)}</p>
                  <p>Stop Loss: {money(signal.stop)}</p>
                  <p>Take Profit: {money(signal.target)}</p>
                  <p>RSI 14: {signal.rsi.toFixed(2)}</p>
                  <p>EMA 20: {money(signal.ema20)}</p>
                  <p>EMA 50: {money(signal.ema50)}</p>
                  <p>ATR 14: {money(signal.atr)}</p>
                  <p>Risk budget: {money(activeSignal ? riskAmount : null)}</p>
                  <p>
                    Estimated quantity:{" "}
                    {activeSignal && quantity !== null
                      ? quantity.toFixed(6)
                      : "—"}
                  </p>
                </div>

                <small>
                  {activeSignal
                    ? "Rule-based setup. Verify before trading."
                    : "No clear setup. Wait for confirmation."}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <p className="notice">
        Educational tool only. Signals are rule-based, not guaranteed.
        Position quantity is an estimate before fees, slippage and
        leverage. Binance prices may differ from your exchange.
        Never trade solely on an automated signal.
      </p>

      <footer>
        Crypto Signals Pro · Trading involves risk.
      </footer>
    </main>
  );
       }
  
