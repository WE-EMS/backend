import express from "express";
import { helpsController } from "./helps.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { helpRequestImageUploader } from "../middleware/image.uploader.js";
import { applicationsRoutes } from "../applications/applications.route.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Helps
 *   description: 돌봄요청 관리 API
 */

// 리스트 조회
router.get("/", helpsController.getHelpList);

// 내가 작성한 돌봄요청 조회 (진행중인 글만)
router.get("/me", requireAuth, helpsController.getMyHelpRequests);

// 돌봄요청 글 작성
router.post("/", requireAuth, helpRequestImageUploader.single('image'), helpsController.createHelpRequest);

// 특정 돌봄요청 상세 조회
router.get("/:helpId", requireAuth, helpsController.getHelpRequestById);

// 돌봄요청 글 수정
router.put("/:helpId", requireAuth, helpRequestImageUploader.single('image'), helpsController.updateHelpRequest);

// 돌봄요청 글 삭제
router.delete("/:helpId", requireAuth, helpsController.deleteHelpRequest);


// applications 라우트
router.use("/", applicationsRoutes);

export { router as helpsRoutes };