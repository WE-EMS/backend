export class ApplicationResponseDto {
    constructor(app) {
        this.id = app.id;
        this.helpRequestId = app.helpRequestId;
        this.userId = app.userId;
        this.status = app.status; // 0 대기, 1 수락, 2 거절, 3 철회
        this.statusText = this._statusText(app.status);
        this.message = app.message ?? null;
        this.createdAt = app.createdAt;

        if (app.helper) {
            this.helper = {
                id: app.helper.id,
                nickname: app.helper.nickname,
                imageUrl: app.helper.imageUrl || app.helper.kakaoProfileImageUrl,
            };
        }
    }

    _statusText(status) {
        const map = { 0: "대기", 1: "수락", 2: "거절", 3: "철회" };
        return map[status] ?? "알 수 없음";
    }
}
