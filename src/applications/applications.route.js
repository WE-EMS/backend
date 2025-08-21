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

// 지원자 목록 조회 (글쓴이만)
router.get("/:helpId/apply-list", requireAuth, applicationsController.getApplyList);

// 지원 수락/거절 (글쓴이만)
router.post("/:helpId/accept", requireAuth, applicationsController.acceptOrReject);

// 수락 철회(헬퍼 킥) (글쓴이만)
router.put("/:helpId/helper-kick", requireAuth, applicationsController.helperKick);

export { router as applicationsRoutes };
