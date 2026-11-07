
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
    getWalletController,
    getWalletTransactionsController,
} from "./wallet.controller";

const router = Router();

router.get("/", authenticate, getWalletController);
router.get("/transactions", authenticate, getWalletTransactionsController);

export default router;
