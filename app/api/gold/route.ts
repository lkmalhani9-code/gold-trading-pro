
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("https://xaus.com/api/v1/spot", {
      cache: "no-store"
    });

    if (!response.ok) {
      return Response.json(
        { error: "Gold price provider unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const price = Number(data.spot_usd_oz);

    if (!Number.isFinite(price) || price <= 0) {
      return Response.json(
        { error: "Invalid gold price data" },
        { status: 502 }
      );
    }

    return Response.json({
      spot_usd_oz: price,
      updated_at: data.updated_at || new Date().toISOString(),
      source: "xaus.com"
    });
  } catch {
    return Response.json(
      { error: "Unable to fetch gold price" },
      { status: 500 }
    );
  }
}
