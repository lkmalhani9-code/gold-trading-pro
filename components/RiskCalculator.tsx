 "use client";
import { useMemo, useState } from "react";

export default function RiskCalculator() {
  const [balance, setBalance] = useState("52.08");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("2650");
  const [stop, setStop] = useState("2645");
  const [contract, setContract] = useState("100");
  const [lot, setLot] = useState("0.01");

  const result = useMemo(() => {
    const b = Number(balance), r = Number(riskPct), e = Number(entry), s = Number(stop);
    const c = Number(contract), l = Number(lot);
    const distance = Math.abs(e - s);
    const budget = b * r / 100;
    const loss = distance * c * l;
    const suggestedLot = distance > 0 && c > 0 ? budget / (distance * c) : 0;
    return { distance, budget, loss, suggestedLot, valid: [b,r,e,s,c,l].every(Number.isFinite) && b >= 0 && r >= 0 && c > 0 && l >= 0 };
  }, [balance, riskPct, entry, stop, contract, lot]);

  const field = (label: string, value: string, setter: (v: string) => void, step = "any") => (
    <label className="field"><span>{label}</span><input type="number" inputMode="decimal" step={step} value={value} onChange={e => setter(e.target.value)} /></label>
  );

  return <div className="calculator">
    <div className="fields">
      {field("Account balance (USD)", balance, setBalance, "0.01")}
      {field("Risk per trade (%)", riskPct, setRiskPct, "0.1")}
      {field("Entry price", entry, setEntry, "0.01")}
      {field("Stop-loss price", stop, setStop, "0.01")}
      {field("Contract size", contract, setContract, "1")}
      {field("Your lot size", lot, setLot, "0.01")}
    </div>
    <div className="results">
      <div><small>Risk budget</small><strong>${result.valid ? result.budget.toFixed(2) : "—"}</strong></div>
      <div><small>Estimated loss at entered lot</small><strong className="loss">${result.valid ? result.loss.toFixed(2) : "—"}</strong></div>
      <div><small>Price distance</small><strong>{result.valid ? result.distance.toFixed(2) : "—"}</strong></div>
      <div><small>Indicative lot for risk budget</small><strong>{result.valid ? result.suggestedLot.toFixed(4) : "—"}</strong></div>
    </div>
    <p className="notice">Important: Contract size must match your broker's XAU/USD specification. This estimate excludes spread, commission, swaps, slippage and execution differences. Verify all values before placing a trade. It is not a trading signal.</p>
  </div>;
}
