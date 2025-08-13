import { authService } from "./auth.service.js";
import { AuthResponseDto } from "./dto/auth.response.dto.js";

class AuthController {
    /**
     * @swagger
     * /auth/kakao:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: 카카오 로그인 시작
     *     description: 카카오 OAuth 인증을 시작합니다. 카카오 로그인 페이지로 리다이렉트됩니다.
     *     responses:
     *       302:
     *         description: 카카오 인증 페이지로 리다이렉트
     *         headers:
     *           Location:
     *             description: 카카오 OAuth 인증 URL
     *             schema:
     *               type: string
     *               example: "https://kauth.kakao.com/oauth/authorize?client_id=..."
     */
    kakaoLogin = (req, res) => {
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent('http://localhost:3000/auth/oauth2/callback/kakao')}&response_type=code`;
        res.redirect(kakaoAuthUrl);
    };

    /**
     * @swagger
     * /auth/oauth2/callback/kakao:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: 카카오 로그인 콜백 처리
     *     description: 카카오 OAuth 인증 후 콜백을 처리하고 JWT 토큰을 발급합니다.
     *     parameters:
     *       - in: query
     *         name: code
     *         required: true
     *         description: 카카오에서 발급한 인증 코드
     *         schema:
     *           type: string
     *           example: "abc123def456"
     *       - in: query
     *         name: error
     *         required: false
     *         description: 인증 실패 시 오류 코드
     *         schema:
     *           type: string
     *           example: "access_denied"
     *     responses:
     *       302:
     *         description: 로그인 성공 시 대시보드로 리다이렉트
     *         headers:
     *           Location:
     *             description: 리다이렉트 URL
     *             schema:
     *               type: string
     *               example: "/dashboard"
     *           Set-Cookie:
     *             description: JWT 액세스 토큰이 포함된 쿠키
     *             schema:
     *               type: string
     *               example: "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Max-Age=604800"
     *       302 (Error):
     *         description: 로그인 실패 시 로그인 페이지로 리다이렉트
     *         headers:
     *           Location:
     *             description: 에러와 함께 로그인 페이지로 리다이렉트
     *             schema:
     *               type: string
     *               example: "/login?error=kakao_failed"
     */
    kakaoCallbackHandler = async (req, res) => {
        try {
            const { code } = req.query;

            if (!code) {
                return res.redirect('/login?error=no_code');
            }

            // 카카오 액세스 토큰 요청
            const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: process.env.KAKAO_REST_API_KEY,
                    redirect_uri: 'http://localhost:3000/auth/oauth2/callback/kakao',
                    code: code,
                }),
            });

            const tokenData = await tokenResponse.json();

            if (!tokenData.access_token) {
                throw new Error('Failed to get access token');
            }

            // 카카오 사용자 정보 요청
            const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
            });

            const userData = await userResponse.json();

            // 프로필 정보를 passport profile 형태로 변환
            const profile = {
                id: userData.id,
                displayName: userData.kakao_account?.profile?.nickname,
                _json: userData
            };

            const tokens = await authService.handleKakaoLogin(profile);

            // JWT 토큰을 쿠키에 저장
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });

            res.redirect('/dashboard');
        } catch (error) {
            console.error('Kakao callback error:', error);
            res.redirect('/login?error=kakao_failed');
        }
    };

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     tags:
     *       - Authentication
     *     summary: 로그아웃 (POST)
     *     description: 사용자를 로그아웃하고 JWT 토큰 쿠키를 제거합니다.
     *     responses:
     *       200:
     *         description: 로그아웃 성공
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
     *                       example: "로그아웃이 완료되었습니다."
     *   get:
     *     tags:
     *       - Authentication
     *     summary: 로그아웃 (GET)
     *     description: 사용자를 로그아웃하고 JWT 토큰 쿠키를 제거합니다.
     *     responses:
     *       200:
     *         description: 로그아웃 성공
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
     *                       example: "로그아웃이 완료되었습니다."
     */
    logout = (req, res) => {
        res.clearCookie('accessToken');
        res.success({ message: "로그아웃이 완료되었습니다." });
    };

    /**
     * @swagger
     * /auth/me:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: 현재 로그인한 사용자 정보 조회
     *     description: JWT 토큰을 통해 현재 로그인한 사용자의 정보를 조회합니다.
     *     security:
     *       - bearerAuth: []
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: 사용자 정보 조회 성공
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
     *                   $ref: '#/components/schemas/AuthResponseDto'
     *       401:
     *         description: 인증되지 않은 사용자
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

    /**
     * @swagger
     * /auth/status:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: 인증 상태 확인
     *     description: 현재 사용자의 인증 상태를 확인합니다. 토큰이 없어도 호출 가능합니다.
     *     security:
     *       - bearerAuth: []
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: 인증 상태 확인 성공
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
     *                     isAuthenticated:
     *                       type: boolean
     *                       example: true
     *                       description: 인증 여부
     *                     user:
     *                       oneOf:
     *                         - $ref: '#/components/schemas/AuthResponseDto'
     *                         - type: null
     *                       example: null
     *                       description: 인증된 경우 사용자 정보, 미인증 시 null
     */
    checkAuth = (req, res) => {
        res.success({
            isAuthenticated: !!req.user,
            user: req.user ? AuthResponseDto.fromUser(req.user) : null
        });
    };
}

export const authController = new AuthController();