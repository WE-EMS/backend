import express from "express";
import { usersController } from "./users.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { userProfileImageUploader } from "../middleware/image.uploader.js";

const router = express.Router();

// 마이페이지 정보 조회
router.get('/me', requireAuth, usersController.getMyPage);

// 프로필 정보 수정
router.put('/me', requireAuth, usersController.updateProfile);

// 커스텀 프로필 이미지 업로드
router.post('/profile/image',
    requireAuth,
    userProfileImageUploader.single('image'),
    usersController.uploadProfileImage
);

// 프로필 이미지를 카카오 기본으로 되돌리기
router.delete('/profile/image',
    requireAuth,
    usersController.resetToKakaoImage
);

export { router as usersRoutes };