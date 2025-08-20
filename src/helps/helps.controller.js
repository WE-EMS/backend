import { helpsService } from "./helps.service.js";

export class HelpsController {
    /**
 * @swagger
 * /api/helps:
 *   post:
 *     tags: [Helps]
 *     summary: 돌봄요청 글 작성
 *     description: 새로운 돌봄요청을 작성합니다. 로그인한 사용자만 이용 가능합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - helpType
 *               - serviceDate
 *               - startTime
 *               - endTime
 *               - addressText
 *             properties:
 *               helpType:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: "도움 유형 (1: 등하원, 2: 놀이, 3: 동행, 4: 기타)"
 *                 example: 1
 *               serviceDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-20"
 *               startTime:
 *                 type: string
 *                 example: "10:30"
 *               endTime:
 *                 type: string
 *                 example: "12:00"
 *               addressText:
 *                 type: string
 *                 example: "서울시 동대문구 한교동"
 *               requestLocation:
 *                 type: string
 *                 example: "스타벅스 앞"
 *               requestDetail:
 *                 type: string
 *                 example: "아이 숙제 도와주세요."
 *               requestNote:
 *                 type: string
 *                 example: "수학 과목 위주로 부탁드려요."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "첨부 이미지 (선택사항)"
 *     responses:
 *       200:
 *         description: 돌봄요청 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "글이 작성되었습니다."
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     reason:
 *                       type: string
 *                       example: "서비스 날짜는 오늘 또는 이후여야 합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: 인증 필요 (로그인 안 됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: UNAUTHORIZED
 *                     reason:
 *                       type: string
 *                       example: "로그인이 필요합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: CREATE_ERROR
 *                     reason:
 *                       type: string
 *                       example: "돌봄요청 생성 중 오류가 발생했습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 */
    async createHelpRequest(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401
                });
            }

            const created = await helpsService.createHelpRequest(
                req.body,
                req.user.id,
                req.file
            );
            return res.status(201).json({
                resultType: "SUCCESS",
                error: null,
                data: {
                    message: "글이 작성되었습니다.",
                    id: created.id
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
    * @swagger
    * /api/helps/{helpId}:
    *   get:
    *     tags: [Helps]
    *     summary: 특정 돌봄요청 상세 조회
    *     description: ID로 특정 돌봄요청의 상세 정보를 조회합니다.
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: helpId
    *         required: true
    *         schema:
    *           type: integer
    *         description: 돌봄요청 ID
    *     responses:
    *       200:
    *         description: 돌봄요청 조회 성공
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 resultType:
    *                   type: string
    *                   example: SUCCESS
    *                 error:
    *                   type: object
    *                   nullable: true
    *                   example: null
    *                 success:
    *                   type: object
    *                   properties:
    *                     id:
    *                       type: integer
    *                       example: 1
    *                     helpType:
    *                       type: integer
    *                       example: 1
    *                     helpTypeText:
    *                       type: string
    *                       example: "등/하원 돌봄"
    *                     serviceDate:
    *                       type: string
    *                       format: date
    *                       example: "2024-08-20"
    *                     startTime:
    *                       type: string
    *                       example: "09:30:00"
    *                     endTime:
    *                       type: string
    *                       example: "11:00:00"
    *                     addressText:
    *                       type: string
    *                       example: "서울시 동대문구 한교동"
    *                     requestLocation:
    *                       type: string
    *                       example: "스타벅스 앞"
    *                     requestDetail:
    *                       type: string
    *                       example: "아이 숙제 도와주세요."
    *                     requestNote:
    *                       type: string
    *                       example: "수학 과목 위주로 부탁드려요."
    *                     status:
    *                       type: integer
    *                       example: 0
    *                     statusText:
    *                       type: string
    *                       example: "요청"
    *                     imageUrl:
    *                       type: string
    *                       nullable: true
    *                     rewardTokens:
    *                       type: integer
    *                       example: 15
    *                     requester:
    *                       type: object
    *                       properties:
    *                         id:
    *                           type: integer
    *                         nickname:
    *                           type: string
    *                         imageUrl:
    *                           type: string
    *                           nullable: true
    *                         avgRating:
    *                           type: number
    *                           format: float
    *                           example: 4.5
    *                         reviewCount:
    *                           type: integer
    *                           example: 12
    *                     createdAt:
    *                       type: string
    *                       format: date-time
    *                     updatedAt:
    *                       type: string
    *                       format: date-time
    *       401:
    *         description: 인증 필요 (로그인 안 됨)
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 resultType:
    *                   type: string
    *                   example: FAIL
    *                 error:
    *                   type: object
    *                   properties:
    *                     errorCode:
    *                       type: string
    *                       example: UNAUTHORIZED
    *                     reason:
    *                       type: string
    *                       example: "로그인이 필요합니다."
    *                     data:
    *                       type: object
    *                       nullable: true
    *                 success:
    *                   nullable: true
    *                   example: null
    *       404:
    *         description: 돌봄요청을 찾을 수 없음
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 resultType:
    *                   type: string
    *                   example: FAIL
    *                 error:
    *                   type: object
    *                   properties:
    *                     errorCode:
    *                       type: string
    *                       example: NOT_FOUND
    *                     reason:
    *                       type: string
    *                       example: "해당 돌봄요청을 찾을 수 없습니다."
    *                     data:
    *                       type: object
    *                       nullable: true
    *                 success:
    *                   nullable: true
    *                   example: null
    */
    async getHelpRequestById(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401
                });
            }
            const { helpId } = req.params;
            const result = await helpsService.getHelpRequestById(helpId);
            res.success(result);
        } catch (error) {
            next(error);
        }
    }


    /**
 * @swagger
 * /api/helps/{helpId}:
 *   put:
 *     tags: [Helps]
 *     summary: 돌봄요청 글 수정
 *     description: 기존 돌봄요청을 수정합니다. 본인의 요청만 수정 가능합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: helpId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 돌봄요청 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - helpType
 *               - serviceDate
 *               - startTime
 *               - endTime
 *               - addressText
 *             properties:
 *               helpType:
 *                 type: integer
 *                 enum: [1, 2, 3, 4]
 *                 description: "도움 유형 (1: 등/하원 돌봄, 2: 놀이 돌봄, 3: 동행 돌봄, 4: 기타 돌봄)"
 *                 example: 4
 *               serviceDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-20"
 *               startTime:
 *                 type: string
 *                 example: "10:30"
 *               endTime:
 *                 type: string
 *                 example: "12:00"
 *               addressText:
 *                 type: string
 *                 example: "서울시 동대문구 한교동"
 *               requestLocation:
 *                 type: string
 *                 example: "스타벅스 앞"
 *               requestDetail:
 *                 type: string
 *                 example: "아이 밥을 차려주세요."
 *               requestNote:
 *                 type: string
 *                 example: "고기 반찬 위주로 부탁드려요."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "첨부 이미지 (선택사항)"
 *     responses:
 *       200:
 *         description: 돌봄요청 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "글이 수정되었습니다."
 *       400:
 *         description: 유효성 검사 실패 또는 수정 불가 상태
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     reason:
 *                       type: string
 *                       example: "서비스 날짜는 오늘 또는 이후여야 합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: 인증 필요 (로그인 안 됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: UNAUTHORIZED
 *                     reason:
 *                       type: string
 *                       example: "로그인이 필요합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       403:
 *         description: 권한 없음 (본인 요청이 아님)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: FORBIDDEN
 *                     reason:
 *                       type: string
 *                       example: "자신의 돌봄요청만 수정할 수 있습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 돌봄요청을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: NOT_FOUND
 *                     reason:
 *                       type: string
 *                       example: "해당 돌봄요청을 찾을 수 없습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: UPDATE_ERROR
 *                     reason:
 *                       type: string
 *                       example: "돌봄요청 수정 중 오류가 발생했습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 */
    async updateHelpRequest(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401
                });
            }

            const { helpId } = req.params;
            await helpsService.updateHelpRequest(
                helpId,
                req.body,
                req.user.id,
                req.file
            );

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                data: {
                    message: "글이 수정되었습니다."
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
 * @swagger
 * /api/helps/{helpId}:
 *   delete:
 *     tags: [Helps]
 *     summary: 돌봄요청 글 삭제
 *     description: 돌봄요청을 삭제합니다. 본인의 요청만 삭제 가능합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: helpId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 돌봄요청 ID
 *     responses:
 *       200:
 *         description: 돌봄요청 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "돌봄요청이 삭제되었습니다."
 *       400:
 *         description: 삭제 불가능한 상태 (이미 삭제됨, 완료된 요청 등)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: INVALID_STATUS
 *                     reason:
 *                       type: string
 *                       example: "완료된 돌봄요청은 삭제할 수 없습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: 인증 필요 (로그인 안 됨)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: UNAUTHORIZED
 *                     reason:
 *                       type: string
 *                       example: "로그인이 필요합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       403:
 *         description: 권한 없음 (본인 요청이 아님)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: FORBIDDEN
 *                     reason:
 *                       type: string
 *                       example: "자신의 돌봄요청만 삭제할 수 있습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 돌봄요청을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: NOT_FOUND
 *                     reason:
 *                       type: string
 *                       example: "해당 돌봄요청을 찾을 수 없습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: DELETE_ERROR
 *                     reason:
 *                       type: string
 *                       example: "돌봄요청 삭제 중 오류가 발생했습니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   nullable: true
 *                   example: null
 */
    async deleteHelpRequest(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401
                });
            }

            const { helpId } = req.params;
            const result = await helpsService.deleteHelpRequest(helpId, req.user.id);
            res.success(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @swagger
     * /api/helps:
     *   get:
     *     tags: [Helps]
     *     summary: 돌봄요청 리스트 조회
     *     description: 모든 상태의 돌봄요청 리스트를 조회합니다.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *         description: 페이지 번호
     *       - in: query
     *         name: size
     *         schema: { type: integer, default: 10 }
     *         description: 페이지당 항목 수
     *     responses:
     *       200:
     *         description: 리스트 조회 성공
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: SUCCESS
     *                 error:
     *                   type: object
     *                   nullable: true
     *                   example: null
     *                 success:
     *                   type: object
     *                   properties:
     *                     requests:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id: { type: integer, example: 2 }
     *                           helpType: { type: integer, example: 3 }
     *                           helpTypeText: { type: string, example: "동행 돌봄" }
     *                           serviceDate: { type: string, format: date-time, example: "2025-08-19T00:00:00.000Z" }
     *                           startTime: { type: string, format: date-time, example: "1970-01-01T00:30:00.000Z" }
     *                           endTime: { type: string, format: date-time, example: "1970-01-01T02:00:00.000Z" }
     *                           addressText: { type: string, example: "서울시 동대문구 한국동" }
     *                           rewardTokens: { type: integer, example: 5 }
     *                           createdAt: { type: string, format: date-time, example: "2025-08-18T17:34:07.826Z" }
     *                           updatedAt: { type: string, format: date-time, example: "2025-08-18T17:34:07.826Z" }
     *                           durationMinutes: { type: integer, example: 90 }
     *                           requester:
     *                             type: object
     *                             properties:
     *                               id: { type: integer, example: 2 }
     *                               nickname: { type: string, example: "수림" }
     *                               imageUrl: { type: string, example: "https://example.com/image.jpg" }
     *                               avgRating: { type: number, format: float, example: 4.5 }
     *                               reviewCount: { type: integer, example: 12 }
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page: { type: integer, example: 2 }
     *                         totalPage: { type: integer, example: 2 }
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
     *                     data: { type: object, nullable: true }
     *                 success: { nullable: true, example: null }
     *       500:
     *         description: 서버 내부 오류
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: FAIL
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: UPDATE_ERROR
     *                     reason:
     *                       type: string
     *                       example: "돌봄요청 조회 중 오류가 발생했습니다."
     *                     data:
     *                       type: object
     *                       example: {}
     *                 success:
     *                   nullable: true
     *                   example: null
     */
    async getHelpList(req, res, next) {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401,
                });
            }
            const page = parseInt(req.query.page ?? "1");
            const size = parseInt(req.query.size ?? "10");

            const result = await helpsService.getHelpList({ page, size });

            return res.status(200).json({
                resultType: "SUCCESS",
                error: null,
                success: {
                    requests: result.requests,   // 배열
                    pagination: result.pagination // { page, totalPage }
                }
            });
        } catch (error) {
            return res.status(500).json({
                resultType: "FAIL",
                error: {
                    errorCode: "UPDATE_ERROR",
                    reason: "돌봄요청 조회 중 오류가 발생했습니다.",
                    data: {}
                },
                success: null
            });
        }
    }

}

export const helpsController = new HelpsController();