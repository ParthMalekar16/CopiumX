
import jwt from "jsonwebtoken";

export function generateAccessToken(userId: string): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
        { userId },
        secret,
        {
            expiresIn: "15m",
        }
    );
}
