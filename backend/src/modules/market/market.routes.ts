import { Router } from "express";
import { getMarketPricesController } from "./market.controller";

const router = Router();

router.get("/prices", getMarketPricesController);

export default router;