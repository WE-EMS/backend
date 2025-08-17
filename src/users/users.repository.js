import { prisma } from '../db.config.js';

class UsersRepository {
    async findById(userId) {
        return await prisma.user.findUnique({
            where: { id: userId }
        });
    }

    async findByIdWithReviewStats(userId) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        reviewsReceived: true
                    }
                },
                reviewsReceived: {
                    select: {
                        rating: true
                    }
                }
            }
        });
    }

    async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email }
        });
    }

    async findByKakaoId(kakaoId) {
        return await prisma.user.findUnique({
            where: { kakaoId }
        });
    }

    async create(userData) {
        return await prisma.user.create({
            data: userData
        });
    }

    async update(userId, updateData) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        });
    }

    async delete(userId) {
        return await prisma.user.delete({
            where: { id: userId }
        });
    }

    async getRecentReviews(userId, limit = 5) {
        return await prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true
                    }
                },
                helpRequest: {
                    select: {
                        id: true,
                        helpType: true,
                        content: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }

    async getUserStats(userId) {
        const [reviewStats, requestStats, applicationStats] = await Promise.all([
            // 받은 리뷰 통계
            prisma.review.aggregate({
                where: { revieweeId: userId },
                _count: true,
                _avg: { rating: true }
            }),
            // 요청한 도움 통계
            prisma.helpRequest.count({
                where: { requesterId: userId }
            }),
            // 지원한 도움 통계
            prisma.helpApplication.count({
                where: { userId }
            })
        ]);

        return {
            reviewCount: reviewStats._count,
            avgRating: reviewStats._avg.rating || 0,
            requestCount: requestStats,
            applicationCount: applicationStats
        };
    }
}

export const usersRepository = new UsersRepository();