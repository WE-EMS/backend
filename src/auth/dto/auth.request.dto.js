// 나중에 사용자 정보 업데이트 등에 사용할 수 있도록 기본 구조만 남김

// 사용자 정보 업데이트 요청 DTO (향후 사용 예정)
export class UpdateUserRequestDto {
    constructor({ nickname, birth, phone, region, imageUrl }) {
        this.nickname = nickname;
        this.birth = birth;
        this.phone = phone;
        this.region = region;
        this.imageUrl = imageUrl;
    }

    static fromRequest(req) {
        const { nickname, birth, phone, region, imageUrl } = req.body;
        return new UpdateUserRequestDto({
            nickname,
            birth: birth ? new Date(birth) : undefined,
            phone,
            region,
            imageUrl
        });
    }

    validate() {
        const errors = [];

        if (this.nickname !== undefined && (!this.nickname || this.nickname.trim().length === 0)) {
            errors.push('닉네임은 필수입니다.');
        }

        if (this.nickname !== undefined && this.nickname.length > 20) {
            errors.push('닉네임은 20자 이하여야 합니다.');
        }

        if (this.birth !== undefined && this.birth > new Date()) {
            errors.push('올바른 생년월일을 입력해주세요.');
        }

        if (this.phone !== undefined && this.phone && !/^\d{10,11}$/.test(this.phone.replace(/-/g, ''))) {
            errors.push('올바른 전화번호를 입력해주세요.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // undefined 필드 제거
    toUpdateData() {
        const data = {};
        Object.keys(this).forEach(key => {
            if (this[key] !== undefined) {
                data[key] = this[key];
            }
        });
        return data;
    }
}