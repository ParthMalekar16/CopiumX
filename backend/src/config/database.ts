
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Get the database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in .env");
}

// Create PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString,
});

// Create Prisma Client
export const prisma = new PrismaClient({
    adapter,
});
