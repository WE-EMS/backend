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

    // 카카오 로그인 처리 - 토큰과 사용자 정보 모두 반환
    async handleKakaoLogin(profile) {
        try {
            const email = profile._json.kakao_account?.email;
            const kakaoId = profile.id.toString();
            const nickname = profile.displayName || profile._json.kakao_account?.profile?.nickname || "카카오유저";
            const kakaoProfileImageUrl = profile._json.kakao_account?.profile?.profile_image_url || null;

            if (!email) {
                throw new Error("Kakao: Email not found");
            }

            const user = await this.findOrCreateUser({
                kakaoId,
                nickname,
                email,
                kakaoProfileImageUrl
            });

            const tokens = this.generateTokens(user);

            // 토큰과 사용자 정보 모두 반환
            return { tokens, user };
        } catch (error) {
            throw error;
        }
    }

    async findOrCreateUser({ kakaoId, nickname, email, kakaoProfileImageUrl }) {
        // 먼저 kakaoId로 찾기
        let user = await prisma.user.findUnique({ where: { kakaoId } });

        if (!user) {
            // kakaoId로 없으면 email로 찾기 (기존 계정이 있을 수 있음)
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                // 기존 계정에 kakaoId와 카카오 프로필 이미지 URL 업데이트
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        kakaoId,
                        kakaoProfileImageUrl
                    }
                });
            } else {
                // 새 계정 생성
                user = await prisma.user.create({
                    data: {
                        kakaoId,
                        nickname,
                        email,
                        kakaoProfileImageUrl,
                        imageUrl: null, // 커스텀 이미지는 null로 시작
                        imageKey: null  // 커스텀 이미지 키도 null로 시작
                    },
                });
            }
        } else {
            // 기존 카카오 사용자의 경우 카카오 프로필 이미지 URL만 업데이트
            // (커스텀 이미지가 없는 경우에만)
            if (!user.imageUrl) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        kakaoProfileImageUrl
                    }
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

    // 사용자 프로필 이미지 URL 반환 (우선순위: 커스텀 > 카카오)
    getUserProfileImageUrl(user) {
        return user.imageUrl || user.kakaoProfileImageUrl;
    }
}

export const authService = new AuthService();