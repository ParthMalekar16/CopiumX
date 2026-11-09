
import { z } from "zod";

export const tradeSchema = z.object({
    symbol: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{2,10}$/, "Invalid asset symbol"),

    side: z.enum(["BUY", "SELL"]),

    quantity: z
        .string()
        .regex(
            /^(?=.*[1-9])\d+(\.\d{1,12})?$/,
            "Quantity must be a positive number with up to 12 decimal places"
        ),
        idempotencyKey: z.string().uuid(),
});

export type TradeInput = z.infer<typeof tradeSchema>;
