import { reviewService } from './reviews.service.js';
import { CreateHelpReviewDto, CreateAssignmentReviewDto } from './dto/reviews.request.dto.js';
import { ReviewResponseDto, ReviewWritableDto, ReviewWrittenItemDto, ReviewReceivedItemDto } from './dto/reviews.response.dto.js';

export const reviewController = {
    async createForHelp(req, res) {
        /**
         * @swagger
         * /api/reviews/helps/{helpId}:
         *   post:
         *     tags: [Reviews]
         *     summary: 특정 돌봄요청(HelpRequest)에 대한 리뷰 작성 (돌봄참여자가 돌봄요청자에게)
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: helpId
         *         required: true
         *         schema:
         *           type: integer
         *         description: 리뷰를 작성할 HelpRequest ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [rating]
         *             properties:
         *               rating:
         *                 type: integer
         *                 minimum: 1
         *                 maximum: 5
         *               content:
         *                 type: string
         *                 description: 리뷰 내용
         *     responses:
         *       201:
         *         description: 리뷰 작성 성공
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ResultSuccessReview'
         *             examples:
         *               success:
         *                 value:
         *                   resultType: SUCCESS
         *                   error: null
         *                   data:
         *                     id: 2
         *                     helpId: 17
         *                     reviewerId: 3
         *                     revieweeId: 2
         *                     rating: 5
         *                     content: "리뷰내용"
         *                     createdAt: "2025-08-26T14:09:27.323Z"
         *       401:
         *         description: 인증 필요
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *             examples:
         *               unauthorized:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: UNAUTHORIZED
         *                     reason: "로그인이 필요합니다."
         *                     data: null
         *                   success: null
         *       403:
         *         description: 권한 없음
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *             examples:
         *               forbidden:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: FORBIDDEN
         *                     reason: "해당 요청글의 작성자만 처리할 수 있습니다."
         *                     data: null
         *                   success: null
         *       404:
         *         description: 대상 없음(요청글 미존재 등)
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *             examples:
         *               notFound:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: NOT_FOUND
         *                     reason: "해당 돌봄요청을 찾을 수 없습니다."
         *                     data: null
         *                   success: null
         *       409:
         *         description: 유효하지 않은 작업(상태 충돌 등)
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *             examples:
         *               noHelperAssigned:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: INVALID_OPERATION
         *                     reason: "현재 배정된 헬퍼가 없습니다."
         *                     data: null
         *                   success: null
         *               notAcceptState:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: INVALID_OPERATION
         *                     reason: "현재 수락 상태가 아니라 철회할 수 없습니다."
         *                     data: null
         *                   success: null
         *       500:
         *         description: 내부 처리 중 오류
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *             examples:
         *               updateError:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: UPDATE_ERROR
         *                     reason: "철회 처리 중 오류가 발생했습니다."
         *                     data: null
         *                   success: null
         */
        try {
            const reviewerId = req.user.id;
            const dto = new CreateHelpReviewDto({
                helpId: req.params.helpId,
                rating: req.body.rating,
                content: req.body.content,
            });
            dto.validate();

            const data = await reviewService.createForHelp({
                reviewerId, helpId: dto.helpId, rating: dto.rating, content: dto.content,
            });
            return res.status(201).json({ resultType: 'SUCCESS', error: null, success: new ReviewResponseDto(data) });
        } catch (e) {
            next(internalError(e.message, e.code || "UPDATE_ERROR"));
        }
    },

    async createForAssignment(req, res) {
        /**
         * @swagger
         * /api/reviews/assignments/{assignmentId}:
         *   post:
         *     tags: [Reviews]
         *     summary: 특정 돌봄참여(HelpAssignment)에 대한 리뷰 작성 (요청자가 참여자에게 작성)
         *     description: 로그인한 요청자가, 완료된 배정(assignment)에 대해 참여자에게 리뷰를 작성합니다.
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: assignmentId
         *         required: true
         *         schema:
         *           type: integer
         *         description: 리뷰를 작성할 HelpAssignment ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [rating]
         *             properties:
         *               rating:
         *                 type: integer
         *                 minimum: 1
         *                 maximum: 5
         *                 example: 5
         *               content:
         *                 type: string
         *                 example: "정말 친절하게 도와주셨어요!"
         *     responses:
         *       201:
         *         description: 리뷰 작성 성공
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
         *                     id: { type: integer, example: 2 }
         *                     helpId: { type: integer, example: 17 }
         *                     reviewerId: { type: integer, example: 3 }
         *                     revieweeId: { type: integer, example: 2 }
         *                     rating: { type: integer, example: 5 }
         *                     content: { type: string, example: "string" }
         *                     createdAt: { type: string, format: date-time, example: "2025-08-26T14:09:27.323Z" }
         *       401:
         *         description: 인증 필요 (로그인 안 됨)
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
         *                     data: { nullable: true, example: null }
         *                 success: { nullable: true, example: null }
         *             examples:
         *               unauthorized:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: UNAUTHORIZED
         *                     reason: "로그인이 필요합니다."
         *                     data: null
         *                   success: null
         *       403:
         *         description: 권한 없음 (요청글 작성자만 처리 가능)
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
         *                     reason: { type: string, example: "해당 요청글의 작성자만 처리할 수 있습니다." }
         *                     data: { nullable: true, example: null }
         *                 success: { nullable: true, example: null }
         *             examples:
         *               forbidden:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: FORBIDDEN
         *                     reason: "해당 요청글의 작성자만 처리할 수 있습니다."
         *                     data: null
         *                   success: null
         *       404:
         *         description: 대상 없음(요청글/배정 없음)
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
         *                     data: { nullable: true, example: null }
         *                 success: { nullable: true, example: null }
         *             examples:
         *               notFound:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: NOT_FOUND
         *                     reason: "해당 돌봄요청을 찾을 수 없습니다."
         *                     data: null
         *                   success: null
         *       409:
         *         description: 유효하지 않은 작업(상태 충돌 등)
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 resultType: { type: string, example: FAIL }
         *                 error:
         *                   type: object
         *                   properties:
         *                     errorCode: { type: string, example: INVALID_OPERATION }
         *                     reason: { type: string, example: "상태 오류" }
         *                     data: { nullable: true, example: null }
         *                 success: { nullable: true, example: null }
         *             examples:
         *               noHelperAssigned:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: INVALID_OPERATION
         *                     reason: "현재 배정된 헬퍼가 없습니다."
         *                     data: null
         *                   success: null
         *               notAcceptState:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: INVALID_OPERATION
         *                     reason: "현재 수락 상태가 아니라 철회할 수 없습니다."
         *                     data: null
         *                   success: null
         *       500:
         *         description: 내부 처리 중 오류
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
         *                     reason: { type: string, example: "철회 처리 중 오류가 발생했습니다." }
         *                     data: { nullable: true, example: null }
         *                 success: { nullable: true, example: null }
         *             examples:
         *               updateError:
         *                 value:
         *                   resultType: FAIL
         *                   error:
         *                     errorCode: UPDATE_ERROR
         *                     reason: "철회 처리 중 오류가 발생했습니다."
         *                     data: null
         *                   success: null
         */
        try {
            const reviewerId = req.user.id;
            const dto = new CreateAssignmentReviewDto({
                assignmentId: req.params.assignmentId,
                rating: req.body.rating,
                content: req.body.content,
            });
            dto.validate();

            const data = await reviewService.createForAssignment({
                reviewerId, assignmentId: dto.assignmentId, rating: dto.rating, content: dto.content,
            });
            return res.status(201).json({ resultType: 'SUCCESS', error: null, success: new ReviewResponseDto(data) });
        } catch (e) {
            next(internalError(e.message, e.code || "UPDATE_ERROR"));
        }
    },

    async autoCompleteHelps(_req, res) {
        /**
         * @swagger
         * /api/reviews/auto-complete:
         *   post:
         *     tags: [Reviews]
         *     summary: (배치) 리뷰 미작성 도움 자동 완료 처리
         *     responses:
         *       200: { description: 완료 처리된 도움 개수 반환 }
         *       500: { description: 처리 중 오류 }
         */
        try {
            const { affectedCount } = await reviewService.autoCompleteHelps();
            return res.status(200).json({ resultType: 'SUCCESS', error: null, success: { affectedCount } });
        } catch (e) {
            next(internalError(e.message, e.code || "UPDATE_ERROR"));
        }
    },

    /**
     * @swagger
     * /api/reviews/me:
     *   get:
     *     tags: [Reviews]
     *     summary: 내 리뷰 작성 가능 목록
     *     description: 내가 요청자/참여자였던 도움들 중, 아직 내가 리뷰를 작성하지 않은 건(리뷰 가능 기간 3일 내)만 반환
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, minimum: 1, default: 1 }
     *         description: 페이지 번호
     *       - in: query
     *         name: size
     *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
     *         description: 페이지 크기
     *     responses:
     *       200:
     *         description: 성공
     *         content:
     *           application/json:
     *             examples:
     *               empty:
     *                 summary: 작성 가능 항목이 없는 경우
     *                 value:
     *                   resultType: SUCCESS
     *                   error: null
     *                   success:
     *                     items: []
     *                     pagination:
     *                       page: 1
     *                       totalPages: 1
     *               withItems:
     *                 summary: 작성 가능 항목이 있는 경우
     *                 value:
     *                   resultType: SUCCESS
     *                   error: null
     *                   success:
     *                     items:
     *                       - helpId: 19
     *                         assignmentId: null
     *                         helpType: 2
     *                         serviceDate: "2025-08-27T00:00:00.000Z"
     *                         participantNickname: null
     *                         counterRole: "참여자"
     *                       - helpId: 20
     *                         assignmentId: 7
     *                         helpType: 2
     *                         serviceDate: "2025-08-27T00:00:00.000Z"
     *                         participantNickname: "염둘"
     *                         counterRole: "참여자"
     *                       - helpId: 21
     *                         assignmentId: 6
     *                         helpType: 2
     *                         serviceDate: "2025-08-27T00:00:00.000Z"
     *                         participantNickname: "염둘"
     *                         counterRole: "참여자"
     *                       - helpId: 22
     *                         assignmentId: 8
     *                         helpType: 2
     *                         serviceDate: "2025-08-27T00:00:00.000Z"
     *                         participantNickname: "염둘"
     *                         counterRole: "요청자"
     *                     pagination:
     *                       page: 1
     *                       totalPages: 1
     */
    async getMyReviewables(req, res) {
        try {
            const userId = req.user.id;
            const page = Math.max(1, Number(req.query.page ?? 1));
            const size = Math.max(1, Math.min(100, Number(req.query.size ?? 10)));
            const { items, pagination } = await reviewService.getMyReviewables(userId, { page, size });
            return res.status(200).json({
                resultType: 'SUCCESS',
                error: null,
                success: {
                    items: items.map(x => new ReviewWritableDto(x)),
                    pagination
                }
            });
        } catch (e) {
            next(internalError(e.message, e.code || "FETCH_ERROR"));
        }
    },

    async getMyWritten(req, res) {
        /**
     * @swagger
     * /api/reviews/me/written:
     *   get:
     *     tags: [Reviews]
     *     summary: 내가 쓴 리뷰 목록
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: size
     *         schema: { type: integer, default: 10 }
     *     responses:
     *       200:
     *         description: 성공
     *         content:
     *           application/json:
     *             example:
     *               resultType: SUCCESS
     *               error: null
     *               success:
     *                 items:
     *                   - counterNickname: "김엄마"
     *                     counterRole: "참여자"
     *                     helpType: 1
     *                     rating: 5
     *                     createdAt: "2025-08-28T10:30:00.000Z"
     *                     content: "정말 감사했어요!"
     *                   - counterNickname: "이아빠"
     *                     counterRole: "요청자"
     *                     helpType: 2
     *                     rating: 4
     *                     createdAt: "2025-08-29T14:20:00.000Z"
     *                     content: "좋았습니다."
     *                 pagination:
     *                   page: 1
     *                   totalPages: 1
     */
        try {
            const userId = req.user.id;
            const page = Math.max(1, Number(req.query.page ?? 1));
            const size = Math.max(1, Math.min(100, Number(req.query.size ?? 10)));
            const { items, pagination } = await reviewService.getMyWritten(userId, { page, size });
            return res.status(200).json({
                resultType: 'SUCCESS',
                error: null,
                success: {
                    items: items.map(x => new ReviewWritableDto(x)),
                    pagination
                }
            });
        } catch (e) {
            next(internalError(e.message, e.code || "FETCH_ERROR"));
        }
    },

    async getMyReceived(req, res) {
        /**
     * @swagger
     * /api/reviews/me/received:
     *   get:
     *     tags: [Reviews]
     *     summary: 내가 받은 리뷰 목록
     *     security: [ { bearerAuth: [] } ]
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: size
     *         schema: { type: integer, default: 10 }
     *     responses:
     *       200:
     *         description: 성공
     *         content:
     *           application/json:
     *             example:
     *               resultType: SUCCESS
     *               error: null
     *               success:
     *                 items:
     *                   - counterNickname: "수림"
     *                     counterRole: "요청자"
     *                     helpType: 1
     *                     rating: 5
     *                     createdAt: "2025-08-28T12:00:00.000Z"
     *                     content: "매우 만족합니다!"
     *                   - counterNickname: "박선생"
     *                     counterRole: "참여자"
     *                     helpType: 3
     *                     rating: 3
     *                     createdAt: "2025-08-29T09:15:00.000Z"
     *                     content: "시간 약속이 아쉬웠어요."
     *                 pagination:
     *                   page: 1
     *                   totalPages: 1
     */
        try {
            const userId = req.user.id;
            const page = Math.max(1, Number(req.query.page ?? 1));
            const size = Math.max(1, Math.min(100, Number(req.query.size ?? 10)));
            const { items, pagination } = await reviewService.getMyReceived(userId, { page, size });
            return res.status(200).json({
                resultType: 'SUCCESS',
                error: null,
                success: {
                    items: items.map(x => new ReviewWritableDto(x)),
                    pagination
                }
            });
        } catch (e) {
            next(internalError(e.message, e.code || "FETCH_ERROR"));
        }
    },
};
