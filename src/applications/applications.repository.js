import { prisma } from "../db.config.js";

export class ApplicationsRepository {
    async findHelpRequestById(helpRequestId) {
        return prisma.helpRequest.findUnique({
            where: { id: parseInt(helpRequestId) },
            select: {
                id: true,
                requesterId: true,
                status: true,
            },
        });
    }

    // apply-list용: 요약 정보 (helpType, status 포함)
    async findHelpRequestSummary(helpRequestId) {
        return prisma.helpRequest.findUnique({
            where: { id: parseInt(helpRequestId) },
            select: {
                id: true,
                requesterId: true,
                helpType: true,
                status: true,
            },
        });
    }

    async findExistingApplication(helpRequestId, userId) {
        return prisma.helpApplication.findUnique({
            where: {
                helpRequestId_userId: {
                    helpRequestId: parseInt(helpRequestId),
                    userId: parseInt(userId),
                },
            },
        });
    }

    async createApplication(helpRequestId, userId, message) {
        return prisma.helpApplication.create({
            data: {
                helpRequestId: parseInt(helpRequestId),
                userId: parseInt(userId),
                status: 0, // 대기
                message: message || null,
            },
            include: {
                helper: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true,
                        kakaoProfileImageUrl: true,
                    },
                },
            },
        });
    }

    // 지원 목록 + helper 기본정보
    async listApplicationsByHelp(helpRequestId) {
        return prisma.helpApplication.findMany({
            where: { helpRequestId: parseInt(helpRequestId) },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                userId: true,
                status: true,
                message: true,
                createdAt: true,
                helper: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true,
                        kakaoProfileImageUrl: true,
                    },
                },
            },
        });
    }

    // 여러 사용자 리뷰 통계 (count, avg rating)
    async getReviewStatsByUsers(userIds) {
        if (!userIds || userIds.length === 0) return [];
        return prisma.review.groupBy({
            by: ["revieweeId"],
            where: { revieweeId: { in: userIds } },
            _count: { id: true },
            _avg: { rating: true },
        });
    }
}

export const applicationsRepository = new ApplicationsRepository();
