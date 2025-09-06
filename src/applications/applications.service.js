import { applicationsRepository } from "./applications.repository.js";
import { CreateApplicationRequestDto } from "./dto/applications.request.dto.js";
import { ApplicationResponseDto, ApplyListResponseDto, MyApplicationItemDto } from "./dto/applications.response.dto.js";

export class ApplicationsService {
    async applyToHelpRequest(helpId, helperId, body) {
        // 1) DTO & 검증
        const dto = new CreateApplicationRequestDto(body);
        const errors = dto.validate();
        if (errors.length > 0) {
            throw {
                errorCode: "VALIDATION_ERROR",
                reason: errors.join(", "),
                statusCode: 400,
            };
        }

        // 2) 글 존재/상태 확인
        const help = await applicationsRepository.findHelpRequestById(helpId);
        if (!help) {
            throw {
                errorCode: "NOT_FOUND",
                reason: "해당 돌봄요청을 찾을 수 없습니다.",
                statusCode: 404,
            };
        }
        if (help.status !== 0) {
            throw {
                errorCode: "INVALID_STATUS",
                reason: "요청 상태(0)인 글에만 지원할 수 있습니다.",
                statusCode: 400,
            };
        }

        // 2-1) 시작시간 지난 글 지원 차단
        const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        const kstToday = new Date(kstNow); kstToday.setHours(0, 0, 0, 0);

        // serviceDate는 '날짜만' 저장된 DateTime, startTime은 '시간만'(1970-01-01 기준) 저장됨
        // ① 과거 날짜면 무조건 막음
        const serviceDateKst = new Date(new Date(help.serviceDate).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        serviceDateKst.setHours(0, 0, 0, 0);
        if (serviceDateKst < kstToday) {
            throw { errorCode: "CLOSED", reason: "모집이 종료된 글입니다.(과거 날짜)", statusCode: 400 };
        }

        // ② 오늘 글이면, startTime 지난 경우 막음
        if (serviceDateKst.getTime() === kstToday.getTime()) {
            const startTime = new Date(help.startTime); // 1970-01-01THH:mm:ssZ 형태
            const startHour = startTime.getUTCHours();      // 시간만 추출
            const startMin = startTime.getUTCMinutes();

            // KST의 '오늘 날짜 + 시작 시간' 로컬 시각 생성
            const startAtKst = new Date(kstToday);
            startAtKst.setHours(startHour, startMin, 0, 0);

            if (kstNow >= startAtKst) {
                throw { errorCode: "CLOSED", reason: "모집이 종료된 글입니다.", statusCode: 400 };
            }
        }

        // 3) 본인 글 지원 방지
        if (help.requesterId === helperId) {
            throw {
                errorCode: "FORBIDDEN",
                reason: "본인이 작성한 요청글에는 지원할 수 없습니다.",
                statusCode: 403,
            };
        }

        // 4) 중복 지원 방지 (@@unique(helpRequestId, userId))
        const existing = await applicationsRepository.findExistingApplication(
            helpId,
            helperId
        );
        if (existing) {
            throw {
                errorCode: "DUPLICATE_APPLICATION",
                reason: "이미 해당 글에 지원했습니다.",
                statusCode: 409,
            };
        }

        // 5) 생성
        try {
            const app = await applicationsRepository.createApplication(
                helpId,
                helperId,
                dto.message
            );
            return new ApplicationResponseDto(app);
        } catch (e) {
            // Prisma 고유키 충돌 방어적 처리
            if (e?.code === "P2002") {
                throw {
                    errorCode: "DUPLICATE_APPLICATION",
                    reason: "이미 해당 글에 지원했습니다.",
                    statusCode: 409,
                };
            }
            console.error("Apply creation error:", e);
            throw {
                errorCode: "CREATE_ERROR",
                reason: "지원 접수 중 오류가 발생했습니다.",
                statusCode: 500,
            };
        }
    }

    // 지원자 목록 (페이지네이션)
    async getApplyList(helpId, requesterId, { page = 1, size = 10 } = {}) {
        // 1) 글 요약 조회 (작성자/상태/타입)
        const help = await applicationsRepository.findHelpRequestSummary(helpId);
        if (!help) {
            throw {
                errorCode: "NOT_FOUND",
                reason: "해당 돌봄요청을 찾을 수 없습니다.",
                statusCode: 404,
            };
        }
        // 2) 권한 체크: 글쓴이만 가능
        if (help.requesterId !== requesterId) {
            throw {
                errorCode: "FORBIDDEN",
                reason: "해당 요청글의 작성자만 조회할 수 있습니다.",
                statusCode: 403,
            };
        }

        // 3) 지원 목록 + 헬퍼 기본 정보 (페이지네이션)
        const skip = (page - 1) * size;
        const [applications, totalCount] = await Promise.all([
            applicationsRepository.listApplicationsByHelpWithPagination(helpId, { skip, take: size }),
            applicationsRepository.countApplicationsByHelp(helpId),
        ]);

        // 4) 리뷰 통계(리뷰 개수/평균 별점) — 여러 사용자 한번에 groupBy
        const helperIds = applications.map((a) => a.userId);
        let reviewStatsByUser = {};
        if (helperIds.length > 0) {
            const stats = await applicationsRepository.getReviewStatsByUsers(
                helperIds
            );
            reviewStatsByUser = stats.reduce((acc, s) => {
                acc[s.revieweeId] = {
                    reviewCount: s._count?.id ?? 0,
                    ratingAvg: s._avg?.rating ? Number(s._avg.rating.toFixed(2)) : 0,
                };
                return acc;
            }, {});
        }

        // 5) DTO 매핑 + 페이지네이션
        const totalPages = Math.max(1, Math.ceil(totalCount / size));
        return new ApplyListResponseDto(help, applications, reviewStatsByUser, { page, totalPages }, totalCount);
    }

    // 수락/거절
    async decideApplication(helpId, requesterId, body) {
        // 1) 입력 검증
        const applicationId = parseInt(body?.applicationId);
        const decision = (body?.decision || "").toString().trim().toLowerCase();

        if (!applicationId || !Number.isInteger(applicationId)) {
            throw { errorCode: "VALIDATION_ERROR", reason: "applicationId가 유효하지 않습니다.", statusCode: 400 };
        }
        if (!["accept", "reject"].includes(decision)) {
            throw { errorCode: "VALIDATION_ERROR", reason: "decision은 'accept' 또는 'reject' 이어야 합니다.", statusCode: 400 };
        }

        // 2) 글 조회 + 권한
        const help = await applicationsRepository.findHelpRequestById(helpId);
        if (!help) {
            throw { errorCode: "NOT_FOUND", reason: "해당 돌봄요청을 찾을 수 없습니다.", statusCode: 404 };
        }
        if (help.requesterId !== requesterId) {
            throw { errorCode: "FORBIDDEN", reason: "해당 요청글의 작성자만 처리할 수 있습니다.", statusCode: 403 };
        }

        // 3) 지원 신청 조회 (helpId에 속하는지 확인)
        const application = await applicationsRepository.findApplicationById(applicationId);
        if (!application || application.helpRequestId !== help.id) {
            throw { errorCode: "NOT_FOUND", reason: "해당 지원 신청을 찾을 수 없습니다.", statusCode: 404 };
        }

        // 4) 현재 배정 여부 확인
        const existingAssignment = await applicationsRepository.findAssignmentByHelp(help.id);

        if (decision === "accept") {
            // 요청글은 요청 상태(0)일 때만 수락 가능
            if (help.status !== 0) {
                throw { errorCode: "INVALID_STATUS", reason: "요청 상태(0)인 글만 수락할 수 있습니다.", statusCode: 400 };
            }
            // 이미 배정된 경우 중복 수락 불가
            if (existingAssignment) {
                throw { errorCode: "CONFLICT", reason: "이미 수락된 지원자가 있어 배정되었습니다.", statusCode: 409 };
            }

            // 트랜잭션: 해당 신청 수락(1), 다른 신청 모두 거절(2), 배정 생성, 글 상태 1로 변경
            const { updatedHelp, updatedApp } = await applicationsRepository.acceptApplicationTransaction({
                helpRequestId: help.id,
                applicationId: application.id,
                helperId: application.userId,
            });

            return {
                message: "지원이 수락되었습니다.",
                help: {
                    id: updatedHelp.id,
                    status: updatedHelp.status,
                    statusText: "배정",
                },
                application: {
                    id: updatedApp.id,
                    status: updatedApp.status,
                    statusText: "수락",
                },
            };
        }

        // decision === "reject"
        // 이미 배정된 지원자를 거절하려는 경우 방지
        if (existingAssignment?.helpApplicationId === application.id) {
            throw { errorCode: "INVALID_OPERATION", reason: "이미 배정된 지원자는 거절할 수 없습니다.", statusCode: 400 };
        }

        const rejected = await applicationsRepository.rejectApplication({
            helpRequestId: help.id,
            applicationId: application.id,
        });

        return {
            message: "지원이 거절되었습니다.",
            application: {
                id: rejected.id,
                status: rejected.status,
                statusText: "거절",
            },
        };
    }

    // 수락 철회: 수락된 지원만 status=3으로 변경, 나머지는 유지
    async kickAssignedHelper(helpId, requesterId) {
        // 1) 글 존재 & 권한 체크
        const help = await applicationsRepository.findHelpRequestById(helpId);
        if (!help) {
            throw { errorCode: "NOT_FOUND", reason: "해당 돌봄요청을 찾을 수 없습니다.", statusCode: 404 };
        }
        if (help.requesterId !== requesterId) {
            throw { errorCode: "FORBIDDEN", reason: "해당 요청글의 작성자만 처리할 수 있습니다.", statusCode: 403 };
        }

        // 2) 현재 배정 조회 (요청당 1명 보장)
        const assignment = await applicationsRepository.findAssignmentByHelp(help.id);
        if (!assignment) {
            throw { errorCode: "INVALID_OPERATION", reason: "현재 배정된 헬퍼가 없습니다.", statusCode: 409 };
        }

        // 3) 배정이 가리키는 지원 신청이 '수락(1)' 상태인지 확인
        const app = await applicationsRepository.findApplicationById(assignment.helpApplicationId);
        if (!app) {
            throw { errorCode: "NOT_FOUND", reason: "배정된 지원 신청을 찾을 수 없습니다.", statusCode: 404 };
        }
        if (app.status !== 1) {
            // 이미 거절/철회/대기 등 수락 상태가 아닌 경우
            throw { errorCode: "INVALID_OPERATION", reason: "현재 수락 상태가 아니라 철회할 수 없습니다.", statusCode: 409 };
        }

        // 4) 지원 신청을 철회(3)로 변경 — 다른 상태/엔티티는 변경하지 않음
        try {
            const withdrawn = await applicationsRepository.withdrawAcceptedApplication(app.id);

            // 상태 텍스트 헬퍼
            const helpStatusText = { 0: "요청", 1: "배정", 2: "완료", 3: "취소" }[help.status] ?? "알 수 없음";
            const appStatusText = { 0: "대기", 1: "수락", 2: "거절", 3: "철회" }[withdrawn.status] ?? "알 수 없음";

            return {
                message: "배정된 헬퍼의 수락이 철회되었습니다.",
                help: { id: help.id, status: help.status, statusText: helpStatusText },
                application: { id: withdrawn.id, status: withdrawn.status, statusText: appStatusText },
            };
        } catch (e) {
            console.error("Helper kick update error:", e);
            throw { errorCode: "UPDATE_ERROR", reason: "철회 처리 중 오류가 발생했습니다.", statusCode: 500 };
        }
    }

    // 내 지원 목록 조회
    async getMyApplications(userId, { page, size }) {
        try {
            // 1) 페이지네이션으로 지원 목록 조회
            const [applications, totalCount] = await Promise.all([
                applicationsRepository.findMyApplicationsWithPagination(userId, { page, size }),
                applicationsRepository.countMyApplications(userId)
            ]);

            // 2) 요청자들의 리뷰 통계 조회
            const requesterIds = applications.map(app => app.helpRequest.requester.id);
            let reviewStatsByUser = {};

            if (requesterIds.length > 0) {
                const stats = await applicationsRepository.getReviewStatsByUsers(requesterIds);
                reviewStatsByUser = stats.reduce((acc, s) => {
                    acc[s.revieweeId] = {
                        reviewCount: s._count?.id ?? 0,
                        ratingAvg: s._avg?.rating ? Number(s._avg.rating.toFixed(2)) : 0,
                    };
                    return acc;
                }, {});
            }

            // 3) 페이지네이션 정보 계산
            const totalPages = Math.ceil(totalCount / size);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;

            // 4) DTO 변환
            const formattedApplications = applications.map(app =>
                new MyApplicationItemDto(app, reviewStatsByUser)
            );

            return {
                applications: formattedApplications,
                pagenation: {
                    page,
                    totalPages,
                }
            };
        } catch (e) {
            console.error("Get my applications error:", e);
            throw {
                errorCode: "FETCH_ERROR",
                reason: "돌봄 참여 목록 조회 중 오류가 발생했습니다.",
                statusCode: 500,
            };
        }
    }
}

export const applicationsService = new ApplicationsService();
