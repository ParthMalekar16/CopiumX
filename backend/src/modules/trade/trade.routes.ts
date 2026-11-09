
import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { executeTradeController } from "./trade.controller";

const router = Router();

// All trade requests require authentication
router.post("/", authenticate, executeTradeController);

export default router;
