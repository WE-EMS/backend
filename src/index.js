import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUiExpress from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swaggerSpec.js";

// dotenv를 가장 먼저 로드
dotenv.config();

import { prisma } from "./db.config.js"; // (필요 없으면 삭제해도 됨)

// Auth 모듈 임포트
import { authRoutes } from "./auth/auth.route.js";
import { injectUser } from "./auth/auth.middleware.js";

const app = express();
const port = process.env.PORT || 3000;

// 환경변수 검증
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error("WARNING: JWT_SECRET is not set in environment variables");
    console.error("Using a default secret for development. DO NOT use this in production!");
}

// 기본 미들웨어 설정
const whitelist = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        // Postman/서버사이드 등 Origin 없는 요청 허용
        if (!origin) return callback(null, true);
        if (whitelist.includes(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// 사전 요청(OPTIONS) 빠른 응답
app.options("*", cors(corsOptions));

app.use(express.static("public")); // 정적 파일 접근
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: false })); // URL 인코딩 파싱
app.use(cookieParser()); // 쿠키 파싱 (Bearer 방식이지만, 기존 호환을 위해 유지)

// 사용자 정보 주입 미들웨어
app.use(injectUser);

// 공통 응답 헬퍼
app.use((req, res, next) => {
    res.success = (success) => res.json({ resultType: "SUCCESS", error: null, success });
    res.error = ({ errorCode = "unknown", reason = null, data = null, statusCode = 400 }) =>
        res.status(statusCode).json({
            resultType: "FAIL",
            error: { errorCode, reason, data },
            success: null,
        });
    next();
});

// ===== Swagger =====
// OpenAPI JSON
app.get("/docs/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// Swagger UI
app.use(
    "/docs",
    swaggerUiExpress.serve,
    swaggerUiExpress.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "WE-EMS API Docs",
        swaggerOptions: {
            docExpansion: "none",
            filter: true,
            showRequestDuration: true,
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
    })
);
// ====================

// Auth 라우트 연결
app.use("/auth", authRoutes);

// 기존 카카오 로그인 라우트 (호환성을 위해 유지)
app.get("/oauth2/login/kakao", (req, res) => {
    res.redirect("/auth/kakao");
});

app.get("/oauth2/callback/kakao", (req, res) => {
    res.redirect("/auth/oauth2/callback/kakao");
});

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags:
 *       - General
 *     summary: 대시보드 페이지
 *     description: 로그인한 사용자의 대시보드 페이지입니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 정보
 *       302:
 *         description: 미인증 시 로그인 페이지로 리다이렉트
 */
app.get("/dashboard", (req, res) => {
    if (!req.user) {
        return res.redirect("/auth/kakao");
    }

    res.success({
        message: "대시보드에 오신 것을 환영합니다!",
        user: {
            id: req.user.id,
            nickname: req.user.nickname,
            email: req.user.email,
        },
    });
});

// 임시 OAuth 성공 페이지 (프론트엔드가 없을 때 테스트용)
app.get("/oauth-success", (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            resultType: "FAIL",
            error: { errorCode: "NO_TOKEN", reason: "토큰이 없습니다.", data: null },
            success: null
        });
    }

    res.send(`
        <html>
            <head>
                <title>로그인 성공</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                    .token { background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; margin: 10px 0; }
                    .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1 class="success">✅ 카카오 로그인 성공!</h1>
                <p>JWT 토큰이 발급되었습니다:</p>
                <p>(테스트 진행시 아래 토큰을 복사 및 인증 후에 사용하세요)</p>
                <div class="token">${token}</div>
                <p><a href="/auth/me">내 정보 확인하기 (Authorization 헤더 필요)</a></p>
                <p><a href="/docs">메인 페이지로</a></p>
                
                <script>
                    // 토큰을 로컬스토리지에 저장 (테스트용)
                    localStorage.setItem('accessToken', '${token}');
                    console.log('Token saved to localStorage:', '${token}');
                </script>
            </body>
        </html>
    `);
});

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: 메인 페이지
 *     description: 애플리케이션의 메인 페이지입니다. 로그인 상태에 따라 다른 정보를 제공합니다.
 *     security: []   # 공개로 유지(전역 보안 오버라이드)
 *     responses:
 *       200:
 *         description: 메인 페이지 정보
 */
app.get("/", (req, res) => {
    console.log("Current user:", req.user?.nickname || "Guest");

    if (req.user) {
        res.success({
            message: "Hello World! 로그인된 사용자입니다!",
            user: {
                id: req.user.id,
                nickname: req.user.nickname,
                email: req.user.email,
                kakaoId: req.user.kakaoId,
                tokenBalance: req.user.tokenBalance,
                imageUrl: req.user.imageUrl,
            },
        });
    } else {
        res.success({
            message: "Hello World! 로그인하지 않은 사용자입니다.",
            loginUrl: "/auth/kakao",
        });
    }
});

// 전역 오류 처리
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    const reason = err.reason || err.message || "서버에서 오류가 발생했습니다.";
    const data = err.data || null;

    console.error("Global error handler:", err);

    return res.status(statusCode).json({
        resultType: "FAIL",
        error: { errorCode, reason, data },
        success: null,
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({
        resultType: "FAIL",
        error: { errorCode: "NOT_FOUND", reason: "요청한 리소스를 찾을 수 없습니다.", data: null },
        success: null,
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    if (!jwtSecret) {
        console.log("⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env file for production!");
    }
    console.log("🚀 Server started successfully with JWT authentication");
});