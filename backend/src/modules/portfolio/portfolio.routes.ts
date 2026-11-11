
import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { getPortfolioController } from "./portfolio.controller";

const router = Router();

router.get("/", authenticate, getPortfolioController);

export default router;
