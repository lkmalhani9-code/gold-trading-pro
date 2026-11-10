import RiskCalculator from "../components/RiskCalculator";

const metrics = [
  { label: "Market", value: "XAU / USD", note: "Gold vs US Dollar" },
  { label: "Timeframe", value: "5 min", note: "Illustrative setting" },
  { label: "Trend status", value: "Awaiting data", note: "No live feed connected" }
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">G</span><div><strong>GOLD TRADING PRO</strong><small>MARKET INTELLIGENCE</small></div></div>
        <span className="status"><i /> DEMO MODE</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">TRADING WORKSPACE</p>
          <h1>Trade with a <em>clear plan.</em></h1>
          <p className="sub">A focused workspace for gold-market observation, technical analysis and disciplined risk planning.</p>
        </div>
        <div className="hero-price"><small>XAU/USD SAMPLE DISPLAY</small><strong>$2,650.00</strong><span>Illustrative value · not live market data</span></div>
      </section>

      <section className="metric-grid">
        {metrics.map((m) => <article className="metric" key={m.label}><small>{m.label}</small><strong>{m.value}</strong><span>{m.note}</span></article>)}
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">PRICE OVERVIEW</p><h2>Gold market chart</h2></div><span className="tag">PLACEHOLDER</span></div>
          <div className="chart-placeholder">
            <div className="chart-lines"><span /><span /><span /><span /></div>
            <svg viewBox="0 0 700 230" role="img" aria-label="Illustrative chart placeholder"><polyline points="0,170 55,150 100,165 150,115 205,130 260,75 315,105 370,65 425,92 480,45 535,75 590,32 645,52 700,18" fill="none" stroke="#d7aa54" strokeWidth="3" /></svg>
            <div className="chart-label">Connect a trusted market-data provider to show live candles.</div>
          </div>
        </article>
        <article className="panel analysis-panel">
          <p className="eyebrow">ANALYSIS STATUS</p><h2>Technical overview</h2>
          <div className="indicator"><span>EMA 20 / EMA 50</span><b>Not calculated</b></div>
          <div className="indicator"><span>RSI (14)</span><b>Not calculated</b></div>
          <div className="indicator"><span>MACD</span><b>Not calculated</b></div>
          <div className="indicator"><span>ATR (14)</span><b>Not calculated</b></div>
          <p className="notice">Indicators are not connected to market candles yet. No buy/sell signal is being issued.</p>
        </article>
      </section>

      <section className="panel calculator-section">
        <div className="panel-heading"><div><p className="eyebrow">POSITION PLANNING</p><h2>Risk calculator</h2></div><span className="tag">ESTIMATE</span></div>
        <RiskCalculator />
      </section>

      <footer>Gold Trading Pro · Starter project · Educational tool only. Trading involves risk.</footer>
    </main>
  );
}
