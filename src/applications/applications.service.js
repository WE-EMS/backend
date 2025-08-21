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
}

export const applicationsService = new ApplicationsService();
