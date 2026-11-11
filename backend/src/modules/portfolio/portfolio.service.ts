
import Decimal from "decimal.js";

import { prisma } from "../../config/database";
import { getMarketPrices } from "../market/market.service";

export async function getPortfolio(userId: string) {
    // 1. Fetch the user's wallet
    const wallet = await prisma.wallet.findUnique({
        where: { userId },
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    // 2. Fetch all cryptocurrency holdings
    const holdings = await prisma.holding.findMany({
        where: { userId },
        include: {
            asset: {
                select: {
                    symbol: true,
                    name: true,
                },
            },
        },
    });

    // 3. Fetch current market prices
    const marketPrices = await getMarketPrices();

    // Create a lookup table using cryptocurrency symbols
    const priceMap = new Map(
        marketPrices.map((item) => [item.symbol, item])
    );

    // 4. Calculate the value of each holding
    let holdingsValue = new Decimal(0);
    let totalCostBasis = new Decimal(0);

    const portfolioHoldings = holdings.map((holding) => {
        const quantity = new Decimal(holding.quantity.toString());

        const averageBuyPrice = new Decimal(
            holding.averageBuyPrice.toString()
        );

        const marketData = priceMap.get(holding.asset.symbol);

        if (!marketData) {
            throw new Error(
                `Market price unavailable for ${holding.asset.symbol}`
            );
        }

        const currentPrice = new Decimal(String(marketData.price));

        const marketValue = quantity
            .mul(currentPrice)
            .toDecimalPlaces(8, Decimal.ROUND_HALF_UP);

        const costBasis = quantity
            .mul(averageBuyPrice)
            .toDecimalPlaces(8, Decimal.ROUND_HALF_UP);

        const unrealizedPnl = marketValue.minus(costBasis);

        holdingsValue = holdingsValue.plus(marketValue);
        totalCostBasis = totalCostBasis.plus(costBasis);

        const unrealizedPnlPercent = costBasis.isZero()
            ? new Decimal(0)
            : unrealizedPnl
                .div(costBasis)
                .mul(100)
                .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        return {
            symbol: holding.asset.symbol,
            name: holding.asset.name,
            quantity: quantity.toString(),
            averageBuyPrice: averageBuyPrice.toString(),
            currentPrice: currentPrice.toString(),
            marketValue: marketValue.toString(),
            costBasis: costBasis.toString(),
            unrealizedPnl: unrealizedPnl.toString(),
            unrealizedPnlPercent: unrealizedPnlPercent.toString(),
        };
    });

    // 5. Calculate total portfolio value
    const cashBalance = new Decimal(wallet.balance.toString());

    const totalPortfolioValue = cashBalance.plus(holdingsValue);

    const totalUnrealizedPnl = holdingsValue.minus(totalCostBasis);

    return {
        currency: wallet.currency,
        cashBalance: cashBalance.toString(),
        holdingsValue: holdingsValue.toString(),
        totalPortfolioValue: totalPortfolioValue.toString(),
        totalCostBasis: totalCostBasis.toString(),
        totalUnrealizedPnl: totalUnrealizedPnl.toString(),
        holdings: portfolioHoldings,
    };
}
