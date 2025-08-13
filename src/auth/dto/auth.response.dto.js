// 사용자 정보 응답 DTO
export class AuthResponseDto {
    constructor({ id, kakaoId, nickname, email, imageUrl, imageKey, birth, phone, region, tokenBalance, createdAt, updatedAt }) {
        this.id = id;
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.email = email;
        this.imageUrl = imageUrl;
        this.imageKey = imageKey;
        this.birth = birth;
        this.phone = phone;
        this.region = region;
        this.tokenBalance = tokenBalance;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromUser(user) {
        return new AuthResponseDto({
            id: user.id,
            kakaoId: user.kakaoId,
            nickname: user.nickname,
            email: user.email,
            imageUrl: user.imageUrl,
            imageKey: user.imageKey,
            birth: user.birth,
            phone: user.phone,
            region: user.region,
            tokenBalance: user.tokenBalance,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }

    // 민감한 정보 제외한 공개용 사용자 정보
    static publicInfo(user) {
        return {
            id: user.id,
            nickname: user.nickname,
            imageUrl: user.imageUrl
        };
    }
}

// 로그인 성공 응답 DTO
export class LoginResponseDto {
    constructor({ success, message, user, redirectTo }) {
        this.success = success;
        this.message = message;
        this.user = user;
        this.redirectTo = redirectTo;
    }

    static success(user, redirectTo = '/dashboard') {
        return new LoginResponseDto({
            success: true,
            message: '로그인이 완료되었습니다.',
            user: AuthResponseDto.fromUser(user),
            redirectTo
        });
    }

    static failure(message = '로그인에 실패했습니다.') {
        return new LoginResponseDto({
            success: false,
            message,
            user: null,
            redirectTo: null
        });
    }
}

// 로그아웃 응답 DTO
export class LogoutResponseDto {
    constructor({ success, message, redirectTo }) {
        this.success = success;
        this.message = message;
        this.redirectTo = redirectTo;
    }

    static success(redirectTo = '/') {
        return new LogoutResponseDto({
            success: true,
            message: '로그아웃이 완료되었습니다.',
            redirectTo
        });
    }
}

// API 공통 응답 DTO
export class ApiResponseDto {
    constructor({ success, message, data, errors }) {
        this.success = success;
        this.message = message;
        if (data) this.data = data;
        if (errors) this.errors = errors;
    }

    static success(data, message = '요청이 성공했습니다.') {
        return new ApiResponseDto({
            success: true,
            message,
            data
        });
    }

    static failure(message = '요청이 실패했습니다.', errors = null) {
        return new ApiResponseDto({
            success: false,
            message,
            errors
        });
    }

    static validationError(errors) {
        return new ApiResponseDto({
            success: false,
            message: '입력값 검증에 실패했습니다.',
            errors
        });
    }
}