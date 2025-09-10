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
 *       400:
 *         description: 모집 종료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType: { type: string, example: FAIL }
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode: { type: string, example: CLOSED }
 *                     reason: { type: string, example: "모집이 종료된 글입니다." }
 *                     data: { type: object, nullable: true, example: null }
 *                 success: { type: object, nullable: true, example: null }
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
         *       - in: query
         *         name: page
         *         schema: { type: integer, minimum: 1, default: 1 }
         *         description: 페이지 번호(기본 1)
         *       - in: query
         *         name: size
         *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
         *         description: 페이지 크기(기본 10, 최대 50)
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
         *                   success:
         *                     help:
         *                       id: 6
         *                       helpType: 4
         *                       helpTypeText: "기타"
         *                       status: 0
         *                       statusText: "요청"
         *                     totalApplicants: 0
         *                     applicants: []
         *                     pagination:
         *                       page: 1
         *                       totalPages: 1
         *               withApplicants:
         *                 summary: 지원자가 있음
         *                 value:
         *                   resultType: SUCCESS
         *                   error: null
         *                   success:
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
         *                           imageUrl: null
         *                           reviewCount: 2
         *                           ratingAvg: 5
         *                     pagination:
         *                       page: 1
         *                       totalPages: 1
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
            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const size = Math.min(Math.max(parseInt(req.query.size) || 10, 1), 50);

            const data = await applicationsService.getApplyList(helpId, requesterId, { page, size });


            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                success: data,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
   * @swagger
   * /api/helps/{helpId}/accept:
   *   post:
   *     tags: [Applications]
   *     summary: 지원 수락/거절 (글쓴이만)
   *     description: 하나의 요청글에 대해 오직 한 명만 수락할 수 있습니다. 수락 시 다른 지원자는 자동으로 거절 처리됩니다. (그치만 만약 reject 입력시 거절되게끔도 해놓음)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: helpId
   *         required: true
   *         schema: { type: integer }
   *         description: 수락/거절할 대상이 속한 돌봄요청 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [applicationId, decision]
   *             properties:
   *               applicationId:
   *                 type: integer
   *                 example: 12
   *                 description: 수락/거절 대상 지원 신청의 ID
   *               decision:
   *                 type: string
   *                 enum: [accept, reject]
   *                 example: accept
   *                 description: "처리 동작 (accept: 수락, reject: 거절)"
   *     responses:
   *       200:
   *         description: 처리 성공
   *         content:
   *           application/json:
   *             example:
   *               resultType: SUCCESS
   *               error: null
   *               data:
   *                 message: "지원이 수락되었습니다."
   *                 help:
   *                   id: 16
   *                   status: 1
   *                   statusText: "배정"
   *                 application:
   *                   id: 12
   *                   status: 1
   *                   statusText: "수락"
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
    async acceptOrReject(req, res, next) {
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
            const { applicationId, decision } = req.body || {};

            const data = await applicationsService.decideApplication(helpId, requesterId, {
                applicationId,
                decision,
            });

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                data,
            });
        } catch (err) {
            next(err);
        }
    }

    /**
   * @swagger
   * /api/helps/{helpId}/helper-kick:
   *   put:
   *     tags: [Applications]
   *     summary: 수락 철회(헬퍼 킥) — 글쓴이만
   *     description: >
   *       해당 돌봄요청에 현재 배정된 헬퍼의 지원 신청을 **철회(status=3)** 로만 변경합니다.  
   *       HelpRequest.status 및 다른 지원자들의 상태는 변경하지 않습니다. (상호리뷰를 위해 원상태 유지)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: helpId
   *         required: true
   *         schema: { type: integer }
   *         description: 철회 처리할 배정이 연결된 돌봄요청 ID
   *     responses:
   *       200:
   *         description: 철회 처리 성공
   *         content:
   *           application/json:
   *             example:
   *               resultType: SUCCESS
   *               error: null
   *               data:
   *                 message: "배정된 헬퍼의 수락이 철회되었습니다."
   *                 help:
   *                   id: 16
   *                   status: 1
   *                   statusText: "배정"
   *                 application:
   *                   id: 12
   *                   status: 3
   *                   statusText: "철회"
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
   *                 reason: "해당 요청글의 작성자만 처리할 수 있습니다."
   *                 data: null
   *               success: null
   *       404:
   *         description: 글/배정/신청 없음
   *         content:
   *           application/json:
   *             examples:
   *               notFoundHelp:
   *                 value:
   *                   resultType: FAIL
   *                   error:
   *                     errorCode: NOT_FOUND
   *                     reason: "해당 돌봄요청을 찾을 수 없습니다."
   *                     data: null
   *                   success: null
   *       409:
   *         description: 현재 배정 상태 아님 등 처리 불가 상황
   *         content:
   *           application/json:
   *             examples:
   *               noAssignment:
   *                 value:
   *                   resultType: FAIL
   *                   error:
   *                     errorCode: INVALID_OPERATION
   *                     reason: "현재 배정된 헬퍼가 없습니다."
   *                     data: null
   *                   success: null
   *               notAccepted:
   *                 value:
   *                   resultType: FAIL
   *                   error:
   *                     errorCode: INVALID_OPERATION
   *                     reason: "현재 수락 상태가 아니라 철회할 수 없습니다."
   *                     data: null
   *                   success: null
   *       500:
   *         description: 서버 오류
   *         content:
   *           application/json:
   *             example:
   *               resultType: FAIL
   *               error:
   *                 errorCode: UPDATE_ERROR
   *                 reason: "철회 처리 중 오류가 발생했습니다."
   *                 data: null
   *               success: null
   */
    async helperKick(req, res, next) {
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

            const data = await applicationsService.kickAssignedHelper(helpId, requesterId);

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                data,
            });
        } catch (err) {
            next(err);
        }
    }

    async getMyApplications(req, res, next) {
        /**
     * @swagger
     * /api/helps/apply/me:
     *   get:
     *     tags: [Applications]
     *     summary: 내 돌봄 참여 목록 조회
     *     description: 로그인한 사용자가 지원한 돌봄요청들의 목록을 페이지네이션으로 조회합니다.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, minimum: 1, default: 1 }
     *         description: "페이지 번호 (기본값: 1)"
     *       - in: query
     *         name: size
     *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
     *         description: "페이지 크기 (기본값: 10, 최대: 50)"
     *     responses:
     *       200:
     *         description: 조회 성공
     *         content:
     *           application/json:
     *             example:
     *               resultType: SUCCESS
     *               error: null
     *               success:
     *                 applications:
     *                   - applicationId: 15
     *                     status: 1
     *                     statusText: "수락"
     *                     createdAt: "2025-08-25T10:30:00.000Z"
     *                     help:
     *                       id: 20
     *                       helpType: 1
     *                       helpTypeText: "등하원"
     *                       serviceDate: "2025-08-20T00:00:00.000Z"
     *                       startTime: "1970-01-01T01:30:00.000Z"
     *                       endTime: "1970-01-01T03:00:00.000Z"
     *                       requester:
     *                         id: 5
     *                         nickname: "김엄마"
     *                         imageUrl: "https://example.com/profile.jpg"
     *                         reviewCount: 12
     *                         ratingAvg: 4.8
     *                 pagination:
     *                   page: 1
     *                   totalPages: 3
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
     *       500:
     *         description: 서버 오류
     *         content:
     *           application/json:
     *             example:
     *               resultType: FAIL
     *               error:
     *                 errorCode: FETCH_ERROR
     *                 reason: "돌봄 참여 목록 조회 중 오류가 발생했습니다."
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

            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const size = Math.min(parseInt(req.query.size) || 10, 50);

            const data = await applicationsService.getMyApplications(userId, { page, size });

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                success: data,
            });
        } catch (err) {
            next(err);
        }
    }
}

export const applicationsController = new ApplicationsController();