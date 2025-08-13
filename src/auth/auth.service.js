import jwt from "jsonwebtoken";
import { prisma } from "../db.config.js";

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'development-jwt-secret-change-this';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    }

    // JWT 토큰 생성
    generateTokens(user) {
        const payload = {
            id: user.id,
            email: user.email,
            kakaoId: user.kakaoId
        };

        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn
        });

        return { accessToken };
    }

    // JWT 토큰 검증
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // 카카오 로그인 처리
    async handleKakaoLogin(profile) {
        try {
            const email = profile._json.kakao_account?.email;
            const kakaoId = profile.id.toString();
            const nickname = profile.displayName || profile._json.kakao_account?.profile?.nickname || "카카오유저";
            const imageUrl = profile._json.kakao_account?.profile?.profile_image_url || null;

            if (!email) {
                throw new Error("Kakao: Email not found");
            }

            const user = await this.findOrCreateUser({
                kakaoId,
                nickname,
                email,
                imageUrl
            });

            return this.generateTokens(user);
        } catch (error) {
            throw error;
        }
    }

    async findOrCreateUser({ kakaoId, nickname, email, imageUrl }) {
        // 먼저 kakaoId로 찾기
        let user = await prisma.user.findUnique({ where: { kakaoId } });

        if (!user) {
            // kakaoId로 없으면 email로 찾기 (기존 계정이 있을 수 있음)
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                // 기존 계정에 kakaoId와 imageUrl 업데이트
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        kakaoId,
                        ...(imageUrl && { imageUrl })
                    }
                });
            } else {
                // 새 계정 생성
                user = await prisma.user.create({
                    data: {
                        kakaoId,
                        nickname,
                        email,
                        ...(imageUrl && { imageUrl })
                    },
                });
            }
        }

        return user;
    }

    // 토큰으로 사용자 정보 조회
    async getUserFromToken(token) {
        try {
            const decoded = this.verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            throw error;
        }
    }
}

export const authService = new AuthService();