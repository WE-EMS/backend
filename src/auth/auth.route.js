import express from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = express.Router();

// 카카오 로그인 시작
router.get('/kakao', authController.kakaoLogin);

// 카카오 콜백
router.get('/oauth2/callback/kakao', authController.kakaoCallbackHandler);

// 로그아웃
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// 현재 사용자 정보 조회 (인증 상태 확인 + 사용자 정보)
router.get('/me', requireAuth, authController.getCurrentUser);

// 토큰 갱신
router.post('/refresh', requireAuth, authController.refreshToken);

export { router as authRoutes };