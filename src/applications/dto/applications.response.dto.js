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

// 지원자 목록용 DTO들
export class ApplyListResponseDto {
    constructor(help, applications, reviewStatsByUser, pagination = null, totalCount = null) {
        this.help = {
            id: help.id,
            helpType: help.helpType,
            helpTypeText: this._helpTypeText(help.helpType),
            status: help.status,
            statusText: this._helpStatusText(help.status),
        };

        // 전체 지원자 수 (페이지네이션 적용 전 총합)
        this.totalApplicants = Number.isInteger(totalCount) ? totalCount : applications.length;
        this.applicants = applications.map((a) => {
            const stats = reviewStatsByUser[a.userId] || {
                reviewCount: 0,
                ratingAvg: 0,
            };
            return new ApplicantListItemDto(a, stats);
        });
        // 페이지네이션
        if (pagination) {
            this.pagination = {
                page: pagination.page,
                totalPages: pagination.totalPages
            };
        }
    }

    _helpTypeText(type) {
        const map = { 1: "등하원", 2: "놀이", 3: "동행", 4: "기타" };
        return map[type] ?? "알 수 없음";
    }
    _helpStatusText(status) {
        const map = { 0: "요청", 1: "배정", 2: "완료", 3: "취소" };
        return map[status] ?? "알 수 없음";
    }
}

export class ApplicantListItemDto {
    constructor(app, stats) {
        this.applicationId = app.id;
        this.status = app.status;
        this.statusText = this._statusText(app.status);
        this.message = app.message ?? null;
        this.createdAt = app.createdAt;

        this.helper = {
            id: app.helper?.id ?? app.userId,
            nickname: app.helper?.nickname ?? "알수없음",
            profileImageUrl:
                app.helper?.imageUrl || app.helper?.kakaoProfileImageUrl || null,
            reviewCount: stats.reviewCount ?? 0,
            ratingAvg: stats.ratingAvg ?? 0,
        };
    }

    _statusText(status) {
        const map = { 0: "대기", 1: "수락", 2: "거절", 3: "철회" };
        return map[status] ?? "알 수 없음";
    }
}

// 내 돌봄 참여 목록 아이템 DTO
export class MyApplicationItemDto {
    constructor(app, reviewStatsByUser) {
        this.applicationId = app.id;
        this.status = app.status;
        this.statusText = this._statusText(app.status);
        this.createdAt = app.createdAt;

        this.help = {
            id: app.helpRequest.id,
            helpType: app.helpRequest.helpType,
            helpTypeText: this._helpTypeText(app.helpRequest.helpType),
            serviceDate: app.helpRequest.serviceDate,
            startTime: app.helpRequest.startTime,
            endTime: app.helpRequest.endTime,
            requester: {
                id: app.helpRequest.requester.id,
                nickname: app.helpRequest.requester.nickname,
                profileImageUrl:
                    app.helpRequest.requester.imageUrl ||
                    app.helpRequest.requester.kakaoProfileImageUrl ||
                    null,
                reviewCount: reviewStatsByUser[app.helpRequest.requester.id]?.reviewCount ?? 0,
                ratingAvg: reviewStatsByUser[app.helpRequest.requester.id]?.ratingAvg ?? 0,
            },
        };
    }

    _statusText(status) {
        const map = { 0: "대기", 1: "수락", 2: "거절", 3: "철회" };
        return map[status] ?? "알 수 없음";
    }

    _helpTypeText(type) {
        const map = { 1: "등하원", 2: "놀이", 3: "동행", 4: "기타" };
        return map[type] ?? "알 수 없음";
    }
}