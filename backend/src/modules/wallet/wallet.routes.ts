
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getWalletController } from "./wallet.controller";

const router = Router();

router.get("/", authenticate, getWalletController);

export default router;
