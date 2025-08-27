import { prisma } from '../db.config.js';

export const reviewRepository = {
    findHelpWithAssignment(helpId) {
        return prisma.helpRequest.findUnique({
            where: { id: helpId },
            include: { assignment: true, reviews: true },
        });
    },

    findAssignmentWithHelp(assignmentId) {
        return prisma.helpAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                helpRequest: true, // { id, requesterId, serviceDate, endTime, status, ... }
            },
        });
    },

    findReviewByHelpAndReviewer(helpId, reviewerId) {
        return prisma.review.findUnique({
            where: { helpId_reviewerId: { helpId, reviewerId } },
        });
    },

    createReview(data) {
        return prisma.review.create({ data });
    },

    updateHelpStatus(helpId, status) {
        return prisma.helpRequest.update({ where: { id: helpId }, data: { status } });
    },

    async findOverdueHelpsWithoutReviews({ days, finishedStatus }) {
        const candidates = await prisma.helpRequest.findMany({
            where: { status: { not: finishedStatus } },
            select: {
                id: true, serviceDate: true, endTime: true,
                reviews: { select: { id: true }, take: 1 },
            },
        });

        const now = new Date();
        const ms = days * 24 * 60 * 60 * 1000;

        return candidates.filter(h => {
            const d = new Date(h.serviceDate);
            const t = new Date(h.endTime);
            const endAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), t.getSeconds());
            return h.reviews.length === 0 && now > new Date(endAt.getTime() + ms);
        });
    },

    async bulkUpdateHelpsStatus(helpIds, status) {
        if (!helpIds.length) return 0;
        const r = await prisma.helpRequest.updateMany({ where: { id: { in: helpIds } }, data: { status } });
        return r.count ?? 0;
    },

    // 내가 리뷰를 쓸 수 있는 후보(요청자이거나, assignment의 helper인 경우)
    async findReviewableCandidatesByUser(userId) {
        return prisma.helpRequest.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { assignment: { is: { helperId: userId } } },
                ],
            },
            include: {
                requester: { select: { id: true, nickname: true } },
                assignment: {
                    include: {
                        helper: { select: { id: true, nickname: true } },
                    },
                },
                reviews: {
                    where: { reviewerId: userId }, // 내가 이미 쓴 리뷰만 체크
                    select: { id: true },
                    take: 1,
                },
            },
            orderBy: { serviceDate: 'desc' },
        });
    },

    async countWrittenByUser(userId) {
        return prisma.review.count({ where: { reviewerId: userId } });
    },

    // 내가 쓴 리뷰
    async findWrittenByUser(userId, { skip = 0, take = 10 } = {}) {
        return prisma.review.findMany({
            where: { reviewerId: userId },
            include: {
                reviewee: { select: { id: true, nickname: true } },
                helpRequest: { select: { id: true, helpType: true, requesterId: true, serviceDate: true, endTime: true } },
                HelpAssignment: { select: { helperId: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip, take,
        });
    },

    async countReceivedByUser(userId) {
        return prisma.review.count({ where: { revieweeId: userId } });
    },

    // 내가 받은 리뷰
    async findReceivedByUser(userId, { skip = 0, take = 10 } = {}) {
        return prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: { select: { id: true, nickname: true } },
                helpRequest: { select: { id: true, helpType: true, requesterId: true, serviceDate: true, endTime: true } },
                HelpAssignment: { select: { helperId: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip, take,
        });
    },
};