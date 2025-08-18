export class UpdateProfileRequestDto {
    constructor(data = {}) {
        this.nickname = data.nickname;
        this.email = data.email;
        this.birth = data.birth ? new Date(data.birth) : undefined;
        this.phone = data.phone;
        this.region = data.region;
    }

    validate() {
        const errors = [];

        // 닉네임 검증
        if (this.nickname !== undefined) {
            if (typeof this.nickname !== 'string') {
                errors.push('닉네임은 문자열이어야 합니다.');
            } else if (this.nickname.length < 2 || this.nickname.length > 20) {
                errors.push('닉네임은 2글자 이상 20글자 이하여야 합니다.');
            }
        }

        // 이메일 검증
        if (this.email !== undefined) {
            if (typeof this.email !== 'string') {
                errors.push('이메일은 문자열이어야 합니다.');
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.email)) {
                    errors.push('올바른 이메일 형식이 아닙니다.');
                }
            }
        }

        // 전화번호 검증
        if (this.phone !== undefined && this.phone !== null) {
            if (typeof this.phone !== 'string') {
                errors.push('전화번호는 문자열이어야 합니다.');
            } else {
                const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
                if (!phoneRegex.test(this.phone.replace(/-/g, ''))) {
                    errors.push('올바른 전화번호 형식이 아닙니다.');
                }
            }
        }

        // 생년월일 검증
        if (this.birth !== undefined) {
            if (!(this.birth instanceof Date) || isNaN(this.birth)) {
                errors.push('올바른 생년월일 형식이 아닙니다.');
            } else {
                const now = new Date();
                const minAge = new Date();
                minAge.setFullYear(now.getFullYear() - 100);
                const maxAge = new Date();
                maxAge.setFullYear(now.getFullYear() - 14);

                if (this.birth < minAge || this.birth > maxAge) {
                    errors.push('생년월일이 유효하지 않습니다.');
                }
            }
        }

        return errors.length > 0 ? errors.join(', ') : null;
    }

    // undefined 필드 제거하여 실제 업데이트할 데이터만 반환
    getUpdateData() {
        const updateData = {};

        if (this.nickname !== undefined) updateData.nickname = this.nickname;
        if (this.email !== undefined) updateData.email = this.email;
        if (this.birth !== undefined) updateData.birth = this.birth;
        if (this.phone !== undefined) updateData.phone = this.phone;
        if (this.region !== undefined) updateData.region = this.region;

        return updateData;
    }
}