import express from "express";
import { applicationsController } from "./applications.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: 돌봄요청 지원 API
 */

// 지원 접수
router.post("/:helpId/apply", requireAuth, applicationsController.apply);

export { router as applicationsRoutes };
