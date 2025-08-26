export const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WE-EMS API',
            version: '1.0.0',
            description: '프로젝트 파파이팅.',
            contact: { name: 'API Support', email: 'support@example.com' }
        },
        // 🔹 Swagger 서버 목록 (로컬 + EIP)
        servers: [
            { url: 'http://localhost:3000', description: '개발 서버' },
            { url: 'https://www.jogakdolbom.site/', description: '라이브 서버' }
        ],
        components: {
            securitySchemes: {
                // 🔹 Bearer 전용 (쿠키 인증 제거)
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Authorization 헤더에 Bearer 토큰을 포함하여 인증합니다.'
                }
            },
            // 🔹 공통 스키마(컨트롤러 JSDoc에서 참조)
            schemas: {
                AuthResponseDto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: '사용자 고유 ID' },
                        kakaoId: { type: 'string', example: '1234567890', description: '카카오 사용자 ID' },
                        nickname: { type: 'string', example: '홍길동', description: '사용자 닉네임' },
                        email: { type: 'string', format: 'email', example: 'user@example.com', description: '사용자 이메일' },
                        imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/profile.jpg', nullable: true, description: '프로필 이미지 URL' },
                        imageKey: { type: 'string', example: 'profile/abc123.jpg', nullable: true, description: '이미지 스토리지 키' },
                        birth: { type: 'string', format: 'date', example: '1990-01-01', nullable: true, description: '생년월일' },
                        phone: { type: 'string', example: '010-1234-5678', nullable: true, description: '전화번호' },
                        region: { type: 'string', example: '서울', nullable: true, description: '지역' },
                        tokenBalance: { type: 'integer', example: 1000, description: '토큰 잔액' },
                        createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z', description: '계정 생성일' },
                        updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z', description: '마지막 업데이트일' }
                    },
                    required: ['id', 'kakaoId', 'nickname', 'email', 'tokenBalance', 'createdAt', 'updatedAt']
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        resultType: { type: 'string', enum: ['SUCCESS'], example: 'SUCCESS' },
                        error: { type: 'null', example: null },
                        success: { type: 'object', description: '성공 시 반환되는 데이터' }
                    },
                    required: ['resultType', 'error', 'success']
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        resultType: { type: 'string', enum: ['FAIL'], example: 'FAIL' },
                        error: {
                            type: 'object',
                            properties: {
                                errorCode: { type: 'string', example: 'UNAUTHORIZED' },
                                reason: { type: 'string', example: '인증이 필요합니다.' },
                                data: { type: 'object', nullable: true, example: null }
                            },
                            required: ['errorCode', 'reason']
                        },
                        success: { type: 'null', example: null }
                    },
                    required: ['resultType', 'error', 'success']
                }
            }
        },
        // 🔹 기본 보안: 전역으로 Bearer 필요(공개 엔드포인트는 각 엔드포인트에서 security: []로 오버라이드)
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Authentication', description: '사용자 인증 관련 API' }
        ]
    },
    // 🔹 JSDoc 스캔 경로 (현재 index.js가 있는 경로 기준)
    apis: [
        './src/auth/*.js',
        './src/users/*.js',
        './src/helps/*.js',
        './src/applications/*.js',
        './src/reviews/*.js',
        './src/store/*.js',
        './src/index.js'
    ]
};