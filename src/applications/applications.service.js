import { applicationsRepository } from "./applications.repository.js";
import { CreateApplicationRequestDto } from "./dto/applications.request.dto.js";
import { ApplicationResponseDto } from "./dto/applications.response.dto.js";

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
}

export const applicationsService = new ApplicationsService();
