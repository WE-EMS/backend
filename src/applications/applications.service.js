import { applicationsRepository } from "./applications.repository.js";
import { CreateApplicationRequestDto } from "./dto/applications.request.dto.js";
import { ApplicationResponseDto, ApplyListResponseDto } from "./dto/applications.response.dto.js";

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

    // 지원자 목록
    async getApplyList(helpId, requesterId) {
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

        // 3) 지원 목록 + 헬퍼 기본 정보
        const applications = await applicationsRepository.listApplicationsByHelp(
            helpId
        );

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

        // 5) DTO 매핑
        return new ApplyListResponseDto(help, applications, reviewStatsByUser);
    }

    // ✅ 수락/거절
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
}

export const applicationsService = new ApplicationsService();
