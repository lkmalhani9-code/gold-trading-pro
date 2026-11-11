
"use client";

import { useEffect, useState } from "react";

const COINS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },
  { symbol: "BNBUSDT", name: "BNB", icon: "◆" },
  { symbol: "SOLUSDT", name: "Solana", icon: "◎" },
  { symbol: "XRPUSDT", name: "XRP", icon: "✕" },
  { symbol: "ADAUSDT", name: "Cardano", icon: "₳" },
  { symbol: "DOGEUSDT", name: "Dogecoin", icon: "Ð" },
  { symbol: "TRXUSDT", name: "TRON", icon: "▲" },
  { symbol: "LINKUSDT", name: "Chainlink", icon: "⬡" },
  { symbol: "LTCUSDT", name: "Litecoin", icon: "Ł" },
];

type Signal = {
  symbol: string;
  name: string;
  icon: string;
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

function ema(values: number[], period: number) {
  let result = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const multiplier = 2 / (period + 1);

  for (let i = period; i < values.length; i++) {
    result = (values[i] - result) * multiplier + result;
  }

  return result;
}

function rsi(values: number[]) {
  const recent = values.slice(-15);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < recent.length; i++) {
    const change = recent[i] - recent[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function atr(highs: number[], lows: number[], closes: number[]) {
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

  const recent = ranges.slice(-14);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

async function getSignal(coin: (typeof COINS)[number]): Promise<Signal> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=15m&limit=100`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) throw new Error("Market data unavailable");

  const rows = await response.json();
  const closed = rows.slice(0, -1);

  const closes = closed.map((row: string[]) => Number(row[4]));
  const highs = closed.map((row: string[]) => Number(row[2]));
  const lows = closed.map((row: string[]) => Number(row[3]));

  const price = closes[closes.length - 1];
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsiValue = rsi(closes);
  const atrValue = atr(highs, lows, closes);

  let direction: Signal["direction"] = "WAIT";

  if (ema20 > ema50 && rsiValue >= 52 && rsiValue <= 68) {
    direction = "LONG";
  } else if (ema20 < ema50 && rsiValue >= 32 && rsiValue <= 48) {
    direction = "SHORT";
  }

  const distance = atrValue * 1.5;

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
    ...coin,
    price,
    direction,
    entry: direction === "WAIT" ? null : price,
    stop,
    target,
    rsi: rsiValue,
    ema20,
    ema50,
    atr: atrValue,
  };
}

function money(value: number | null) {
  if (value === null) return "—";
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
          color: #edf2ff;
          font-family: Arial, Helvetica, sans-serif;
        }
        a { color: inherit; text-decoration: none; }
        button, input { font: inherit; }
        .site { min-height: 100vh; background: #080d18; }
        .container { width: min(1160px, 92%); margin: auto; }
        .nav {
          border-bottom: 1px solid #202a3b;
          background: #0b1220;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-inner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .brand { display: flex; align-items: center; gap: 11px; }
        .brand-icon {
          width: 39px; height: 39px; border-radius: 12px;
          display: grid; place-items: center;
          background: linear-gradient(135deg,#19c784,#087e72);
          color: white; font-size: 22px; font-weight: 900;
        }
        .brand strong { display: block; font-size: 14px; letter-spacing: 1px; }
        .brand small { color: #8291a9; font-size: 9px; letter-spacing: 2px; }
        .nav-links { display: flex; gap: 23px; color: #a8b4c8; font-size: 13px; }
        .nav-links a:hover { color: #36d99b; }
        .live {
          color: #4ce0a4; border: 1px solid #225c4b;
          background: #102b27; padding: 8px 11px;
          border-radius: 30px; font-size: 11px; white-space: nowrap;
        }
        .hero {
          padding: 65px 0 45px;
          display: grid; grid-template-columns: 1.5fr 1fr;
          gap: 30px; align-items: center;
        }
        .eyebrow { color: #39d69b; font-size: 11px; font-weight: 800; letter-spacing: 2px; }
        h1 { font-size: clamp(36px,6vw,58px); line-height: 1.06; margin: 15px 0; letter-spacing: -2px; }
        h1 span { color: #38d69b; }
        .hero-copy { max-width: 600px; color: #9eabc0; line-height: 1.8; font-size: 15px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 25px; }
        .primary, .secondary {
          padding: 13px 18px; border-radius: 9px; font-weight: 700;
          font-size: 13px; display: inline-block;
        }
        .primary { background: #21c88b; color: #04130e; }
        .secondary { border: 1px solid #344157; color: #dce5f4; }
        .hero-card {
          padding: 23px; border-radius: 17px;
          border: 1px solid #26354b;
          background: linear-gradient(145deg,#142239,#0e1728);
        }
        .hero-card h3 { margin: 0 0 7px; font-size: 14px; }
        .muted { color: #8493aa; font-size: 12px; }
        .hero-stat { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #29364a; }
        .hero-stat:last-child { border: 0; }
        .hero-stat strong { font-size: 18px; }
        .section { padding: 28px 0; }
        .section-heading {
          display: flex; justify-content: space-between;
          align-items: end; gap: 15px; margin-bottom: 18px;
        }
        h2 { font-size: 25px; margin: 6px 0; }
        .section-desc { color: #8795aa; font-size: 13px; line-height: 1.6; }
        .stats {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 13px;
        }
        .stat, .panel, .signal-card, .lesson {
          background: #101a2b; border: 1px solid #26344a;
          border-radius: 13px;
        }
        .stat { padding: 19px; }
        .stat small { color: #91a0b6; font-size: 10px; letter-spacing: 1px; }
        .stat strong { display: block; font-size: 25px; margin: 10px 0 4px; }
        .green { color: #39d99a; }
        .red { color: #ff687c; }
        .yellow { color: #f4c65e; }
        .panel { padding: 22px; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter {
          background: #17243a; border: 1px solid #34445d;
          color: #b8c5d9; border-radius: 7px;
          padding: 8px 12px; font-size: 11px; cursor: pointer;
        }
        .filter.active { background: #1a624d; color: white; border-color: #258b68; }
        .signal-grid {
          display: grid; grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 13px; margin-top: 16px;
        }
        .signal-card { padding: 19px; }
        .coin-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
        .coin-name { display: flex; align-items: center; gap: 10px; }
        .coin-icon {
          width: 38px; height: 38px; display: grid; place-items: center;
          border-radius: 11px; background: #1b2b43; color: #50dca8; font-size: 20px;
        }
        .coin-name strong { display: block; font-size: 14px; }
        .coin-name small { color: #8190a7; font-size: 11px; }
        .signal-badge {
          font-size: 10px; font-weight: 900; letter-spacing: 1px;
          padding: 7px 10px; border-radius: 6px;
        }
        .badge-long { color: #4be0a7; background: #12382e; }
        .badge-short { color: #ff7b8c; background: #3c202b; }
        .badge-wait { color: #f3cc70; background: #3b321e; }
        .price-row { margin: 17px 0; }
        .price-row strong { font-size: 23px; }
        .price-row small { color: #8290a5; display: block; margin-top: 4px; font-size: 10px; }
        .levels {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 8px; background: #0b1423; border-radius: 9px; padding: 12px;
        }
        .levels small { color: #8291a7; font-size: 9px; display: block; margin-bottom: 6px; }
        .levels strong { font-size: 12px; }
        .indicators {
          display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px;
        }
        .indicator {
          background: #18253a; color: #aab8cc;
          padding: 6px 8px; border-radius: 5px; font-size: 10px;
        }
        .card-note { color: #8291a7; font-size: 10px; margin-top: 13px; line-height: 1.5; }
        .calc-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 13px; margin-top: 16px;
        }
        .calc-field label { display: block; color: #94a3b8; font-size: 11px; margin-bottom: 8px; }
        .calc-field input {
          width: 100%; background: #091322; border: 1px solid #34445d;
          border-radius: 8px; color: white; padding: 12px; outline: none;
        }
        .calc-result {
          background: #102c27; border: 1px solid #245b4b;
          border-radius: 10px; padding: 16px; margin-top: 15px;
        }
        .calc-result strong { font-size: 24px; color: #4be0a7; }
        .academy {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 13px;
          margin-top: 17px;
        }
        .lesson { padding: 20px; }
        .lesson-icon { font-size: 24px; }
        .lesson h3 { font-size: 15px; margin: 13px 0 8px; }
        .lesson p { color: #8d9bb0; font-size: 12px; line-height: 1.7; margin: 0; }
        .trust {
          border: 1px solid #35445a; background: #111d30;
          border-radius: 13px; padding: 22px; line-height: 1.7;
          color: #aab7ca; font-size: 12px;
        }
        .footer { border-top: 1px solid #202b3e; margin-top: 40px; padding: 27px 0; color: #8492a7; font-size: 11px; line-height: 1.8; }
        .footer-inner { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        @media(max-width:750px) {
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; padding-top: 42px; }
          .stats { grid-template-columns: repeat(2,1fr); }
          .signal-grid { grid-template-columns: 1fr; }
          .calc-grid { grid-template-columns: 1fr; }
          .academy { grid-template-columns: 1fr; }
          .section-heading { align-items: start; flex-direction: column; }
        }
      `}</style>

      <div className="nav">
        <div className="container nav-inner">
          <a href="#" className="brand">
            <span className="brand-icon">₿</span>
            <span>
              <strong>CRYPTO SIGNALS PRO</strong>
              <small>MARKET INTELLIGENCE</small>
            </span>
          </a>

          <nav className="nav-links">
            <a href="#markets">Markets</a>
            <a href="#signals">Signals</a>
            <a href="#calculator">Risk Calculator</a>
            <a href="#academy">Academy</a>
          </nav>

          <span className="live">● MARKET DATA</span>
        </div>
      </div>

      <div className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">SMARTER CRYPTO DECISIONS START HERE</p>
            <h1>Understand the market.<br /><span>Plan every trade.</span></h1>
            <p className="hero-copy">
              Explore crypto market signals, technical indicators and risk
              management tools. Build your knowledge, follow a clear plan
              and make more informed decisions.
            </p>
            <div className="hero-actions">
              <a className="primary" href="#signals">Explore Market Signals →</a>
              <a className="secondary" href="#academy">Start Learning</a>
            </div>
          </div>

          <div className="hero-card">
            <p className="eyebrow">MARKET SNAPSHOT</p>
            <h3>15-minute technical analysis</h3>
            <p className="muted">Major crypto pairs · Binance public data</p>
            <div className="hero-stat">
              <span className="muted">Bullish setups</span>
              <strong className="green">{longCount}</strong>
            </div>
            <div className="hero-stat">
              <span className="muted">Bearish setups</span>
              <strong className="red">{shortCount}</strong>
            </div>
            <div className="hero-stat">
              <span className="muted">Waiting for confirmation</span>
              <strong className="yellow">{waitCount}</strong>
            </div>
            <p className="muted">
              Last update: {updatedAt || "Connecting to market..."}
            </p>
          </div>
        </section>

        <section className="section" id="markets">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MARKET OVERVIEW</p>
              <h2>Today's market dashboard</h2>
              <p className="section-desc">A quick view of the current rule-based analysis.</p>
            </div>
          </div>

          <div className="stats">
            <article className="stat">
              <small>COINS TRACKED</small>
              <strong>{signals.length || 10}</strong>
              <span className="muted">Major crypto pairs</span>
            </article>
            <article className="stat">
              <small>LONG SETUPS</small>
              <strong className="green">{longCount}</strong>
              <span className="muted">Bullish rule conditions</span>
            </article>
            <article className="stat">
              <small>SHORT SETUPS</small>
              <strong className="red">{shortCount}</strong>
              <span className="muted">Bearish rule conditions</span>
            </article>
            <article className="stat">
              <small>WAIT / NO SETUP</small>
              <strong className="yellow">{waitCount}</strong>
              <span className="muted">Awaiting confirmation</span>
            </article>
          </div>
        </section>

        <section className="section" id="signals">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AUTOMATED TECHNICAL ANALYSIS</p>
              <h2>Crypto market signals</h2>
              <p className="section-desc">
                Rule-based analysis using EMA 20, EMA 50, RSI 14 and ATR 14.
              </p>
            </div>
            <span className="live">15 MIN · REFRESH 60 SEC</span>
          </div>

          <div className="panel">
            <div className="filters">
              {["ALL", "LONG", "SHORT", "WAIT"].map((item) => (
                <button
                  key={item}
                  className={`filter ${filter === item ? "active" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loading && <p className="section-desc">Loading market data...</p>}
            {error && <p className="red">{error}</p>}

            <div className="signal-grid">
              {visibleSignals.map((signal) => {
                const active = signal.direction !== "WAIT";
                const distance =
                  signal.entry !== null && signal.stop !== null
                    ? Math.abs(signal.entry - signal.stop)
                    : null;
                const quantity =
                  distance && distance > 0 ? riskAmount / distance : null;

                const badge =
                  signal.direction === "LONG"
                    ? "badge-long"
                    : signal.direction === "SHORT"
                    ? "badge-short"
                    : "badge-wait";

                return (
                  <article className="signal-card" key={signal.symbol}>
                    <div className="coin-head">
                      <div className="coin-name">
                        <span className="coin-icon">{signal.icon}</span>
                        <span>
                          <strong>{signal.name}</strong>
                          <small>{signal.symbol}</small>
                        </span>
                      </div>
                      <span className={`signal-badge ${badge}`}>
                        {signal.direction}
                      </span>
                    </div>

                    <div className="price-row">
                      <strong>{money(signal.price)}</strong>
                      <small>LAST CLOSED 15-MIN CANDLE</small>
                    </div>

                    <div className="levels">
                      <div>
                        <small>ENTRY</small>
                        <strong>{money(signal.entry)}</strong>
                      </div>
                      <div>
                        <small>STOP LOSS</small>
                        <strong className="red">{money(signal.stop)}</strong>
                      </div>
                      <div>
                        <small>TAKE PROFIT</small>
                        <strong className="green">{money(signal.target)}</strong>
                      </div>
        </
