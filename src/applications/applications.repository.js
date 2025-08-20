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
}

export const applicationsRepository = new ApplicationsRepository();
