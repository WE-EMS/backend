export class MyPageResponseDto {
    constructor(userData) {
        this.user = {
            id: userData.id,
            nickname: userData.nickname,
            email: userData.email,
            imageUrl: userData.imageUrl,
            birth: userData.birth,
            phone: userData.phone,
            region: userData.region,
            tokenBalance: userData.tokenBalance,
            createdAt: userData.createdAt
        };

        this.stats = {
            reviewCount: userData.reviewCount || 0,
            avgRating: userData.avgRating || 0
        };
    }
}

export class ReviewSummaryDto {
    constructor(review) {
        this.id = review.id;
        this.rating = review.rating;
        this.content = review.content;
        this.createdAt = review.createdAt;
        this.reviewer = review.reviewer ? {
            id: review.reviewer.id,
            nickname: review.reviewer.nickname,
            imageUrl: review.reviewer.imageUrl
        } : null;
    }
}

export class UserProfileDto {
    constructor(user) {
        this.id = user.id;
        this.nickname = user.nickname;
        this.email = user.email;
        this.imageUrl = user.imageUrl;
        this.birth = user.birth;
        this.phone = user.phone;
        this.region = user.region;
        this.tokenBalance = user.tokenBalance;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}