import { usersRepository } from './users.repository.js';

class UsersService {
    async getMyPageInfo(userId) {
        const user = await usersRepository.findByIdWithReviewStats(userId);

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // 평균 별점 계산
        const avgRating = user.reviewsReceived.length > 0
            ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / user.reviewsReceived.length
            : 0;

        return {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            imageUrl: user.imageUrl,
            birth: user.birth,
            phone: user.phone,
            region: user.region,
            tokenBalance: user.tokenBalance,
            reviewCount: user._count.reviewsReceived,
            avgRating: Math.round(avgRating * 10) / 10, // 소수점 1자리로 반올림
            createdAt: user.createdAt
        };
    }

    async updateProfile(userId, updateData) {
        const existingUser = await usersRepository.findById(userId);

        if (!existingUser) {
            throw new Error('USER_NOT_FOUND');
        }

        // 이메일 중복 체크 (기존 사용자 제외)
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await usersRepository.findByEmail(updateData.email);
            if (emailExists) {
                throw new Error('EMAIL_ALREADY_EXISTS');
            }
        }

        const updatedUser = await usersRepository.update(userId, updateData);

        return {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            imageUrl: updatedUser.imageUrl,
            birth: updatedUser.birth,
            phone: updatedUser.phone,
            region: updatedUser.region,
            updatedAt: updatedUser.updatedAt
        };
    }

    async getUserById(userId) {
        return await usersRepository.findById(userId);
    }
}

export const usersService = new UsersService();