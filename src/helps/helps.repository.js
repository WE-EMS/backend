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

    // 내가 작성한 돌봄요청 조회 (신청자 및 배정 정보 포함)
    async findMyHelpRequests({ skip, take, where, orderBy }) {
        const [items, total] = await Promise.all([
            prisma.helpRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    applications: {
                        include: {
                            helper: {
                                select: {
                                    id: true,
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
                                    _count: {
                                        select: { reviewsReceived: true }
                                    },
                                    reviewsReceived: {
                                        select: { rating: true }
                                    }
                                }
                            },
                            application: {
                                select: { message: true }
                            }
                        }
                    }
                },
            }),
            prisma.helpRequest.count({ where }),
        ]);

        return { items, total };
    }

    // 내가 요청하거나 참여한 완료된 돌봄 목록 조회
    async findMyCompleteHelps({ userId, skip, take, orderBy }) {
        // 먼저 전체 개수를 구하기 위해 카운트 쿼리
        const [requestedCount, participatedCount] = await Promise.all([
            prisma.helpRequest.count({
                where: {
                    requesterId: userId,
                    // 완료(2) + 모집종료(4) 포함
                    status: { in: [2, 4] }
                }
            }),
            prisma.helpAssignment.count({
                where: {
                    helperId: userId,
                    helpRequest: {
                        // 완료(2) + 모집종료(4) 포함
                        status: { in: [2, 4] }
                    }
                }
            })
        ]);

        const total = requestedCount + participatedCount;

        // 두 개의 쿼리를 Union으로 합치기
        const [requestedHelps, participatedHelps] = await Promise.all([
            // 내가 요청한 완료/모집종료 돌봄
            prisma.helpRequest.findMany({
                where: {
                    requesterId: userId,
                    // 완료(2) + 모집종료(4) 포함
                    status: { in: [2, 4] }
                },
                select: {
                    id: true,
                    helpType: true,
                    serviceDate: true,
                    startTime: true,
                    endTime: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            // 내가 참여한 완료/모집종료 돌봄 (HelpAssignment를 통해)
            prisma.helpAssignment.findMany({
                where: {
                    helperId: userId,
                    helpRequest: {
                        // 완료(2) + 모집종료(4) 포함
                        status: { in: [2, 4] }
                    }
                },
                include: {
                    helpRequest: {
                        select: {
                            id: true,
                            helpType: true,
                            serviceDate: true,
                            startTime: true,
                            endTime: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    }
                }
            })
        ]);

        // 데이터 통합 및 역할 타입 추가
        const allHelps = [
            ...requestedHelps.map(help => ({ ...help, roleType: "요청" })),
            ...participatedHelps.map(assignment => ({
                ...assignment.helpRequest,
                roleType: "참여"
            }))
        ];

        // 서비스 날짜 기준 내림차순 정렬
        allHelps.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

        // 페이지네이션 적용
        const items = allHelps.slice(skip, skip + take);

        return { items, total };
    }

    // 매칭 안된 글 && 날짜 지난 글을 모집종료(4)로 일괄 갱신
    async closeExpiredHelps(cutoffUtcDate) {
        return await prisma.helpRequest.updateMany({
            where: {
                status: 0,                         // 아직 요청 상태
                serviceDate: { lt: cutoffUtcDate } // 오늘 이전 날짜
            },
            data: { status: 4, updatedAt: new Date() }
        });
    }

    // 과거 날짜 → 모집종료(4) 처리
    async closeExpiredByPastDate(todayStartUtc) {
        return prisma.helpRequest.updateMany({
            where: { status: 0, serviceDate: { lt: todayStartUtc } },
            data: { status: 4, updatedAt: new Date() },
        });
    }

    // (B) 오늘 + 시작시간 경과 → 모집종료(4) 처리
    async closeExpiredByStartTimeToday({ todayStartUtc, tomorrowStartUtc, nowUtcTime }) {
        // KST 기준 현재 시:분을 추출해, 임계 UTC time-only(1970-01-01) 계산
        const now = new Date(); // UTC
        const kstHour = (now.getUTCHours() + 9) % 24;   // 현재 KST 시
        const kstMin = now.getUTCMinutes();

        // KST 00:00에 해당하는 UTC time-only = 1970-01-01T15:00:00Z
        const KST_MID_UTC = new Date(Date.UTC(1970, 0, 1, 15, 0, 0, 0));
        // (nowKst - 9h)을 time-only로 표현한 임계치
        const thresholdUtc = new Date(Date.UTC(
            1970, 0, 1,
            nowUtcTime.getUTCHours(), nowUtcTime.getUTCMinutes(), nowUtcTime.getUTCSeconds()
        ));

        // 기본 where: 오늘(KST) + 아직 요청 상태
        const base = {
            status: 0,
            serviceDate: { gte: todayStartUtc, lt: tomorrowStartUtc }
        };

        if (kstHour >= 9) {
            // 구간 2개: [15:00, 24:00) ∪ [00:00, threshold]
            return prisma.helpRequest.updateMany({
                where: {
                    ...base,
                    OR: [
                        { startTime: { gte: KST_MID_UTC } },
                        { startTime: { lte: thresholdUtc } }
                    ]
                },
                data: { status: 4, updatedAt: new Date() }
            });
        } else {
            // 구간 1개: [15:00, threshold]
            return prisma.helpRequest.updateMany({
                where: {
                    ...base,
                    startTime: { gte: KST_MID_UTC, lte: thresholdUtc }
                },
                data: { status: 4, updatedAt: new Date() }
            });
        }
    }

    /*    async debugCheckRow(helpId, { todayStartUtc, tomorrowStartUtc, nowUtcTime }) {
            const row = await prisma.helpRequest.findUnique({
                where: { id: helpId },
                select: { id: true, status: true, serviceDate: true, startTime: true },
            });
    
            const inToday =
                row.serviceDate >= todayStartUtc && row.serviceDate < tomorrowStartUtc;
            const started = row.startTime <= nowUtcTime;
    
            console.log("[debugCheckRow]", {
                id: row.id,
                status: row.status,
                serviceDate: row.serviceDate.toISOString(),
                startTime: row.startTime.toISOString(),
                inToday, started,
                willUpdate: row.status === 0 && inToday && started,
            });
        } */
}

export const helpsRepository = new HelpsRepository();