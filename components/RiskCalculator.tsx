
"use client";

import { useMemo, useState } from "react";

export default function RiskCalculator() {
  const [balance, setBalance] = useState("100");
  const [riskPct, setRiskPct] = useState("1");
  const [entry, setEntry] = useState("4000");
  const [stop, setStop] = useState("3990");
  const [contract, setContract] = useState("100");
  const [lot, setLot] = useState("0.01");

  const result = useMemo(() => {
    const b = Number(balance);
    const r = Number(riskPct);
    const e = Number(entry);
    const s = Number(stop);
    const c = Number(contract);
    const l = Number(lot);

    const distance = Math.abs(e - s);
    const budget = (b * r) / 100;
    const loss = distance * c * l;

    const valid =
      [b, r, e, s, c, l].every(Number.isFinite) &&
      b > 0 &&
      r > 0 &&
      r <= 100 &&
      e > 0 &&
      s > 0 &&
      c > 0 &&
      l > 0 &&
      distance > 0;

    const suggestedLot =
      distance > 0 && c > 0 ? budget / (distance * c) : 0;

    const minimumLotLoss = distance * c * 0.01;

    return {
      distance,
      budget,
      loss,
      suggestedLot,
      minimumLotLoss,
      valid,
      tooRisky: valid && loss > budget,
      minimumLotTooRisky: valid && minimumLotLoss > budget,
    };
  }, [balance, riskPct, entry, stop, contract, lot]);

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    step = "any"
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
    </label>
  );

  return (
    <div className="calculator">
      <div className="fields">
        {field("Account balance (USD)", balance, setBalance, "0.01")}
        {field("Risk per trade (%)", riskPct, setRiskPct, "0.1")}
        {field("Entry price", entry, setEntry, "0.01")}
        {field("Stop-loss price", stop, setStop, "0.01")}
        {field("Contract size", contract, setContract, "1")}
        {field("Your lot size", lot, setLot, "0.01")}
      </div>

      <div className="results">
        <div>
          <small>Risk budget</small>
          <strong>
            ${result.valid ? result.budget.toFixed(2) : "—"}
          </strong>
        </div>

        <div>
          <small>Estimated loss at entered lot</small>
          <strong className="loss">
            ${result.valid ? result.loss.toFixed(2) : "—"}
          </strong>
        </div>

        <div>
          <small>Price distance</small>
          <strong>
            {result.valid ? result.distance.toFixed(2) : "—"}
          </strong>
        </div>

        <div>
          <small>Indicative lot for risk budget</small>
          <strong>
            {result.valid ? result.suggestedLot.toFixed(4) : "—"}
          </strong>
        </div>
      </div>

      {result.valid && result.tooRisky && (
        <div
          className="notice"
          style={{ color: "#ef4444", fontWeight: "bold" }}
        >
          ⚠ TRADE NOT SAFE — SKIP TRADE.
          <br />
          Estimated loss is higher than your risk budget.
          <br />
          Reduce lot size or skip this trade.
        </div>
      )}

      {result.valid && !result.tooRisky && (
        <div
          className="notice"
          style={{ color: "#16a34a", fontWeight: "bold" }}
        >
          Risk is within your selected budget.
          <br />
          This is not a guarantee that the trade is safe or profitable.
        </div>
      )}

      {result.valid && result.minimumLotTooRisky && (
        <div
          className="notice"
          style={{ color: "#ef4444", fontWeight: "bold" }}
        >
          ⚠ MINIMUM LOT 0.01 IS ALSO TOO RISKY.
          <br />
          Minimum lot estimated loss: $
          {result.minimumLotLoss.toFixed(2)}
          <br />
          SKIP TRADE — Do not force a trade.
        </div>
      )}

      <p className="notice">
        Important: Contract size must match your broker's instrument
        specification. This estimate excludes spread, commission,
        swaps, slippage and execution differences. Verify all values
        before placing a trade. It is not a trading signal.
      </p>
    </div>
  );
        }
