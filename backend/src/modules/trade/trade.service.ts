
import Decimal from "decimal.js";

import { prisma } from "../../config/database";
import { getFreshMarketPrice } from "../market/market.service";

import type { TradeInput } from "./trade.validation";

export async function executeTrade(
    userId: string,
    input: TradeInput
) {
    // 1. Fetch the latest cryptocurrency price
    const price = await getFreshMarketPrice(input.symbol);

    // 2. Convert quantity into Decimal
    const quantity = new Decimal(input.quantity);

    // 3. Calculate transaction value
    const total = quantity
        .mul(price)
        .toDecimalPlaces(8, Decimal.ROUND_HALF_UP);

    // 4. Retrieve the user's wallet
    const wallet = await prisma.wallet.findUnique({
        where: {
            userId,
        },
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    // 5. Convert wallet balance into Decimal
    const walletBalance = new Decimal(wallet.balance.toString());

    // 6. Check whether the user has enough money
    if (input.side === "BUY" && walletBalance.lessThan(total)) {
        throw new Error("Insufficient wallet balance");
    }

    // 7. Display trade calculation
    console.log("Trade calculation:", {
        symbol: input.symbol,
        side: input.side,
        quantity: quantity.toString(),
        price: price.toString(),
        total: total.toString(),
    });

    return {
        symbol: input.symbol,
        side: input.side,
        quantity: quantity.toString(),
        price: price.toString(),
        total: total.toString(),
    };
}
