export class HelpRequestResponseDto {
    constructor(helpRequest) {
        this.id = helpRequest.id;
        this.helpType = helpRequest.helpType;
        this.helpTypeText = this._getHelpTypeText(helpRequest.helpType);
        this.serviceDate = helpRequest.serviceDate;
        this.startTime = helpRequest.startTime;
        this.endTime = helpRequest.endTime;
        this.addressText = helpRequest.addressText;
        this.requestLocation = helpRequest.requestLocation;
        this.requestDetail = helpRequest.requestDetail;
        this.requestNote = helpRequest.requestNote;
        this.status = helpRequest.status;
        this.statusText = this._getStatusText(helpRequest.status);
        this.imageUrl = helpRequest.imageUrl;
        this.rewardTokens = helpRequest.rewardTokens;
        this.createdAt = helpRequest.createdAt;
        this.updatedAt = helpRequest.updatedAt;

        // 요청자 정보 (관계 데이터가 있는 경우)
        if (helpRequest.requester) {
            const ratings = Array.isArray(helpRequest.requester.reviewsReceived)
                ? helpRequest.requester.reviewsReceived.map(r => r.rating)
                : [];
            const reviewCount = helpRequest.requester._count?.reviewsReceived ?? 0;
            const avgRating = ratings.length
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;
            this.requester = {
                id: helpRequest.requester.id,
                nickname: helpRequest.requester.nickname,
                imageUrl: helpRequest.requester.imageUrl || helpRequest.requester.kakaoProfileImageUrl,
                avgRating,
                reviewCount
            };
        }
    }

    _getHelpTypeText(helpType) {
        const types = {
            1: '등/하원 돌봄',
            2: '놀이 돌봄',
            3: '동행 돌봄',
            4: '기타 돌봄'
        };
        return types[helpType] || '알 수 없음';
    }

    _getStatusText(status) {
        const statuses = {
            0: '요청',
            1: '배정',
            2: '완료',
            3: '취소'
        };
        return statuses[status] || '알 수 없음';
    }
}

// 리스트 조회용 간소화된 DTO
export class HelpRequestListItemDto {
    constructor(helpRequest) {
        this.id = helpRequest.id;
        this.helpType = helpRequest.helpType;
        this.helpTypeText = this._getHelpTypeText(helpRequest.helpType);
        this.serviceDate = helpRequest.serviceDate;
        this.startTime = helpRequest.startTime;
        this.endTime = helpRequest.endTime;
        this.addressText = helpRequest.addressText;
        this.rewardTokens = helpRequest.rewardTokens;
        this.createdAt = helpRequest.createdAt;
        this.updatedAt = helpRequest.updatedAt;

        // 소요 분
        this.durationMinutes = this._calcDurationMinutes(helpRequest.startTime, helpRequest.endTime);

        // 요청자 요약 + 평점/리뷰수
        if (helpRequest.requester) {
            const ratings = Array.isArray(helpRequest.requester.reviewsReceived)
                ? helpRequest.requester.reviewsReceived.map(r => r.rating)
                : [];
            const reviewCount = helpRequest.requester._count?.reviewsReceived ?? 0;
            const avgRating = ratings.length
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;

            this.requester = {
                id: helpRequest.requester.id,
                nickname: helpRequest.requester.nickname,
                imageUrl: helpRequest.requester.imageUrl || helpRequest.requester.kakaoProfileImageUrl,
                avgRating,
                reviewCount,
            };
        }
    }

    _calcDurationMinutes(start, end) {
        if (!start || !end) return 0;
        try {
            const s = new Date(start);
            const e = new Date(end);
            return Math.max(0, Math.round((e - s) / (1000 * 60)));
        } catch {
            return 0;
        }
    }

    _getHelpTypeText(helpType) {
        const types = { 1: "등/하원 돌봄", 2: "놀이 돌봄", 3: "동행 돌봄", 4: "기타 돌봄" };
        return types[helpType] || "알 수 없음";
    }
}

export class HelpRequestListResponseDto {
    constructor(requests, page, totalPage) {
        this.requests = requests.map(request => new HelpRequestListItemDto(request));
        this.pagination = {
            page: page,
            totalPage: totalPage
        };
    }
}

export class UserSummaryDto {
    constructor(user) {
        this.id = user.id;
        this.nickname = user.nickname;
        this.imageUrl = user.imageUrl || user.kakaoProfileImageUrl;
    }
}

// 내 돌봄요청 리스트 아이템 DTO
export class MyHelpRequestListItemDto {
    constructor(helpRequest) {
        // 기본 정보
        this.id = helpRequest.id;
        this.serviceDate = helpRequest.serviceDate;
        this.startTime = helpRequest.startTime;
        this.endTime = helpRequest.endTime;
        this.helpType = helpRequest.helpType;
        this.helpTypeText = this._getHelpTypeText(helpRequest.helpType);
        this.status = helpRequest.status;

        // 신청자가 있는 경우
        if (helpRequest.applications && helpRequest.applications.length > 0) {
            this.applicants = helpRequest.applications.map(app => ({
                helperId: app.userId,
                helperImageUrl: app.helper.imageUrl || app.helper.kakaoProfileImageUrl
            }));
        }

        // 매칭완료(status=1)인 경우 배정된 헬퍼 정보
        if (helpRequest.status === 1 && helpRequest.assignment && helpRequest.assignment.helper) {
            const helper = helpRequest.assignment.helper;

            const ratings = Array.isArray(helper.reviewsReceived)
                ? helper.reviewsReceived.map(r => r.rating)
                : [];
            const reviewCount = helper._count?.reviewsReceived ?? 0;
            const avgRating = ratings.length
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;

            this.assignedHelper = {
                nickname: helper.nickname,
                imageUrl: helper.imageUrl || helper.kakaoProfileImageUrl,
                reviewCount: reviewCount,
                avgRating: avgRating
            };
        }
    }

    _getHelpTypeText(helpType) {
        const types = {
            1: "등/하원 돌봄",
            2: "놀이 돌봄",
            3: "동행 돌봄",
            4: "기타 돌봄"
        };
        return types[helpType] || "알 수 없음";
    }
}

export class MyHelpRequestListResponseDto {
    constructor(requests, page, totalPage) {
        this.requests = requests.map(request => new MyHelpRequestListItemDto(request));
        this.pagination = {
            page: page,
            totalPage: totalPage
        };
    }
}