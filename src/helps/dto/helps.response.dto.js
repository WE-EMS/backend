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

export class HelpRequestListResponseDto {
    constructor(requests, pagination) {
        this.requests = requests.map(request => new HelpRequestResponseDto(request));
        this.pagination = pagination;
    }
}

export class UserSummaryDto {
    constructor(user) {
        this.id = user.id;
        this.nickname = user.nickname;
        this.imageUrl = user.imageUrl || user.kakaoProfileImageUrl;
    }
}