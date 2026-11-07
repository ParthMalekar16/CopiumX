import { Router } from "express";
import {
    registerController,
    loginController,
    getMeController,
} from "./auth.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// POST /register
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", authenticate, getMeController);

export default router;
