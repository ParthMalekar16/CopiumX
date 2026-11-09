
import "dotenv/config";
import { prisma } from "../../config/database";
import { getCachedPrices, setCachedPrices } from "./market.cache";
import type { MarketPrice } from "./market.types";
import Decimal from "decimal.js";

const COINGECKO_API_URL =
    "https://api.coingecko.com/api/v3/simple/price";

export async function getMarketPrices() {
    const cachedPrices = getCachedPrices();

    if (cachedPrices) {
        console.log("Market cache: HIT");
        return cachedPrices;
    }

    console.log("Market cache: MISS");
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
    const prices: MarketPrice[] = assets.map((asset) => {
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
setCachedPrices(prices);
    return prices;
}


export async function getFreshMarketPrice(symbol: string): Promise<Decimal> {
    const apiKey = process.env.COINGECKO_API_KEY;

    if (!apiKey) {
        throw new Error("COINGECKO_API_KEY is not configured");
    }

    const asset = await prisma.asset.findUnique({
        where: { symbol },
    });

    if (!asset) {
        throw new Error("Unsupported cryptocurrency");
    }

    const params = new URLSearchParams({
        ids: asset.coingeckoId,
        vs_currencies: "usd",
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
        throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const marketData = await response.json();
    const price = marketData[asset.coingeckoId]?.usd;

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        throw new Error(`Invalid market price for ${symbol}`);
    }

    return new Decimal(String(price));
}

