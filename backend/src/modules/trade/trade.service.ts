
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

        if (total.lte(0)) {
    throw new Error("Trade value is too small");
}

    // 4. Only BUY trades are supported at this stage
if (input.side !== "BUY") {
    throw new Error("SELL trades are not implemented yet");
}

// 5. Perform an atomic wallet deduction
const result = await prisma.$transaction(async (tx) => {
    const existingTrade = await tx.trade.findUnique({
    where: {
        userId_idempotencyKey: {
            userId,
            idempotencyKey: input.idempotencyKey,
        },
    },
});

if (existingTrade) {
    throw new Error("This trade request has already been processed");
}

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

    // 8. Find the cryptocurrency asset
const asset = await tx.asset.findUnique({
    where: {
        symbol: input.symbol,
    },
});

if (!asset) {
    throw new Error("Asset not found");
}

const existingHolding = await tx.holding.findUnique({
    where: {
        userId_assetId: {
            userId,
            assetId: asset.id,
        },
    },
});

let updatedHolding;

if (existingHolding) {
    // Calculate the new total quantity
    const oldQuantity = new Decimal(existingHolding.quantity.toString());

    const newQuantity = oldQuantity.plus(quantity);

    // Calculate the weighted average buy price
    const oldValue = oldQuantity.mul(
        existingHolding.averageBuyPrice.toString()
    );

    const newValue = total;

    const newAveragePrice = oldValue
        .plus(newValue)
        .div(newQuantity)
        .toDecimalPlaces(8, Decimal.ROUND_HALF_UP);

    // Update existing holding
    updatedHolding = await tx.holding.update({
        where: {
            id: existingHolding.id,
        },
        data: {
            quantity: newQuantity.toFixed(12),
            averageBuyPrice: newAveragePrice.toFixed(8),
        },
    });
} else {
    // Create a new holding
    updatedHolding = await tx.holding.create({
        data: {
            userId,
            assetId: asset.id,
            quantity: quantity.toFixed(12),
            averageBuyPrice: price.toDecimalPlaces(8).toFixed(8),
        },
    });
}
const trade = await tx.trade.create({
    data: {
        userId,
        assetId: asset.id,
        side: "BUY",
        quantity: quantity.toFixed(12),
        price: price.toFixed(8),
        total: total.toFixed(8),
        fee: "0",
        idempotencyKey: input.idempotencyKey,
    },
});

    // 7. Record the wallet deduction in the ledger
    await tx.ledgerEntry.create({
        data: {
            walletId: updatedWallet.id,
            type: "TRADE_BUY",
            amount: total.negated().toFixed(8),
            balanceAfter: updatedWallet.balance,
            description: `Bought ${quantity.toString()} ${input.symbol}`,
            referenceId: trade.id,
        },
    });

    return {
    updatedWallet,
    updatedHolding,
    trade,
};
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
        tradeId: result.trade.id,
        symbol: input.symbol,
        side: input.side,
        quantity: quantity.toString(),
        price: price.toString(),
        total: total.toString(),
        remainingBalance: result.updatedWallet.balance.toString(),
    };
}
