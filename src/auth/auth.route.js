import express from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = express.Router();

// 카카오 로그인 시작
router.get('/kakao', authController.kakaoLogin);

// 카카오 콜백 (실제 구현)
router.get('/oauth2/callback/kakao', authController.kakaoCallbackHandler);

// 로그아웃
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// 현재 사용자 정보 API
router.get('/me', requireAuth, authController.getCurrentUser);

// 인증 상태 확인 API
router.get('/status', authController.checkAuth);

export { router as authRoutes };