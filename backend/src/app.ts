import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/database";
import authRoutes from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import walletRoutes from "./modules/wallet/wallet.routes";

const app = express();

app.use(helmet());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CryptoSim API is running!",
        timestamp: new Date()
    });
});


app.get("/api/v1/db-test", async (req, res) => {
    try {
        const userCount = await prisma.user.count();

        res.status(200).json({
            success: true,
            message: "Database query successful!",
            totalUsers: userCount,
        });

    } catch (error) {
        console.error("Database query failed:", error);

        res.status(500).json({
            success: false,
            message: "Database query failed",
        });
    }
});


export default app;