import express from 'express';
import { reviewController } from './reviews.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: 리뷰 관련 API
 */

// 특정 요청(HelpRequest)에 대한 리뷰
router.post("/helps/:helpId", requireAuth, reviewController.createForHelp);

// 특정 배정(HelpAssignment)에 대한 리뷰
router.post("/assignments/:assignmentId", requireAuth, reviewController.createForAssignment);

// (테스트용) 3일 경과 자동 완료
router.post('/auto-complete', reviewController.autoCompleteHelps);

export { router as reviewsRoutes };