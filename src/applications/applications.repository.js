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

    // 단일 지원 조회
    async findApplicationById(applicationId) {
        return prisma.helpApplication.findUnique({
            where: { id: parseInt(applicationId) },
            select: {
                id: true,
                helpRequestId: true,
                userId: true,
                status: true,
            },
        });
    }

    // 해당 요청글의 배정 여부
    async findAssignmentByHelp(helpRequestId) {
        return prisma.helpAssignment.findUnique({
            where: { helpRequestId: parseInt(helpRequestId) },
            select: {
                id: true,
                helpRequestId: true,
                helpApplicationId: true,
                helperId: true,
                createdAt: true,
            },
        });
    }

    // 수락 트랜잭션
    async acceptApplicationTransaction({ helpRequestId, applicationId, helperId }) {
        const helpId = parseInt(helpRequestId);
        const appId = parseInt(applicationId);
        const helper = parseInt(helperId);

        const [updatedApp, _, assignment, updatedHelp] = await prisma.$transaction([
            // 대상 지원 수락(1)
            prisma.helpApplication.update({
                where: { id: appId },
                data: { status: 1 },
                select: { id: true, status: true },
            }),
            // 같은 글의 다른 지원자들은 거절(2)
            prisma.helpApplication.updateMany({
                where: {
                    helpRequestId: helpId,
                    id: { not: appId },
                    status: 0, // 대기만 일괄 거절
                },
                data: { status: 2 },
            }),
            // 배정 생성 (요청당 1명 보장: @unique)
            prisma.helpAssignment.create({
                data: {
                    helpRequestId: helpId,
                    helpApplicationId: appId,
                    helperId: helper,
                },
                select: { id: true },
            }),
            // 요청글 상태 배정(1)
            prisma.helpRequest.update({
                where: { id: helpId },
                data: { status: 1 },
                select: { id: true, status: true },
            }),
        ]);

        return { updatedApp, assignment, updatedHelp };
    }

    // 거절 처리
    async rejectApplication({ helpRequestId, applicationId }) {
        const helpId = parseInt(helpRequestId);
        const appId = parseInt(applicationId);

        return prisma.helpApplication.update({
            where: { id: appId },
            data: { status: 2 },
            select: { id: true, status: true },
        });
    }

    // 수락된 지원을 철회(3)로 변경
    async withdrawAcceptedApplication(applicationId) {
        return prisma.helpApplication.update({
            where: { id: parseInt(applicationId) },
            data: { status: 3 }, // 철회
            select: { id: true, status: true },
        });
    }
}

export const applicationsRepository = new ApplicationsRepository();
