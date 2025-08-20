export class CreateApplicationRequestDto {
    constructor(body) {
        this.message = (body?.message ?? "").toString().trim();
    }

    validate() {
        const errors = [];
        if (this.message.length > 500) {
            errors.push("메시지는 500자 이하로 입력해주세요.");
        }
        return errors;
    }
}
