
import bcrypt from "bcrypt";

import { prisma } from "../../config/database";
import { RegisterInput } from "./auth.validation";

export async function registerUser(data: RegisterInput) {
    // Check whether username or email already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: data.username },
                { email: data.email },
            ],
        },
    });

    if (existingUser) {
        if (existingUser.username === data.username) {
            throw new Error("Username is already taken");
        }

        throw new Error("Email is already registered");
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and wallet together in one transaction
    const user = await prisma.$transaction(async (tx) => {
        return tx.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash,

                wallet: {
                    create: {
                        currency: "USD",
                        balance: 10000,
                    },
                },
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                createdAt: true,
                wallet: {
                    select: {
                        currency: true,
                        balance: true,
                    },
                },
            },
        });
    });

    return user;
}
