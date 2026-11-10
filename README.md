# Gold Trading Pro

A mobile-friendly Next.js starter dashboard for XAU/USD observation and position-risk estimation.

## Run locally or in a browser IDE

Requirements: Node.js 18.17+.

```bash
npm install
npm run dev
```

Open the local preview URL shown by the development environment.

## Important limitations

- The displayed gold price and chart are illustrative placeholders, not live market data.
- EMA, RSI, MACD and ATR are not calculated yet.
- No AI model, broker connection, authentication, database, payments or hosting is configured.
- The risk calculator is an estimate. Confirm your broker's exact XAU/USD contract size and account currency. It excludes spread, commission, swaps, slippage and execution differences.
- This project does not provide trading advice or guaranteed signals.

## Next development stages

1. Connect a legitimate, licensed market-data source.
2. Build candle chart and calculate indicators from real data.
3. Add transparent analysis with uncertainty and no-trade conditions.
4. Add authentication and database only after privacy/security planning.
5. Test thoroughly before public deployment.
