
import { Request, Response } from "express";

import { executeTrade } from "./trade.service";
import { tradeSchema } from "./trade.validation";

export async function executeTradeController(
    req: Request,
    res: Response
) {
    try {
        // 1. Validate the incoming request
        const validation = tradeSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid trade request",
                errors: validation.error.flatten(),
            });
        }

        // 2. Get the authenticated user's ID
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // 3. Execute the trade
        const trade = await executeTrade(userId, validation.data);

        // 4. Return the result
        return res.status(201).json({
            success: true,
            message: "Trade executed successfully",
            trade,
        });

    } catch (error) {
        console.error("Trade execution error:", error);

        const message =
            error instanceof Error ? error.message : "";

        if (
            message === "Insufficient wallet balance or wallet not found" ||
            message === "Trade value is too small" ||
            message === "SELL trades are not implemented yet"
        ) {
            return res.status(400).json({
                success: false,
                message,
            });
        }

        if (message === "This trade request has already been processed") {
            return res.status(409).json({
                success: false,
                message,
            });
        }

        if (message === "Unsupported cryptocurrency") {
            return res.status(400).json({
                success: false,
                message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to execute trade",
        });
    }
}
