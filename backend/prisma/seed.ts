import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
    connectionString,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    const assets = [
    { symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin" },
    { symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum" },
    { symbol: "SOL", name: "Solana", coingeckoId: "solana" },
    { symbol: "XRP", name: "XRP", coingeckoId: "ripple" },
    { symbol: "BNB", name: "BNB", coingeckoId: "binancecoin" },
    { symbol: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin" },
    { symbol: "ADA", name: "Cardano", coingeckoId: "cardano" },
    { symbol: "AVAX", name: "Avalanche", coingeckoId: "avalanche-2" },
    { symbol: "LINK", name: "Chainlink", coingeckoId: "chainlink" },
    { symbol: "TRX", name: "TRON", coingeckoId: "tron" },
    { symbol: "BCH", name: "Bitcoin Cash", coingeckoId: "bitcoin-cash" },
    { symbol: "LTC", name: "Litecoin", coingeckoId: "litecoin" },
];

    for (const asset of assets) {
        await prisma.asset.upsert({
            where: {
                symbol: asset.symbol,
            },
            update: {},
            create: asset,
        });
    }

    console.log("Cryptocurrency assets seeded successfully!");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });