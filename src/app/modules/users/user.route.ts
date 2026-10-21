import { Router } from "express";
import { UserController } from "./user.controllers";

const router = Router();

router.post("/register",UserController.registerUser)

export const UserRoutes = router;
