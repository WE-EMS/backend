import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";

// dotenv를 가장 먼저 로드
dotenv.config();

import { prisma } from "./db.config.js";

// Auth 모듈 임포트
import { authRoutes } from "./auth/auth.route.js";
import { injectUser } from "./auth/auth.middleware.js";

const app = express();
const port = process.env.PORT || 3000;

// 환경변수 검증
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('WARNING: JWT_SECRET is not set in environment variables');
    console.error('Using a default secret for development. DO NOT use this in production!');
}

// 기본 미들웨어 설정
app.use(cors({
    origin: true, // 개발환경에서는 모든 origin 허용
    credentials: true // 쿠키를 포함한 요청 허용
}));
app.use(express.static("public")); // 정적 파일 접근
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: false })); // URL 인코딩 파싱
app.use(cookieParser()); // 쿠키 파싱

// 사용자 정보 주입 미들웨어
app.use(injectUser);

// 공통 응답을 사용할 수 있는 헬퍼 함수
app.use((req, res, next) => {
    res.success = (success) => {
        return res.json({ resultType: "SUCCESS", error: null, success });
    };

    res.error = ({ errorCode = "unknown", reason = null, data = null, statusCode = 400 }) => {
        return res.status(statusCode).json({
            resultType: "FAIL",
            error: { errorCode, reason, data },
            success: null,
        });
    };

    next();
});

// Swagger 설정 - swagger-jsdoc 사용
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WE-EMS API',
            version: '1.0.0',
            description: '프로젝트 파파이팅.',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '개발 서버'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Authorization 헤더에 Bearer 토큰을 포함하여 인증합니다.'
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                    description: '쿠키에 저장된 JWT 토큰으로 인증합니다.'
                }
            },
            schemas: {
                AuthResponseDto: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1,
                            description: '사용자 고유 ID'
                        },
                        kakaoId: {
                            type: 'string',
                            example: '1234567890',
                            description: '카카오 사용자 ID'
                        },
                        nickname: {
                            type: 'string',
                            example: '홍길동',
                            description: '사용자 닉네임'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com',
                            description: '사용자 이메일'
                        },
                        imageUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/profile.jpg',
                            nullable: true,
                            description: '프로필 이미지 URL'
                        },
                        imageKey: {
                            type: 'string',
                            example: 'profile/abc123.jpg',
                            nullable: true,
                            description: '이미지 스토리지 키'
                        },
                        birth: {
                            type: 'string',
                            format: 'date',
                            example: '1990-01-01',
                            nullable: true,
                            description: '생년월일'
                        },
                        phone: {
                            type: 'string',
                            example: '010-1234-5678',
                            nullable: true,
                            description: '전화번호'
                        },
                        region: {
                            type: 'string',
                            example: '서울',
                            nullable: true,
                            description: '지역'
                        },
                        tokenBalance: {
                            type: 'integer',
                            example: 1000,
                            description: '토큰 잔액'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-01-01T00:00:00.000Z',
                            description: '계정 생성일'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-01-01T00:00:00.000Z',
                            description: '마지막 업데이트일'
                        }
                    },
                    required: ['id', 'kakaoId', 'nickname', 'email', 'tokenBalance', 'createdAt', 'updatedAt']
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        resultType: {
                            type: 'string',
                            enum: ['SUCCESS'],
                            example: 'SUCCESS'
                        },
                        error: {
                            type: 'null',
                            example: null
                        },
                        success: {
                            type: 'object',
                            description: '성공 시 반환되는 데이터'
                        }
                    },
                    required: ['resultType', 'error', 'success']
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        resultType: {
                            type: 'string',
                            enum: ['FAIL'],
                            example: 'FAIL'
                        },
                        error: {
                            type: 'object',
                            properties: {
                                errorCode: {
                                    type: 'string',
                                    example: 'UNAUTHORIZED'
                                },
                                reason: {
                                    type: 'string',
                                    example: '인증이 필요합니다.'
                                },
                                data: {
                                    type: 'object',
                                    nullable: true,
                                    example: null
                                }
                            },
                            required: ['errorCode', 'reason']
                        },
                        success: {
                            type: 'null',
                            example: null
                        }
                    },
                    required: ['resultType', 'error', 'success']
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: '사용자 인증 관련 API'
            }
        ]
    },
    apis: [
        './src/auth/*.js',  // auth 폴더의 모든 JS 파일에서 JSDoc 주석 읽기
        './src/users/*.js', // users 폴더
        './src/helps/*.js', // helps 폴더
        './src/store/*.js', // store 폴더
        './src/index.js'    // 메인 파일
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// OpenAPI JSON 엔드포인트
app.get('/docs/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Swagger UI 설정 - /docs 경로로 변경
app.use('/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WE-EMS API Docs',
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2
    }
}));

// Auth 라우트 연결
app.use('/auth', authRoutes);

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
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 정보
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
 *                       example: "대시보드에 오신 것을 환영합니다!"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nickname:
 *                           type: string
 *                           example: "홍길동"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
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
            email: req.user.email
        }
    });
});

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - General
 *     summary: 메인 페이지
 *     description: 애플리케이션의 메인 페이지입니다. 로그인 상태에 따라 다른 정보를 제공합니다.
 *     responses:
 *       200:
 *         description: 메인 페이지 정보
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
 *                   oneOf:
 *                     - properties:
 *                         message:
 *                           type: string
 *                           example: "Hello World! 로그인된 사용자입니다."
 *                         user:
 *                           $ref: '#/components/schemas/AuthResponseDto'
 *                     - properties:
 *                         message:
 *                           type: string
 *                           example: "Hello World! 로그인하지 않은 사용자입니다."
 *                         loginUrl:
 *                           type: string
 *                           example: "/auth/kakao"
 */
app.get("/", (req, res) => {
    console.log('Current user:', req.user?.nickname || 'Guest');

    if (req.user) {
        res.success({
            message: "Hello World! 로그인된 사용자입니다.",
            user: {
                id: req.user.id,
                nickname: req.user.nickname,
                email: req.user.email,
                kakaoId: req.user.kakaoId,
                tokenBalance: req.user.tokenBalance,
                imageUrl: req.user.imageUrl
            }
        });
    } else {
        res.success({
            message: "Hello World! 로그인하지 않은 사용자입니다.",
            loginUrl: "/auth/kakao"
        });
    }
});

// 전역 오류를 처리하기 위한 미들웨어
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
    const reason = err.reason || err.message || "서버에서 오류가 발생했습니다.";
    const data = err.data || null;

    console.error('Global error handler:', err);

    return res.status(statusCode).json({
        resultType: "FAIL",
        error: {
            errorCode,
            reason,
            data
        },
        success: null,
    });
});

// 404 처리를 위한 미들웨어
app.use((req, res) => {
    res.status(404).json({
        resultType: "FAIL",
        error: {
            errorCode: "NOT_FOUND",
            reason: "요청한 리소스를 찾을 수 없습니다.",
            data: null
        },
        success: null,
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API Documentation: http://localhost:${port}/docs`);
    if (!jwtSecret) {
        console.log('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in .env file for production!');
    }
    console.log('🚀 Server started successfully with JWT authentication');
});