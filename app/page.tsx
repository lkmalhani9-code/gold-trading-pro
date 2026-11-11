"use client";

import { useEffect, useState } from "react";

type Coin = {
  symbol: string;
  name: string;
};

type Market = {
  price: number;
  change: number;
  volume: number;
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

export default function Home() {
  const [markets, setMarkets] = useState<Record<string, Market>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("BTCUSDT");
  
  async function loadMarkets() {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr"
      );

      if (!response.ok) throw new Error("Market data unavailable");

      const data = await response.json();
      const result: Record<string, Market> = {};

      COINS.forEach((coin) => {
        const item = data.find(
          (x: any) => x.symbol === coin.symbol
        );

        if (item) {
          result[coin.symbol] = {
            price: Number(item.lastPrice),
            change: Number(item.priceChangePercent),
            volume: Number(item.quoteVolume),
          };
        }
      });

      setMarkets(result);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarkets();
    const timer = setInterval(loadMarkets, 30000);
    return () => clearInterval(timer);
  }, []);

  const active = markets[selected];
  
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
        paddingBottom: "20px"
      }}>
        <h2>⚡ CRYPTO INTELLIGENCE</h2>
        <span style={{color:"#22c55e"}}>● LIVE MARKET</span>
      </header>

      <h1 style={{marginTop:"30px"}}>Market Terminal</h1>
      <p style={{color:"#94a3b8"}}>
        Professional Crypto Market Scanner
      </p>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
        gap:"12px",
        marginTop:"25px"
      }}>
        {[
          ["MARKETS", "10"],
          ["DATA STATUS", loading ? "Loading" : Object.keys(markets).length ? "Connected" : "Unavailable"],
          ["SELECTED", selected.replace("USDT","")]
        ].map(([label,value]) => (
          <div key={label} style={{
            background:"#111b2d",
            padding:"18px",
            borderRadius:"12px",
            border:"1px solid #263247"
          }}>
            <small style={{color:"#94a3b8"}}>{label}</small>
            <h2>{value}</h2>
          </div>
        ))}
      </section>

      <h2 style={{marginTop:"35px"}}>Market Scanner</h2>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",
        gap:"12px"
      }}>
        {COINS.map((coin) => {
          const item = markets[coin.symbol];
          return (
            <button
              key={coin.symbol}
              onClick={() => setSelected(coin.symbol)}
              style={{
                background:selected===coin.symbol ? "#17365a" : "#111b2d",
                color:"white",
                border:"1px solid #263247",
                borderRadius:"12px",
                padding:"16px",
                textAlign:"left"
              }}
            >
              <strong>{coin.name}</strong>
              <p>{item ? "$"+item.price.toLocaleString() : "Loading..."}</p>
              {item && (
                <span style={{
                  color:item.change>=0 ? "#22c55e" : "#ef4444"
                }}>
                  {item.change.toFixed(2)}%
                </span>
              )}
            </button>
          );
        })}
      </section>

      <section style={{
        marginTop:"25px",
        padding:"22px",
        background:"#111b2d",
        borderRadius:"14px",
        border:"1px solid #263247"
      }}>
        <h2>{selected.replace("USDT","")} Analysis</h2>
        {active ? (
          <>
            <h1 style={{fontSize:"32px"}}>
              ${active.price.toLocaleString()}
            </h1>
            <p>24h Change: {active.change.toFixed(2)}%</p>
            <p>24h Volume: ${active.volume.toLocaleString()}</p>
          </>
        ) : (
          <p style={{color:"#94a3b8"}}>
            {loading ? "Loading market data..." : "Market data unavailable. Try refreshing."}
          </p>
        )}
        <button
          onClick={() => {
            setLoading(true);
            loadMarkets();
          }}
          style={{
            background:"#2563eb",
            color:"white",
            border:0,
            padding:"12px 20px",
            borderRadius:"8px"
          }}
        >
          Refresh Market
        </button>
      </section>

      <footer style={{
        marginTop:"40px",
        padding:"20px",
        color:"#94a3b8",
        borderTop:"1px solid #263247"
      }}>
        Educational market analysis only. No guaranteed signals or profits.
      </footer>
    </main>
  );
      }
