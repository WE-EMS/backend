export class MyPageResponseDto {
    constructor(userData) {
        this.user = {
            id: userData.id,
            nickname: userData.nickname,
            email: userData.email,
            imageUrl: userData.imageUrl, // 커스텀 이미지
            kakaoProfileImageUrl: userData.kakaoProfileImageUrl, // 카카오 이미지
            profileImageUrl: userData.profileImageUrl, // 실제 표시할 이미지
            hasCustomImage: userData.hasCustomImage, // 커스텀 이미지 보유 여부
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
            imageUrl: review.reviewer.imageUrl || review.reviewer.kakaoProfileImageUrl // 프로필 이미지 우선순위 적용
        } : null;
    }
}

export class UserProfileDto {
    constructor(user) {
        this.id = user.id;
        this.nickname = user.nickname;
        this.email = user.email;
        this.imageUrl = user.imageUrl;
        this.kakaoProfileImageUrl = user.kakaoProfileImageUrl;
        this.profileImageUrl = user.imageUrl || user.kakaoProfileImageUrl; // 우선순위 적용
        this.hasCustomImage = !!user.imageUrl;
        this.birth = user.birth;
        this.phone = user.phone;
        this.region = user.region;
        this.tokenBalance = user.tokenBalance;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}