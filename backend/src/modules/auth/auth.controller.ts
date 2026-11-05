
import { Request, Response } from "express";

import { registerSchema } from "./auth.validation";
import { registerUser } from "./auth.service";

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
