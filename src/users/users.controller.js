import { usersService } from './users.service.js';
import { UpdateProfileRequestDto } from './dto/users.request.dto.js';
import { MyPageResponseDto } from './dto/users.response.dto.js';

class UsersController {
    /**
     * @swagger
     * /api/users/me:
     *   get:
     *     summary: 마이페이지 정보 조회
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 마이페이지 정보 조회 성공
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "SUCCESS"
     *                 error:
     *                   type: null
     *                   example: null
     *                 success:
     *                   type: object
     *                   properties:
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 1
     *                         nickname:
     *                           type: string
     *                           example: "두리안"
     *                         email:
     *                           type: string
     *                           example: "user@example.com"
     *                         imageUrl:
     *                           type: string
     *                           nullable: true
     *                           example: "https://example.com/image.jpg"
     *                         birth:
     *                           type: string
     *                           format: date-time
     *                           nullable: true
     *                           example: "1990-01-01T00:00:00.000Z"
     *                         phone:
     *                           type: string
     *                           nullable: true
     *                           example: "010-1234-5678"
     *                         region:
     *                           type: string
     *                           nullable: true
     *                           example: "서울특별시 동대문구 한교동"
     *                         tokenBalance:
     *                           type: integer
     *                           example: 0
     *                         createdAt:
     *                           type: string
     *                           format: date-time
     *                           example: "2024-01-01T00:00:00.000Z"
     *                     stats:
     *                       type: object
     *                       properties:
     *                         reviewCount:
     *                           type: integer
     *                           example: 217
     *                         avgRating:
     *                           type: number
     *                           format: float
     *                           example: 4.8
     *       401:
     *         description: 인증 실패
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "UNAUTHORIZED"
     *                     reason:
     *                       type: string
     *                       example: "인증이 필요합니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
     *                   example: null
     *       404:
     *         description: 사용자를 찾을 수 없음
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "USER_NOT_FOUND"
     *                     reason:
     *                       type: string
     *                       example: "사용자를 찾을 수 없습니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
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
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "INTERNAL_SERVER_ERROR"
     *                     reason:
     *                       type: string
     *                       example: "마이페이지 정보 조회 중 오류가 발생했습니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
     *                   example: null
     */
    getMyPage = async (req, res) => {
        try {
            const userId = req.user.id; // auth.middleware에서 설정된 사용자 ID

            const myPageData = await usersService.getMyPageInfo(userId);

            const response = new MyPageResponseDto(myPageData);

            res.success(response);
        } catch (error) {
            console.error('마이페이지 조회 오류:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.error({
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자를 찾을 수 없습니다.",
                    statusCode: 404
                });
            }

            res.error({
                errorCode: "INTERNAL_SERVER_ERROR",
                reason: "마이페이지 정보 조회 중 오류가 발생했습니다.",
                statusCode: 500
            });
        }
    };

    /**
     * @swagger
     * /api/users/me:
     *   put:
     *     summary: 프로필 정보 수정
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nickname:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 20
     *                 example: "새로운닉네임"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "newemail@example.com"
     *               imageUrl:
     *                 type: string
     *                 nullable: true
     *                 example: "https://example.com/newimage.jpg"
     *               imageKey:
     *                 type: string
     *                 nullable: true
     *                 example: "images/profile/12345.jpg"
     *               birth:
     *                 type: string
     *                 format: date
     *                 nullable: true
     *                 example: "1990-01-01"
     *               phone:
     *                 type: string
     *                 nullable: true
     *                 pattern: "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
     *                 example: "010-1234-5678"
     *               region:
     *                 type: string
     *                 nullable: true
     *                 example: "서울특별시 강남구"
     *     responses:
     *       200:
     *         description: 프로필 수정 성공
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "SUCCESS"
     *                 error:
     *                   type: null
     *                   example: null
     *                 success:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                       example: 1
     *                     nickname:
     *                       type: string
     *                       example: "새로운닉네임"
     *                     email:
     *                       type: string
     *                       example: "newemail@example.com"
     *                     imageUrl:
     *                       type: string
     *                       nullable: true
     *                       example: "https://example.com/newimage.jpg"
     *                     birth:
     *                       type: string
     *                       format: date-time
     *                       nullable: true
     *                       example: "1990-01-01T00:00:00.000Z"
     *                     phone:
     *                       type: string
     *                       nullable: true
     *                       example: "010-1234-5678"
     *                     region:
     *                       type: string
     *                       nullable: true
     *                       example: "서울특별시 강남구"
     *                     updatedAt:
     *                       type: string
     *                       format: date-time
     *                       example: "2024-01-01T00:00:00.000Z"
     *       400:
     *         description: 잘못된 요청 데이터
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "VALIDATION_ERROR"
     *                     reason:
     *                       type: string
     *                       example: "닉네임은 2글자 이상 20글자 이하여야 합니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
     *                   example: null
     *       401:
     *         description: 인증 실패
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "UNAUTHORIZED"
     *                     reason:
     *                       type: string
     *                       example: "인증이 필요합니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
     *                   example: null
     *       404:
     *         description: 사용자를 찾을 수 없음
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 resultType:
     *                   type: string
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "USER_NOT_FOUND"
     *                     reason:
     *                       type: string
     *                       example: "사용자를 찾을 수 없습니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
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
     *                   example: "FAIL"
     *                 error:
     *                   type: object
     *                   properties:
     *                     errorCode:
     *                       type: string
     *                       example: "INTERNAL_SERVER_ERROR"
     *                     reason:
     *                       type: string
     *                       example: "프로필 수정 중 오류가 발생했습니다."
     *                     data:
     *                       type: null
     *                       example: null
     *                 success:
     *                   type: null
     *                   example: null
     */
    updateProfile = async (req, res) => {
        try {
            const userId = req.user.id;
            const updateData = new UpdateProfileRequestDto(req.body);

            // 유효성 검사
            const validationError = updateData.validate();
            if (validationError) {
                return res.error({
                    errorCode: "VALIDATION_ERROR",
                    reason: validationError,
                    statusCode: 400
                });
            }

            const updatedUser = await usersService.updateProfile(userId, updateData.getUpdateData());

            res.success(updatedUser);
        } catch (error) {
            console.error('프로필 수정 오류:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.error({
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자를 찾을 수 없습니다.",
                    statusCode: 404
                });
            }

            if (error.message === 'EMAIL_ALREADY_EXISTS') {
                return res.error({
                    errorCode: "EMAIL_ALREADY_EXISTS",
                    reason: "이미 사용중인 이메일입니다.",
                    statusCode: 400
                });
            }

            res.error({
                errorCode: "INTERNAL_SERVER_ERROR",
                reason: "프로필 수정 중 오류가 발생했습니다.",
                statusCode: 500
            });
        }
    };
}

export const usersController = new UsersController();