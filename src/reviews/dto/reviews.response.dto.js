export class ReviewResponseDto {
    constructor(r) {
        this.id = r.id;
        this.helpId = r.helpId;
        this.reviewerId = r.reviewerId;
        this.revieweeId = r.revieweeId;
        this.rating = r.rating;
        this.content = r.content ?? null;
        this.createdAt = r.createdAt;
    }
}

export class ReviewWritableDto {
    constructor(x) {
        this.helpId = x.helpId;
        this.assignmentId = x.assignmentId ?? null; // 요청자라면 사용(참여자 리뷰 경로)
        this.helpType = x.helpType;
        this.serviceDate = x.serviceDate;
        this.participantNickname = x.participantNickname;
        this.counterRole = x.counterRole;
    }
}

export class ReviewWrittenItemDto {
    constructor(x) {
        this.counterNickname = x.counterNickname;
        this.counterRole = x.counterRole;
        this.helpType = x.helpType;
        this.rating = x.rating;
        this.createdAt = x.createdAt;
        this.content = x.content ?? null;
    }
}

export class ReviewReceivedItemDto {
    constructor(x) {
        this.counterNickname = x.counterNickname; // 상대방 닉네임
        this.counterRole = x.counterRole;
        this.helpType = x.helpType;
        this.rating = x.rating;
        this.createdAt = x.createdAt;
        this.content = x.content ?? null;
    }
}
