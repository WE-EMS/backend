import { applicationsService } from "./applications.service.js";

export class ApplicationsController {
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

    // 지원자 목록
    async getApplyList(req, res, next) {
        /**
     * @swagger
     * /api/helps/{helpId}/apply-list:
     *   get:
     *     tags: [Applications]
     *     summary: 지원자 목록 조회 (글쓴이만)
     *     description: 요청글 작성자만 자신의 글에 지원한 지원자 목록을 조회합니다.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: helpId
     *         required: true
     *         schema: { type: integer }
     *         description: 지원자 목록을 조회할 돌봄요청 ID
     *     responses:
     *       200:
     *         description: 조회 성공
     *         content:
     *           application/json:
     *             examples:
     *               noApplicants:
     *                 summary: 지원자가 없음
     *                 value:
     *                   resultType: SUCCESS
     *                   error: null
     *                   data:
     *                     help:
     *                       id: 6
     *                       helpType: 4
     *                       helpTypeText: "기타"
     *                       status: 0
     *                       statusText: "요청"
     *                     totalApplicants: 0
     *                     applicants: []
     *               withApplicants:
     *                 summary: 지원자가 있음
     *                 value:
     *                   resultType: SUCCESS
     *                   error: null
     *                   data:
     *                     help:
     *                       id: 16
     *                       helpType: 1
     *                       helpTypeText: "등하원"
     *                       status: 0
     *                       statusText: "요청"
     *                     totalApplicants: 1
     *                     applicants:
     *                       - applicationId: 1
     *                         status: 0
     *                         statusText: "대기"
     *                         message: "시간 맞춰 안전하게 모시겠습니다!"
     *                         createdAt: "2025-08-20T07:30:00.618Z"
     *                         helper:
     *                           id: 3
     *                           nickname: "염둘"
     *                           profileImageUrl: null
     *                           reviewCount: 0
     *                           ratingAvg: 0
     *       401:
     *         description: 인증 필요
     *         content:
     *           application/json:
     *             example:
     *               resultType: FAIL
     *               error:
     *                 errorCode: UNAUTHORIZED
     *                 reason: "로그인이 필요합니다."
     *                 data: null
     *               success: null
     *       403:
     *         description: 권한 없음(글쓴이 아님)
     *         content:
     *           application/json:
     *             example:
     *               resultType: FAIL
     *               error:
     *                 errorCode: FORBIDDEN
     *                 reason: "해당 요청글의 작성자만 조회할 수 있습니다."
     *                 data: null
     *               success: null
     *       404:
     *         description: 글 없음
     *         content:
     *           application/json:
     *             example:
     *               resultType: FAIL
     *               error:
     *                 errorCode: NOT_FOUND
     *                 reason: "해당 돌봄요청을 찾을 수 없습니다."
     *                 data: null
     *               success: null
     *       500:
     *         description: 서버 오류
     *         content:
     *           application/json:
     *             example:
     *               resultType: FAIL
     *               error:
     *                 errorCode: FETCH_ERROR
     *                 reason: "지원자 조회 중 오류가 발생했습니다."
     *                 data: null
     *               success: null
     */
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401,
                });
            }

            const { helpId } = req.params;
            const requesterId = req.user.id;

            const data = await applicationsService.getApplyList(helpId, requesterId);

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                data,
            });
        } catch (err) {
            next(err);
        }
    }
}

export const applicationsController = new ApplicationsController();