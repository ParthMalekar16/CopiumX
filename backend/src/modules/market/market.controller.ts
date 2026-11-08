import { Request, Response } from "express";
import { getMarketPrices } from "./market.service";

export async function getMarketPricesController(
    req: Request,
    res: Response
) {
    try {
        const prices = await getMarketPrices();

        return res.status(200).json({
            success: true,
            totalAssets: prices.length,
            prices,
        });

    } catch (error) {
        console.error("Market prices error:", error);

        return res.status(502).json({
            success: false,
            message: "Unable to fetch market prices",
        });
    }
}