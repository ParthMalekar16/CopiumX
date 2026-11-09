
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


    // 4. Only BUY trades are supported at this stage
if (input.side !== "BUY") {
    throw new Error("SELL trades are not implemented yet");
}

// 5. Perform an atomic wallet deduction
const result = await prisma.$transaction(async (tx) => {

    const deduction = await tx.wallet.updateMany({
        where: {
            userId,
            balance: {
                gte: total.toFixed(8),
            },
        },
        data: {
            balance: {
                decrement: total.toFixed(8),
            },
        },
    });

    // No wallet was updated: insufficient funds or missing wallet
    if (deduction.count === 0) {
        throw new Error("Insufficient wallet balance or wallet not found");
    }

    // 6. Retrieve the updated wallet
    const updatedWallet = await tx.wallet.findUnique({
        where: {
            userId,
        },
    });

    if (!updatedWallet) {
        throw new Error("Wallet not found");
    }

    // 7. Record the wallet deduction in the ledger
    await tx.ledgerEntry.create({
        data: {
            walletId: updatedWallet.id,
            type: "TRADE_BUY",
            amount: total.negated().toFixed(8),
            balanceAfter: updatedWallet.balance,
            description: `Bought ${quantity.toString()} ${input.symbol}`,
            referenceId: input.idempotencyKey,
        },
    });

    return updatedWallet;
});

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
