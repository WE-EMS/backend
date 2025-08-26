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