import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUiExpress from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swaggerSpec.js";
import { scheduleCloseExpiredHelps } from "./jobs/close-expired-helps.job.js";

// 이미지 업로드
import { imageUploader } from "./middleware/image.uploader.js";
import { createUUID } from "./middleware/uuid.js";

dotenv.config();

// Auth 모듈 임포트
import { authRoutes } from "./auth/auth.route.js";
import { injectUser } from "./auth/auth.middleware.js";

// 라우트 연결
import { usersRoutes } from "./users/users.route.js";
import { helpsRoutes } from "./helps/helps.route.js";
import { reviewsRoutes } from "./reviews/reviews.route.js";

// 에러 미들웨어
import { multerErrorHandler, errorHandler, notFoundHandler } from "./middleware/error.js";

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
            docExpansion: "list",
            filter: true,
            showRequestDuration: true,
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
    })
);

// 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/helps", helpsRoutes);
app.use("/api/reviews", reviewsRoutes);

// 기존 카카오 로그인 라우트 (호환성을 위해 유지)
app.get("/oauth2/login/kakao", (req, res) => {
    res.redirect("/api/auth/kakao");
});
app.get("/oauth2/callback/kakao", (req, res) => {
    res.redirect("/api/auth/oauth2/callback/kakao");
});

/**
 * @swagger
 * /:
 *   post:
 *     tags:
 *       - General
 *     summary: 이미지 업로드 테스트
 *     description: 이미지 파일을 업로드하는 테스트 엔드포인트입니다.
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
 *                 description: 업로드할 이미지 파일
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: 이미지 업로드 성공
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
 *                       example: "이미지 업로드 테스트 완료"
 *                     uploadId:
 *                       type: string
 *                       example: "4eeb5f5306fca7ec8a1418ec5dc62a40"
 *       400:
 *         description: 파일 업로드 실패
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
 *                       example: FILE_UPLOAD_ERROR
 *                     reason:
 *                       type: string
 *                       example: "지원하지 않는 파일 확장자입니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       413:
 *         description: 파일 크기 초과
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
 *                       example: FILE_TOO_LARGE
 *                     reason:
 *                       type: string
 *                       example: "파일 크기가 5MB를 초과합니다."
 *                     data:
 *                       type: object
 *                       nullable: true
 *                 success:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */
app.post("/", imageUploader.single('image'), (req, res, next) => {
    try {
        if (!req.file) {
            return res.error({
                errorCode: "NO_FILE",
                reason: "업로드할 파일이 없습니다.",
                statusCode: 400
            });
        }

        // UUID 생성해서 응답에 포함 (업로드 추적용)
        const uploadId = createUUID();

        // 업로드 성공 로그 (최소 정보만)
        console.log(`[Upload Success] ID: ${uploadId}`);

        res.success({
            message: "이미지 업로드 테스트 완료",
            uploadId: uploadId
        });
    } catch (error) {
        next(error);
    }
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
    if (req.user) {
        res.success({
            message: "Hello World! 로그인된 사용자입니다!",
            user: {
                nickname: req.user.nickname,
                email: req.user.email,
            },
        });
    } else {
        res.success({
            message: "Hello World! 로그인하지 않은 사용자입니다.",
            loginUrl: "/api/auth/kakao",
        });
    }
});

app.use(notFoundHandler);       // 404
app.use(multerErrorHandler);    // multer
app.use(errorHandler);          // 전역 오류 처리

// 배치 스케줄러
scheduleCloseExpiredHelps();

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    if (!jwtSecret) {
        console.log("⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env file for production!");
    }
    console.log("🚀 Server started successfully with JWT authentication");
});