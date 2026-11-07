
import { Request, Response } from "express";
import { prisma } from "../../config/database";

export async function getWalletController(
    req: Request,
    res: Response
) {
    try {
        // Get the authenticated user's ID
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Find the user's wallet
        const wallet = await prisma.wallet.findUnique({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                currency: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Check whether the wallet exists
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found",
            });
        }

        // Return wallet information
        return res.status(200).json({
            success: true,
            wallet,
        });

    } catch (error) {
        console.error("Get wallet error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
