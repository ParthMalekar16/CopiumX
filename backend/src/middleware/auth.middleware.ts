
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.log("Cookie header received:", Boolean(req.headers.cookie));

console.log(
    "Parsed cookie names:",
    Object.keys(req.cookies ?? {})
);
    const token = req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            success: false,
            message: "Authentication is not configured",
        });
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string"
) {
    return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
    });
}

req.user = {
    userId: decoded.userId
};

next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
