import type { MarketPrice } from "./market.types";

const CACHE_DURATION = 30 * 1000;

let cachedPrices: MarketPrice[] | null = null;
let cacheExpiry = 0;

export function getCachedPrices(): MarketPrice[] | null {
    if (!cachedPrices || Date.now() > cacheExpiry) {
        return null;
    }

    return cachedPrices;
}

export function setCachedPrices(prices: MarketPrice[]): void {
    cachedPrices = prices;
    cacheExpiry = Date.now() + CACHE_DURATION;
}