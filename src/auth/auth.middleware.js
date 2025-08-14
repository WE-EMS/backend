import { authService } from "./auth.service.js";

// JWT 토큰 추출 함수
const extractToken = (req) => {
    // 1. Authorization 헤더에서 Bearer 토큰 확인
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. 쿠키에서 토큰 확인
    if (req.cookies && req.cookies.accessToken) {
        return req.cookies.accessToken;
    }

    return null;
};

// 로그인 필수 미들웨어
export const requireAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            // API 요청인 경우 JSON 응답
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.error({
                    errorCode: "UNAUTHORIZED",
                    reason: "로그인이 필요합니다.",
                    statusCode: 401
                });
            }

            // 일반 페이지 요청인 경우 로그인 페이지로 리다이렉트 (새 경로)
            return res.redirect('/api/auth/kakao');
        }

        const user = await authService.getUserFromToken(token);
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        // 토큰이 유효하지 않은 경우
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.error({
                errorCode: "UNAUTHORIZED",
                reason: "유효하지 않은 토큰입니다.",
                statusCode: 401
            });
        }

        res.redirect('/api/auth/kakao');
    }
};

// 사용자 정보 주입 미들웨어 (선택적 인증)
export const injectUser = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (token) {
            try {
                const user = await authService.getUserFromToken(token);
                req.user = user;
                res.locals.user = user;
                res.locals.isAuthenticated = true;
            } catch (error) {
                // 토큰이 유효하지 않아도 에러를 발생시키지 않음
                console.log('Token validation failed in injectUser:', error.message);
                req.user = null;
                res.locals.user = null;
                res.locals.isAuthenticated = false;
            }
        } else {
            req.user = null;
            res.locals.user = null;
            res.locals.isAuthenticated = false;
        }

        next();
    } catch (error) {
        console.error('InjectUser middleware error:', error);
        req.user = null;
        res.locals.user = null;
        res.locals.isAuthenticated = false;
        next();
    }
};