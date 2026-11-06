import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { RegisterInput } from "./auth.validation";
import { LoginInput } from "./auth.validation";
import { generateAccessToken } from "../../utils/token";

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


export async function loginUser(data: LoginInput) {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    // 2. Check if user exists
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
        data.password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // 4. Generate JWT after successful authentication
    const accessToken = generateAccessToken(user.id);

    // 5. Return token and safe user information
    return {
        accessToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
        },
    };
}


