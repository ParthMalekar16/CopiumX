export interface MarketPrice {
    symbol: string;
    name: string;
    price: number;
    priceChange24h: number | null;
}