
import { Router } from "express";

import {
    registerController,
    loginController
} from "./auth.controller";

const router = Router();

// POST /register
router.post("/register", registerController);
router.post("/login", loginController);

export default router;
