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
};