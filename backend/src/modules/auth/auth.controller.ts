import { Request, Response } from "express";
import { registerSchema } from "./auth.validation";
import { registerUser } from "./auth.service";
import { loginSchema } from "./auth.validation";
import { loginUser } from "./auth.service";
import { prisma } from "../../config/database";     

export async function registerController(
    req: Request,
    res: Response
) {
    try {
        // 1. Validate incoming request data
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // 2. Register the user
        const user = await registerUser(validation.data);

        // 3. Return successful response
        return res.status(201).json({
            success: true,
            message: "Account created successfully!",
            data: user,
        });

    } catch (error) {
        console.error("Registration error:", error);

        if (
            error instanceof Error &&
            (
                error.message === "Username is already taken" ||
                error.message === "Email is already registered"
            )
        ) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


export async function loginController(
    req: Request,
    res: Response
) {
    try {
        // 1. Validate login credentials
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // 2. Authenticate user
        const { accessToken, user } = await loginUser(validation.data);

        // 3. Store JWT in HTTP-only cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });

        // 4. Return user information
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            data: user,
        });

    } catch (error) {
        console.error("Login error:", error);

        if (
            error instanceof Error &&
            error.message === "Invalid email or password"
        ) {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


export async function getMeController(
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

        // Find the user in PostgreSQL
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                createdAt: true,
            },
        });

        // Check whether the user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Return the user's profile
        return res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


export function logoutController(
    req: Request,
    res: Response
) {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
}
