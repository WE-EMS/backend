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
     *                           example: null
     *                           description: "커스텀 프로필 이미지 URL (S3)"
     *                         kakaoProfileImageUrl:
     *                           type: string
     *                           example: "http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg"
     *                           description: "카카오 프로필 이미지 URL"
     *                         profileImageUrl:
     *                           type: string
     *                           example: "http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg"
     *                           description: "실제 표시할 프로필 이미지 URL (커스텀 > 카카오 우선순위)"
     *                         hasCustomImage:
     *                           type: boolean
     *                           example: false
     *                           description: "커스텀 프로필 이미지 보유 여부"
     *                         birth:
     *                           type: string
     *                           format: date-time
     *                           nullable: true
     *                           example: null
     *                         phone:
     *                           type: string
     *                           nullable: true
     *                           example: null
     *                         region:
     *                           type: string
     *                           nullable: true
     *                           example: null
     *                         tokenBalance:
     *                           type: integer
     *                           example: 0
     *                         createdAt:
     *                           type: string
     *                           format: date-time
     *                           example: "2025-08-18T15:50:46.944Z"
     *                     stats:
     *                       type: object
     *                       properties:
     *                         reviewCount:
     *                           type: integer
     *                           example: 0
     *                         avgRating:
     *                           type: number
     *                           format: float
     *                           example: 0
     */
    getMyPage = async (req, res) => {
        try {
            const userId = req.user.id;

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

    /**
     * @swagger
     * /api/users/profile/image:
     *   post:
     *     summary: 커스텀 프로필 이미지 업로드
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               image:
     *                 type: string
     *                 format: binary
     *                 description: "업로드할 프로필 이미지 파일 (PNG, JPG, JPEG, BMP, GIF - 최대 5MB)"
     *     responses:
     *       200:
     *         description: 프로필 이미지 업로드 성공
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
     *                     message:
     *                       type: string
     *                       example: "프로필 이미지가 업로드되었습니다."
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 2
     *                         profileImageUrl:
     *                           type: string
     *                           example: "https://s3.amazonaws.com/bucket/user-profiles/2025/uuid_image.jpg"
     *                         hasCustomImage:
     *                           type: boolean
     *                           example: true
     *       400:
     *         description: 잘못된 파일 또는 요청
     *       401:
     *         description: 인증 실패
     *       404:
     *         description: 사용자를 찾을 수 없음
     */
    uploadProfileImage = async (req, res) => {
        try {
            if (!req.file) {
                return res.error({
                    errorCode: "NO_FILE",
                    reason: "업로드할 이미지 파일이 없습니다.",
                    statusCode: 400
                });
            }

            const userId = req.user.id;
            const updatedUser = await usersService.uploadProfileImage(userId, req.file);

            res.success({
                message: "프로필 이미지가 업로드되었습니다.",
                user: {
                    id: updatedUser.id,
                    profileImageUrl: updatedUser.profileImageUrl,
                    hasCustomImage: updatedUser.hasCustomImage
                }
            });
        } catch (error) {
            console.error('프로필 이미지 업로드 오류:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.error({
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자를 찾을 수 없습니다.",
                    statusCode: 404
                });
            }

            res.error({
                errorCode: "INTERNAL_SERVER_ERROR",
                reason: "프로필 이미지 업로드 중 오류가 발생했습니다.",
                statusCode: 500
            });
        }
    };

    /**
     * @swagger
     * /api/users/profile/image:
     *   delete:
     *     summary: 커스텀 프로필 이미지 삭제 (카카오 기본 이미지로 되돌리기)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: 프로필 이미지 삭제 성공
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
     *                     message:
     *                       type: string
     *                       example: "프로필 이미지가 카카오 기본 이미지로 되돌아갔습니다."
     *                     user:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: integer
     *                           example: 2
     *                         profileImageUrl:
     *                           type: string
     *                           example: "http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg"
     *                         hasCustomImage:
     *                           type: boolean
     *                           example: false
     *       400:
     *         description: 삭제할 커스텀 이미지가 없음
     *       401:
     *         description: 인증 실패
     *       404:
     *         description: 사용자를 찾을 수 없음
     */
    resetToKakaoImage = async (req, res) => {
        try {
            const userId = req.user.id;
            const updatedUser = await usersService.resetToKakaoProfileImage(userId);

            res.success({
                message: "프로필 이미지가 카카오 기본 이미지로 되돌아갔습니다.",
                user: {
                    id: updatedUser.id,
                    profileImageUrl: updatedUser.profileImageUrl,
                    hasCustomImage: updatedUser.hasCustomImage
                }
            });
        } catch (error) {
            console.error('프로필 이미지 삭제 오류:', error);

            if (error.message === 'USER_NOT_FOUND') {
                return res.error({
                    errorCode: "USER_NOT_FOUND",
                    reason: "사용자를 찾을 수 없습니다.",
                    statusCode: 404
                });
            }

            if (error.message === 'NO_CUSTOM_IMAGE') {
                return res.error({
                    errorCode: "NO_CUSTOM_IMAGE",
                    reason: "삭제할 커스텀 프로필 이미지가 없습니다.",
                    statusCode: 400
                });
            }

            res.error({
                errorCode: "INTERNAL_SERVER_ERROR",
                reason: "프로필 이미지 삭제 중 오류가 발생했습니다.",
                statusCode: 500
            });
        }
    };
}

export const usersController = new UsersController();