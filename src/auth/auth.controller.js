import { authService } from "./auth.service.js";
import { AuthResponseDto } from "./dto/auth.response.dto.js";

/**
 * @swagger
 * /api/auth/kakao:
 *   get:
 *     tags: [Authentication]
 *     summary: "카카오 로그인 시작"
 *     description: "카카오 OAuth 인증을 시작합니다. 카카오 로그인 페이지로 리다이렉트됩니다."
 *     responses:
 *       302:
 *         description: "카카오 인증 페이지로 리다이렉트"
 *         headers:
 *           Location:
 *             description: "카카오 인증 페이지 URL"
 *             schema:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/oauth2/callback/kakao:
 *   get:
 *     tags: [Authentication]
 *     summary: "카카오 로그인 콜백 처리"
 *     description: "카카오 OAuth 인증 후 콜백을 처리하고 우리 서비스의 JWT를 발급합니다. 토큰을 JSON으로 응답합니다."
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: "카카오에서 제공하는 인증 코드"
 *     responses:
 *       200:
 *         description: "로그인 성공"
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
 *                       example: "로그인이 완료되었습니다."
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-22T15:30:00.000Z"
 *                       description: "토큰 만료 시간 (ISO 8601 형식)"
 *       400:
 *         description: "잘못된 요청 (code 없음 등)"
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
 *                       example: "NO_AUTH_CODE"
 *                     reason:
 *                       type: string
 *                       example: "인증 코드가 없습니다."
 *                     data:
 *                       type: null
 *                       example: null
 *                 success:
 *                   type: null
 *                   example: null
 *       500:
 *         description: "내부 서버 오류"
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
 *                       example: "KAKAO_LOGIN_FAILED"
 *                     reason:
 *                       type: string
 *                       example: "카카오 로그인 처리 중 오류가 발생했습니다."
 *                     data:
 *                       type: null
 *                       example: null
 *                 success:
 *                   type: null
 *                   example: null
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: "현재 사용자 정보 조회"
 *     description: "JWT가 유효한 경우 현재 로그인한 사용자의 정보를 반환합니다. 인증 상태 확인 및 사용자 정보 조회를 동시에 처리합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "사용자 정보 조회 성공"
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
 *                     kakaoId:
 *                       type: string
 *                       example: "1234567890"
 *                     nickname:
 *                       type: string
 *                       example: "홍길동"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/profile.jpgg"
 *                     imageKey:
 *                       type: null
 *                       example: null
 *                     birth:
 *                       type: null
 *                       example: null
 *                     phone:
 *                       type: null
 *                       example: null
 *                     region:
 *                       type: null
 *                       example: null
 *                     tokenBalance:
 *                       type: integer
 *                       example: 0
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-13T02:53:41.317Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-13T02:53:41.317Z"
 *       401:
 *         description: "인증 실패 - 토큰이 없거나 유효하지 않음"
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
 *                       example: "인증되지 않은 사용자입니다."
 *                     data:
 *                       type: null
 *                       example: null
 *                 success:
 *                   type: null
 *                   example: null
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: "로그아웃"
 *     description: "클라이언트에서 토큰 제거를 안내하기 위해 사용합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "로그아웃 완료"
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
 *                       example: "로그아웃이 완료되었습니다. 클라이언트에서 토큰을 제거해주세요."
 *                     action:
 *                       type: string
 *                       example: "REMOVE_TOKEN"
 *   get:
 *     tags: [Authentication]
 *     summary: "로그아웃 (GET)"
 *     description: "동일한 로그아웃 엔드포인트의 GET 버전입니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "로그아웃 완료"
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
 *                       example: "로그아웃이 완료되었습니다. 클라이언트에서 토큰을 제거해주세요."
 *                     action:
 *                       type: string
 *                       example: "REMOVE_TOKEN"
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: "토큰 갱신"
 *     description: "현재 유효한 JWT 토큰을 새로운 토큰으로 갱신합니다. 토큰 만료 시간을 연장하고 싶을 때 사용합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "토큰 갱신 성공"
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
 *                       example: "토큰이 갱신되었습니다."
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: "새로 발급된 JWT 액세스 토큰"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-22T15:30:00.000Z"
 *                       description: "토큰 만료 시간 (ISO 8601 형식)"
 *       401:
 *         description: "인증 실패 - 유효하지 않은 토큰"
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
 *                       example: "인증되지 않은 사용자입니다."
 *                     data:
 *                       type: null
 *                       example: null
 *                 success:
 *                   type: null
 *                   example: null
 *       500:
 *         description: "서버 오류 - 토큰 갱신 실패"
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
 *                       example: "TOKEN_REFRESH_FAILED"
 *                     reason:
 *                       type: string
 *                       example: "토큰 갱신에 실패했습니다."
 *                     data:
 *                       type: null
 *                       example: null
 *                 success:
 *                   type: null
 *                   example: null
 */

const getRedirectUri = () => {
    const uri = process.env.NODE_ENV === 'production'
        ? process.env.KAKAO_REDIRECT_URI_PROD
        : process.env.KAKAO_REDIRECT_URI_DEV;
    return uri;
};

class AuthController {
    // 카카오 로그인 시작
    kakaoLogin = (req, res) => {
        const redirectUri = getRedirectUri();
        const kakaoAuthUrl =
            `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        res.redirect(kakaoAuthUrl);
    };

    // 카카오 콜백: 토큰만 JSON으로 응답
    kakaoCallbackHandler = async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) {
                return res.error({
                    errorCode: "NO_AUTH_CODE",
                    reason: "인증 코드가 없습니다.",
                    statusCode: 400
                });
            }
            const redirectUri = getRedirectUri();

            // 1) 카카오 액세스 토큰 발급
            const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: process.env.KAKAO_REST_API_KEY,
                    redirect_uri: redirectUri,
                    code
                }),
            });

            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) {
                throw new Error('카카오 토큰 발급에 실패했습니다.');
            }

            // 2) 카카오 유저 정보
            const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const userData = await userResponse.json();

            const profile = {
                id: userData.id,
                displayName: userData.kakao_account?.profile?.nickname,
                _json: userData
            };

            // 3) 우리 서비스 JWT 발급
            const tokens = await authService.handleKakaoLogin(profile);

            // 4) JSON 응답으로 토큰만 반환
            res.success({
                message: "로그인이 완료되었습니다.",
                accessToken: tokens.accessToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });

        } catch (error) {
            console.error('Kakao callback error:', error);
            res.error({
                errorCode: "KAKAO_LOGIN_FAILED",
                reason: error.message || "카카오 로그인 처리 중 오류가 발생했습니다.",
                statusCode: 500
            });
        }
    };

    // 로그아웃
    logout = (req, res) => {
        res.success({
            message: "로그아웃이 완료되었습니다. 클라이언트에서 토큰을 제거해주세요.",
            action: "REMOVE_TOKEN"
        });
    };

    // 현재 사용자 정보 조회 (인증 상태 확인 + 사용자 정보)
    getCurrentUser = (req, res) => {
        if (!req.user) {
            return res.error({
                errorCode: "UNAUTHORIZED",
                reason: "인증되지 않은 사용자입니다.",
                statusCode: 401
            });
        }
        const userResponse = AuthResponseDto.fromUser(req.user);
        res.success(userResponse);
    };

    // 토큰 갱신
    refreshToken = async (req, res) => {
        try {
            if (!req.user) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "인증되지 않은 사용자입니다.",
                    statusCode: 401
                });
            }

            const tokens = authService.generateTokens(req.user);
            res.success({
                message: "토큰이 갱신되었습니다.",
                accessToken: tokens.accessToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.error({
                errorCode: "TOKEN_REFRESH_FAILED",
                reason: "토큰 갱신에 실패했습니다.",
                statusCode: 500
            });
        }
    };
}

export const authController = new AuthController();