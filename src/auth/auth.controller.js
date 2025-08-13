import { authService } from "./auth.service.js";
import { AuthResponseDto } from "./dto/auth.response.dto.js";

/**
 * @swagger
 * /auth/kakao:
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
 * /auth/oauth2/callback/kakao:
 *   get:
 *     tags: [Authentication]
 *     summary: "카카오 로그인 콜백 처리"
 *     description: "카카오 OAuth 인증 후 콜백을 처리하고 우리 서비스의 JWT를 발급합니다. 발급된 토큰은 프론트엔드로 쿼리스트링(`?token=...`)으로 전달됩니다."
 *     responses:
 *       302:
 *         description: "프론트엔드로 리다이렉트 (쿼리스트링으로 JWT 전달)"
 *         headers:
 *           Location:
 *             description: "프론트엔드 성공 경로 (예: `/oauth-success?token=...`)"
 *             schema:
 *               type: string
 *               example: "https://jogakdolbom.vercel.app/oauth-success?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: "잘못된 요청 (code 없음 등)"
 *       500:
 *         description: "내부 서버 오류"
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: "현재 사용자 정보 조회"
 *     description: "JWT가 유효한 경우 현재 로그인한 사용자의 기본 정보를 반환합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "사용자 정보"
 *       401:
 *         description: "인증 실패"
 */

/**
 * @swagger
 * /auth/status:
 *   get:
 *     tags: [Authentication]
 *     summary: "인증 상태 확인"
 *     description: "로그인 여부와 간단한 사용자 정보를 반환합니다."
 *     responses:
 *       200:
 *         description: "인증 상태"
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: "로그아웃"
 *     description: "(Bearer 방식에서는 서버 상태 변경이 거의 없지만) 클라이언트에서 토큰 제거를 안내하기 위해 사용합니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "로그아웃 완료"
 *   get:
 *     tags: [Authentication]
 *     summary: "로그아웃 (GET)"
 *     description: "동일한 로그아웃 엔드포인트의 GET 버전입니다."
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "로그아웃 완료"
 */

const getRedirectUri = () => {
    const uri = process.env.NODE_ENV === 'production'
        ? process.env.KAKAO_REDIRECT_URI_PROD
        : process.env.KAKAO_REDIRECT_URI_DEV;
    return uri;
};

const getFrontendBase = () =>
    process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_BASE_URL || 'https://jogakdolbom.vercel.app')
        : (process.env.FRONTEND_BASE_URL_DEV || 'http://localhost:3000');

class AuthController {
    // 카카오 로그인 시작
    kakaoLogin = (req, res) => {
        const redirectUri = getRedirectUri();
        const kakaoAuthUrl =
            `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
        res.redirect(kakaoAuthUrl);
    };

    // 카카오 콜백: 토큰 발급 후 프론트로 ?token=... 리다이렉트
    kakaoCallbackHandler = async (req, res) => {
        try {
            const { code } = req.query;
            if (!code) return res.redirect('/login?error=no_code');

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
            if (!tokenData.access_token) throw new Error('Failed to get access token');

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

            // 4) (중요) 쿠키 대신 프론트로 토큰을 쿼리스트링으로 전달
            const frontendBase = getFrontendBase();
            return res.redirect(`${frontendBase}/oauth-success?token=${tokens.accessToken}`);
        } catch (error) {
            console.error('Kakao callback error:', error);
            return res.redirect('/login?error=kakao_failed');
        }
    };

    // 이하 동일 (me/status/logout 등)
    logout = (req, res) => {
        // Bearer 방식이라 서버 쿠키 의존 없음. 혹시 남아있다면 정리만.
        res.clearCookie('accessToken');
        res.success({ message: "로그아웃이 완료되었습니다." });
    };

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

    checkAuth = (req, res) => {
        res.success({
            isAuthenticated: !!req.user,
            user: req.user ? AuthResponseDto.fromUser(req.user) : null
        });
    };
}

export const authController = new AuthController();