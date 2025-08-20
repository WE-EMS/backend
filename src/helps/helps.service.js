import { helpsRepository } from "./helps.repository.js";
import { CreateHelpRequestDto } from "./dto/helps.request.dto.js";
import { HelpRequestResponseDto, HelpRequestListResponseDto } from "./dto/helps.response.dto.js";

export class HelpsService {
    // 돌봄요청 생성
    async createHelpRequest(requestBody, requesterId, imageFile = null) {
        // DTO 생성 및 검증
        const createDto = new CreateHelpRequestDto(requestBody);
        const validationErrors = createDto.validate();

        if (validationErrors.length > 0) {
            throw {
                errorCode: "VALIDATION_ERROR",
                reason: validationErrors.join(', '),
                statusCode: 400
            };
        }

        // 데이터베이스 형태로 변환
        const helpRequestData = createDto.toDatabaseFormat(requesterId);

        // 이미지 정보 추가
        let imageData = null;
        if (imageFile) {
            imageData = {
                imageUrl: imageFile.location,
                imageKey: imageFile.key
            };
        }

        try {
            const helpRequest = await helpsRepository.createHelpRequest(helpRequestData, imageData);
            return new HelpRequestResponseDto(helpRequest);
        } catch (error) {
            console.error('Help request creation error:', error);
            throw {
                errorCode: "CREATE_ERROR",
                reason: "돌봄요청 생성 중 오류가 발생했습니다.",
                statusCode: 500
            };
        }
    }

    // 특정 돌봄요청 조회
    async getHelpRequestById(id) {
        try {
            const helpRequest = await helpsRepository.findHelpRequestById(id);

            if (!helpRequest) {
                throw {
                    errorCode: "NOT_FOUND",
                    reason: "해당 돌봄요청을 찾을 수 없습니다.",
                    statusCode: 404
                };
            }

            return new HelpRequestResponseDto(helpRequest);
        } catch (error) {
            if (error.statusCode) {
                throw error;
            }

            console.error('Help request fetch error:', error);
            throw {
                errorCode: "FETCH_ERROR",
                reason: "돌봄요청 조회 중 오류가 발생했습니다.",
                statusCode: 500
            };
        }
    }

    // 돌봄요청 수정
    async updateHelpRequest(id, requestBody, requesterId, imageFile = null) {
        // 기존 요청 조회 및 권한 확인
        const existingRequest = await helpsRepository.findHelpRequestById(id);

        if (!existingRequest) {
            throw {
                errorCode: "NOT_FOUND",
                reason: "해당 돌봄요청을 찾을 수 없습니다.",
                statusCode: 404
            };
        }

        if (existingRequest.requesterId !== requesterId) {
            throw {
                errorCode: "FORBIDDEN",
                reason: "자신의 돌봄요청만 수정할 수 있습니다.",
                statusCode: 403
            };
        }

        // 완료된 요청은 수정 불가
        if (existingRequest.status === 2) {
            throw {
                errorCode: "INVALID_STATUS",
                reason: "완료된 돌봄요청은 수정할 수 없습니다.",
                statusCode: 400
            };
        }

        // DTO 생성 및 검증
        const updateDto = new CreateHelpRequestDto(requestBody);
        const validationErrors = updateDto.validate();

        if (validationErrors.length > 0) {
            throw {
                errorCode: "VALIDATION_ERROR",
                reason: validationErrors.join(', '),
                statusCode: 400
            };
        }

        // 업데이트 데이터 준비 (DateTime 객체로 변환)
        const updateData = {
            helpType: updateDto.helpType,
            serviceDate: new Date(updateDto.serviceDate),
            startTime: new Date(`2000-01-01 ${updateDto.startTime}:00`), // DateTime 객체로 변환
            endTime: new Date(`2000-01-01 ${updateDto.endTime}:00`),     // DateTime 객체로 변환
            addressText: updateDto.addressText,
            requestLocation: updateDto.requestLocation,
            requestDetail: updateDto.requestDetail,
            requestNote: updateDto.requestNote,
            rewardTokens: updateDto.rewardTokens, // 자동 계산된 값 사용
            updatedAt: new Date()
        };

        // 이미지 정보 추가
        let imageData = null;
        if (imageFile) {
            imageData = {
                imageUrl: imageFile.location,
                imageKey: imageFile.key
            };
        }

        try {
            const updatedRequest = await helpsRepository.updateHelpRequest(id, updateData, imageData);
            return new HelpRequestResponseDto(updatedRequest);
        } catch (error) {
            console.error('Help request update error:', error);
            throw {
                errorCode: "UPDATE_ERROR",
                reason: "돌봄요청 수정 중 오류가 발생했습니다.",
                statusCode: 500
            };
        }
    }

    // 돌봄요청 삭제
    async deleteHelpRequest(id, requesterId) {
        const existingRequest = await helpsRepository.findHelpRequestById(id);

        if (!existingRequest) {
            throw {
                errorCode: "NOT_FOUND",
                reason: "해당 돌봄요청을 찾을 수 없습니다.",
                statusCode: 404
            };
        }

        if (existingRequest.requesterId !== requesterId) {
            throw {
                errorCode: "FORBIDDEN",
                reason: "자신의 돌봄요청만 삭제할 수 있습니다.",
                statusCode: 403
            };
        }

        if (existingRequest.status === 2) {
            throw {
                errorCode: "INVALID_STATUS",
                reason: "완료된 돌봄요청은 삭제할 수 없습니다.",
                statusCode: 400
            };
        }

        try {
            await helpsRepository.hardDeleteHelpRequest(id);
            return { message: "돌봄요청이 삭제되었습니다." };
        } catch (error) {
            console.error('Help request delete error:', error);
            throw {
                errorCode: "DELETE_ERROR",
                reason: "돌봄요청 삭제 중 오류가 발생했습니다.",
                statusCode: 500
            };
        }
    }

    // 돌봄요청 리스트 조회 (모든 상태 포함)
    async getHelpList({ page = 1, size = 10 }) {
        const skip = (page - 1) * size;
        const take = size;

        // 모든 상태의 돌봄요청 조회
        const where = {}; // 빈 객체로 변경하여 모든 레코드 조회

        const { items, total } = await helpsRepository.findHelpRequests({
            skip,
            take,
            where,
            orderBy: { id: "desc" },
        });

        const totalPage = Math.ceil(total / size);
        return new HelpRequestListResponseDto(items, page, totalPage);
    }
}

export const helpsService = new HelpsService();