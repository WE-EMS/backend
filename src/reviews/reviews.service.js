import { reviewRepository } from './reviews.repository.js';

const REVIEW_WINDOW_DAYS = 3;
const FINISHED_STATUS = 2;

class ReviewService {
    async createForHelp({ reviewerId, helpId, rating, content }) {
        this._validate({ reviewerId, rating, helpId });

        const help = await reviewRepository.findHelpWithAssignment(helpId);
        if (!help) this._throw(404, 'NOT_FOUND', '해당 도움을 찾을 수 없습니다.');

        const { requesterId, serviceDate, endTime, assignment, status } = help;

        const assignedHelperId = assignment?.helperId ?? null;
        const isRequester = reviewerId === requesterId;
        const isHelper = assignedHelperId ? reviewerId === assignedHelperId : false;

        if (!isRequester && !isHelper) {
            // 철회여도 상호리뷰 가능: 보통 assignment 레코드를 남겨두면 helperId 확인 가능
            this._throw(403, 'FORBIDDEN', '리뷰 작성 권한이 없습니다.');
        }

        this._ensureWithinWindow(serviceDate, endTime);

        const revieweeId = isRequester ? assignedHelperId : requesterId;
        if (!revieweeId) this._throw(400, 'INVALID_STATE', '리뷰 대상이 존재하지 않습니다.');

        await this._ensureNoDuplicate(helpId, reviewerId);

        const created = await reviewRepository.createReview({
            helpId,
            reviewerId,
            revieweeId,
            rating,
            content: content ?? null,
            helpAssignmentId: assignment?.id ?? null,
        });

        if (isRequester && status !== FINISHED_STATUS) {
            await reviewRepository.updateHelpStatus(helpId, FINISHED_STATUS);
        }

        return this._toDto(created);
    }

    async createForAssignment({ reviewerId, assignmentId, rating, content }) {
        this._validate({ reviewerId, rating, assignmentId });

        const assignment = await reviewRepository.findAssignmentWithHelp(assignmentId);
        if (!assignment) this._throw(404, 'NOT_FOUND', '해당 참여(배정)를 찾을 수 없습니다.');

        const { id: helpAssignmentId, helperId, helpRequest } = assignment;
        const { id: helpId, requesterId, serviceDate, endTime, status } = helpRequest;

        const isRequester = reviewerId === requesterId;
        const isHelper = reviewerId === helperId;
        if (!isRequester && !isHelper) this._throw(403, 'FORBIDDEN', '리뷰 작성 권한이 없습니다.');

        this._ensureWithinWindow(serviceDate, endTime);

        const revieweeId = isRequester ? helperId : requesterId;

        await this._ensureNoDuplicate(helpId, reviewerId);

        const created = await reviewRepository.createReview({
            helpId,
            reviewerId,
            revieweeId,
            rating,
            content: content ?? null,
            helpAssignmentId,
        });

        if (isRequester && status !== FINISHED_STATUS) {
            await reviewRepository.updateHelpStatus(helpId, FINISHED_STATUS);
        }

        return this._toDto(created);
    }

    async autoCompleteHelps() {
        const overdueHelps = await reviewRepository.findOverdueHelpsWithoutReviews({
            days: REVIEW_WINDOW_DAYS,
            finishedStatus: FINISHED_STATUS,
        });
        if (overdueHelps.length === 0) return { affectedCount: 0 };

        const helpIds = overdueHelps.map(h => h.id);
        const affectedCount = await reviewRepository.bulkUpdateHelpsStatus(helpIds, FINISHED_STATUS);
        return { affectedCount };
    }

    async getMyReviewables(userId, { page = 1, size = 10 } = {}) {
        if (!userId) this._throw(401, 'UNAUTHORIZED', '로그인이 필요합니다.');

        const candidates = await reviewRepository.findReviewableCandidatesByUser(userId);

        const now = new Date();
        const filtered = candidates
            // 내가 아직 리뷰를 안 쓴 건만
            .filter(h => (h.reviews?.length ?? 0) === 0)
            // 리뷰 가능 기간(종료~3일 내)인 건만
            .filter(h => {
                const endAt = this._composeEndAt(h.serviceDate, h.endTime);
                const windowEnd = new Date(endAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
                return now >= endAt && now <= windowEnd;
            })
            // 응답 DTO용 데이터 구성
            .map(h => {
                const isRequester = h.requesterId === userId;
                const helper = h.assignment?.helper;
                const requester = h.requester;
                const participantNickname = isRequester ? (helper?.nickname ?? null) : requester?.nickname;
                return {
                    helpId: h.id,
                    assignmentId: h.assignment?.id ?? null, // 요청자이면 존재, 참여자이면 null일 수 있음
                    helpType: h.helpType,
                    serviceDate: h.serviceDate,
                    participantNickname,
                    counterRole: isRequester ? '참여자' : '요청자',
                };
            });
        const total = filtered.length;
        const totalPage = Math.max(1, Math.ceil(total / size));
        const start = (page - 1) * size;
        const items = filtered.slice(start, start + size);
        return {
            items,
            pagination: { page, totalPages: totalPage }
        };
    }

    async getMyWritten(userId, { page = 1, size = 10 } = {}) {
        if (!userId) this._throw(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
        const total = await reviewRepository.countWrittenByUser(userId);
        const totalPage = Math.max(1, Math.ceil(total / size));
        const skip = (page - 1) * size;
        const rows = await reviewRepository.findWrittenByUser(userId, { skip, take: size });
        const items = rows.map(r => {
            const help = r.helpRequest;
            const helperId = r.HelpAssignment?.helperId ?? null;
            const isReviewerRequester = help.requesterId === r.reviewerId;
            const counterRole = isReviewerRequester ? '참여자' : '요청자';
            return {
                counterNickname: r.reviewee.nickname,
                counterRole,
                helpType: help.helpType,
                rating: r.rating,
                createdAt: r.createdAt,
                content: r.content ?? null,
            };
        });
        return {
            items,
            pagination: { page, totalPages: totalPage }
        };
    }

    async getMyReceived(userId, { page = 1, size = 10 } = {}) {
        if (!userId) this._throw(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
        const total = await reviewRepository.countReceivedByUser(userId);
        const totalPage = Math.max(1, Math.ceil(total / size));
        const skip = (page - 1) * size;
        const rows = await reviewRepository.findReceivedByUser(userId, { skip, take: size });
        const items = rows.map(r => {
            const help = r.helpRequest;
            const isReviewerRequester = help.requesterId === r.reviewerId;
            const counterRole = isReviewerRequester ? '요청자' : '참여자'; // 내가 받은 입장에서 상대의 역할
            return {
                counterNickname: r.reviewer.nickname,
                counterRole,
                helpType: help.helpType,
                rating: r.rating,
                createdAt: r.createdAt,
                content: r.content ?? null,
            };
        });
        return {
            items,
            pagination: { page, totalPages: totalPage }
        };
    }

    // helpers
    _ensureWithinWindow(serviceDate, endTime) {
        const endAt = this._composeEndAt(serviceDate, endTime);
        const now = new Date();
        const windowEnd = new Date(endAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        if (now < endAt || now > windowEnd) {
            this._throw(400, 'REVIEW_WINDOW_CLOSED', `리뷰는 종료 후 ${REVIEW_WINDOW_DAYS}일 이내에만 가능합니다.`);
        }
    }

    _composeEndAt(serviceDate, endTime) {
        const d = new Date(serviceDate);
        const t = new Date(endTime);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), 0);
    }

    async _ensureNoDuplicate(helpId, reviewerId) {
        const exists = await reviewRepository.findReviewByHelpAndReviewer(helpId, reviewerId);
        if (exists) this._throw(409, 'CONFLICT', '이미 이 도움에 대한 리뷰를 작성했습니다.');
    }

    _validate({ reviewerId, rating, helpId, assignmentId }) {
        if (!reviewerId) this._throw(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
        if (!rating || rating < 1 || rating > 5) this._throw(400, 'VALIDATION_ERROR', 'rating은 1~5 사이여야 합니다.');
        if (!helpId && !assignmentId) this._throw(400, 'VALIDATION_ERROR', '대상 식별자가 필요합니다.');
    }

    _throw(status, code, message) { const e = new Error(message); e.status = status; e.code = code; throw e; }

    _toDto(r) {
        return {
            id: r.id, helpId: r.helpId, reviewerId: r.reviewerId, revieweeId: r.revieweeId,
            rating: r.rating, content: r.content ?? null, createdAt: r.createdAt,
        };
    }
}

export const reviewService = new ReviewService();
