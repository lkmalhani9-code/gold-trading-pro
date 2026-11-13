
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "XAU/USD";

  const allowed = [
    "XAU/USD",
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "BTC/USD",
    "ETH/USD",
  ];

  if (!allowed.includes(symbol)) {
    return NextResponse.json(
      { error: "Invalid symbol" },
      { status: 400 }
    );
  }

  const key = process.env.TWELVEDATA_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "API key missing" },
      { status: 500 }
    );
  }

  const url = new URL(
    "https://api.twelvedata.com/time_series"
  );

  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "15min");
  url.searchParams.set("outputsize", "100");
  url.searchParams.set("apikey", key);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      return NextResponse.json(
        { error: data.message || "Market data unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Connection failed" },
      { status: 500 }
    );
  }
    }
