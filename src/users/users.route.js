import express from "express";
import { usersController } from "./users.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = express.Router();

// 마이페이지 정보 조회
router.get('/me', requireAuth, usersController.getMyPage);

// 프로필 정보 수정
router.put('/me', requireAuth, usersController.updateProfile);

export { router as usersRoutes };