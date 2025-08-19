import { prisma } from "../db.config.js";

export class HelpsRepository {
    // 돌봄요청 생성
    async createHelpRequest(data, imageData = null) {
        const createData = { ...data };

        if (imageData) {
            createData.imageUrl = imageData.imageUrl;
            createData.imageKey = imageData.imageKey;
        }

        return await prisma.helpRequest.create({
            data: createData,
            include: {
                requester: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true,
                        kakaoProfileImageUrl: true
                    }
                }
            }
        });
    }

    // 특정 돌봄요청 조회
    async findHelpRequestById(id) {
        return await prisma.helpRequest.findUnique({
            where: { id: parseInt(id) },
            include: {
                requester: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true,
                        kakaoProfileImageUrl: true,
                        phone: true,
                        region: true,
                        _count: {
                            select: { reviewsReceived: true }
                        },
                        reviewsReceived: {
                            select: { rating: true }
                        }
                    }
                },
                applications: {
                    include: {
                        helper: {
                            select: {
                                id: true,
                                nickname: true,
                                imageUrl: true,
                                kakaoProfileImageUrl: true
                            }
                        }
                    }
                },
                assignment: {
                    include: {
                        helper: {
                            select: {
                                id: true,
                                nickname: true,
                                imageUrl: true,
                                kakaoProfileImageUrl: true,
                                phone: true
                            }
                        }
                    }
                }
            }
        });
    }

    // 돌봄요청 수정
    async updateHelpRequest(id, data, imageData = null) {
        const updateData = { ...data };

        if (imageData) {
            updateData.imageUrl = imageData.imageUrl;
            updateData.imageKey = imageData.imageKey;
        }

        return await prisma.helpRequest.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                requester: {
                    select: {
                        id: true,
                        nickname: true,
                        imageUrl: true,
                        kakaoProfileImageUrl: true
                    }
                }
            }
        });
    }

    // 하드 삭제 (연관 데이터 먼저 삭제)
    async hardDeleteHelpRequest(id) {
        const helpId = parseInt(id);
        return await prisma.$transaction(async (tx) => {
            // 1) 리뷰 삭제 (review.helpId / review.helpAssignmentId가 FK)
            await tx.review.deleteMany({ where: { helpId } });
            // 2) 배정 삭제 (helpAssignment.helpRequestId)
            await tx.helpAssignment.deleteMany({ where: { helpRequestId: helpId } });
            // 3) 지원 삭제 (helpApplication.helpRequestId)
            await tx.helpApplication.deleteMany({ where: { helpRequestId: helpId } });
            // 4) 본문 삭제 (helpRequest.id)
            await tx.helpRequest.delete({ where: { id: helpId } });
            return true;
        });
    }

    // 리스트 조회
    async findHelpRequests({ skip, take, where, orderBy }) {
        const [items, total] = await Promise.all([
            prisma.helpRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    requester: {
                        select: {
                            id: true,
                            nickname: true,
                            imageUrl: true,
                            kakaoProfileImageUrl: true,
                            _count: { select: { reviewsReceived: true } },
                            reviewsReceived: { select: { rating: true } },
                        },
                    },
                },
            }),
            prisma.helpRequest.count({ where }),
        ]);

        return { items, total };
    }
}

export const helpsRepository = new HelpsRepository();