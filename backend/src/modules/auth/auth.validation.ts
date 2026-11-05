
import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must have at least 3 characters")
        .max(20, "Username cannot exceed 20 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers and underscores"
        ),

    email: z
        .string()
        .email("Please enter a valid email address"),

    password: z
        .string()
        .min(8, "Password must have at least 8 characters")
        .max(72, "Password is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
