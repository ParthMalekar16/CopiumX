
import { Request, Response } from "express";

import { getPortfolio } from "./portfolio.service";

export async function getPortfolioController(
    req: Request,
    res: Response
) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const portfolio = await getPortfolio(userId);

        return res.status(200).json({
            success: true,
            portfolio,
        });

    } catch (error) {
        console.error("Portfolio error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch portfolio",
        });
    }
}
