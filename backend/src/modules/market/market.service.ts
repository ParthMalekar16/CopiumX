
import "dotenv/config";
import { prisma } from "../../config/database";

const COINGECKO_API_URL =
    "https://api.coingecko.com/api/v3/simple/price";

export async function getMarketPrices() {
    const apiKey = process.env.COINGECKO_API_KEY;

    if (!apiKey) {
        throw new Error("COINGECKO_API_KEY is not configured");
    }

    // Get all supported cryptocurrencies from our database.
    const assets = await prisma.asset.findMany({
        select: {
            symbol: true,
            name: true,
            coingeckoId: true,
        },
    });

    if (assets.length === 0) {
        throw new Error("No supported assets found");
    }

    // Prepare the CoinGecko request.
    const params = new URLSearchParams({
        ids: assets.map((asset) => asset.coingeckoId).join(","),
        vs_currencies: "usd",
        include_24hr_change: "true",
    });

    const response = await fetch(
        `${COINGECKO_API_URL}?${params.toString()}`,
        {
            headers: {
                "x-cg-demo-api-key": apiKey,
            },
            signal: AbortSignal.timeout(10000),
        }
    );

    if (!response.ok) {
        throw new Error(
            `CoinGecko API error: ${response.status}`
        );
    }

    const marketData = await response.json();

    // Match CoinGecko prices with our database assets.
    const prices = assets.map((asset) => {
        const coinData = marketData[asset.coingeckoId];

        if (!coinData || typeof coinData.usd !== "number") {
            throw new Error(
                `Price unavailable for ${asset.symbol}`
            );
        }

        return {
            symbol: asset.symbol,
            name: asset.name,
            price: coinData.usd,
            priceChange24h: coinData.usd_24h_change ?? null,
        };
    });

    return prices;
}
