
import "dotenv/config";

import app from "./app";
import { prisma } from "./config/database";

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Establish database connection
        await prisma.$connect();

        console.log("Connected to PostgreSQL through Prisma!");

        // Start Express server only after DB connection
        app.listen(PORT, () => {
            console.log(`CopiumX API running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}

startServer();
