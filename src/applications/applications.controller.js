import { applicationsService } from "./applications.service.js";

/**
 * @swagger
 * /api/helps/{helpId}/apply:
 *   post:
 *     tags: [Applications]
 *     summary: 돌봄요청 지원 접수
 *     description: HelpRequest.status=0(요청) 인 글에만 지원이 가능합니다. 같은 글에는 한 번만 지원할 수 있습니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: helpId
 *         required: true
 *         schema: { type: integer }
 *         description: 지원할 돌봄요청 ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "파이팅!"
 *                 description: 지원 메시지(선택)
 *     responses:
 *       201:
 *         description: 지원 접수 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: SUCCESS }
 *                 error: { type: object, nullable: true, example: null }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "돌봄 참여가 정상적으로 신청되었습니다." }
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: UNAUTHORIZED }
 *                     reason: { type: string, example: "로그인이 필요합니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
 *       403:
 *         description: 권한 오류(본인 글 지원 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: FORBIDDEN }
 *                     reason: { type: string, example: "본인이 작성한 요청글에는 지원할 수 없습니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
 *       404:
 *         description: 글 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: NOT_FOUND }
 *                     reason: { type: string, example: "해당 돌봄요청을 찾을 수 없습니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
 *       409:
 *         description: 중복 지원
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: CONFLICT }
 *                     reason: { type: string, example: "이미 해당 돌봄요청에 지원하셨습니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: UPDATE_ERROR }
 *                     reason: { type: string, example: "돌봄요청 조회 중 오류가 발생했습니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
 */
export class ApplicationsController {
    async apply(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401,
                });
            }
            const { helpId } = req.params;
            const helperId = req.user.id;

            const result = await applicationsService.applyToHelpRequest(
                helpId,
                helperId,
                req.body
            );

            return res.status(201).json({
                resultType: "SUCCESS",
                error: null,
                data: {
                    message: "돌봄 참여가 정상적으로 신청되었습니다."
                }
            });
        } catch (err) {
            next(err);
        }
    }
}

export const applicationsController = new ApplicationsController();