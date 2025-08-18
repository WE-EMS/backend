import { usersRepository } from './users.repository.js';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const { AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_S3_BUCKET_NAME } = process.env;

// AWS S3 클라이언트
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
    }
});

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

        // 프로필 이미지 우선순위: 커스텀 > 카카오
        const profileImageUrl = user.imageUrl || user.kakaoProfileImageUrl;

        return {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            imageUrl: user.imageUrl, // 커스텀 이미지
            kakaoProfileImageUrl: user.kakaoProfileImageUrl, // 카카오 이미지
            profileImageUrl: profileImageUrl, // 실제 표시할 이미지
            hasCustomImage: !!user.imageUrl,
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

        // 프로필 이미지 우선순위 적용
        const profileImageUrl = updatedUser.imageUrl || updatedUser.kakaoProfileImageUrl;

        return {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            imageUrl: updatedUser.imageUrl,
            kakaoProfileImageUrl: updatedUser.kakaoProfileImageUrl,
            profileImageUrl: profileImageUrl,
            hasCustomImage: !!updatedUser.imageUrl,
            birth: updatedUser.birth,
            phone: updatedUser.phone,
            region: updatedUser.region,
            updatedAt: updatedUser.updatedAt
        };
    }

    // 커스텀 프로필 이미지 업로드
    async uploadProfileImage(userId, imageFile) {
        const existingUser = await usersRepository.findById(userId);

        if (!existingUser) {
            throw new Error('USER_NOT_FOUND');
        }

        // 기존 커스텀 이미지가 있다면 S3에서 삭제
        if (existingUser.imageKey) {
            await this.deleteImageFromS3(existingUser.imageKey);
        }

        // 새 이미지 정보 저장
        const updatedUser = await usersRepository.update(userId, {
            imageUrl: imageFile.location,
            imageKey: imageFile.key
        });

        const profileImageUrl = updatedUser.imageUrl || updatedUser.kakaoProfileImageUrl;

        return {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            imageUrl: updatedUser.imageUrl,
            kakaoProfileImageUrl: updatedUser.kakaoProfileImageUrl,
            profileImageUrl: profileImageUrl,
            hasCustomImage: !!updatedUser.imageUrl,
            birth: updatedUser.birth,
            phone: updatedUser.phone,
            region: updatedUser.region,
            tokenBalance: updatedUser.tokenBalance,
            updatedAt: updatedUser.updatedAt
        };
    }

    // 프로필 이미지를 카카오 기본으로 되돌리기
    async resetToKakaoProfileImage(userId) {
        const user = await usersRepository.findById(userId);

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // 커스텀 이미지가 없으면 에러
        if (!user.imageKey) {
            throw new Error('NO_CUSTOM_IMAGE');
        }

        // 기존 커스텀 이미지 S3에서 삭제
        await this.deleteImageFromS3(user.imageKey);

        // 커스텀 이미지 정보 제거
        const updatedUser = await usersRepository.update(userId, {
            imageUrl: null,
            imageKey: null
        });

        const profileImageUrl = updatedUser.imageUrl || updatedUser.kakaoProfileImageUrl;

        return {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            email: updatedUser.email,
            imageUrl: updatedUser.imageUrl,
            kakaoProfileImageUrl: updatedUser.kakaoProfileImageUrl,
            profileImageUrl: profileImageUrl,
            hasCustomImage: !!updatedUser.imageUrl,
            birth: updatedUser.birth,
            phone: updatedUser.phone,
            region: updatedUser.region,
            tokenBalance: updatedUser.tokenBalance,
            updatedAt: updatedUser.updatedAt
        };
    }

    // S3에서 이미지 삭제
    async deleteImageFromS3(imageKey) {
        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: AWS_S3_BUCKET_NAME,
                Key: imageKey
            });

            await s3.send(deleteCommand);
            console.log(`S3 이미지 삭제 성공: ${imageKey}`);
        } catch (error) {
            console.error(`S3 이미지 삭제 실패: ${imageKey}`, error);
            // S3 삭제 실패해도 DB 업데이트는 계속 진행
        }
    }

    async getUserById(userId) {
        return await usersRepository.findById(userId);
    }
}

export const usersService = new UsersService();