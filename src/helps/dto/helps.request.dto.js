export class CreateHelpRequestDto {
    constructor(body) {
        this.helpType = parseInt(body.helpType);
        this.serviceDate = body.serviceDate;
        this.startTime = body.startTime;
        this.endTime = body.endTime;
        this.addressText = body.addressText?.trim();
        this.requestLocation = body.requestLocation?.trim() || null;
        this.requestDetail = body.requestDetail?.trim() || null;
        this.requestNote = body.requestNote?.trim() || null;

        // 보상 토큰 자동 계산
        this.rewardTokens = this.calculateRewardTokens();
    }

    // 보상 토큰 자동 계산: (종료시간 - 시작시간) * 3
    calculateRewardTokens() {
        if (!this.startTime || !this.endTime) return 0;

        const toMinutes = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        try {
            const startMin = toMinutes(this.startTime);
            const endMin = toMinutes(this.endTime);
            const diffMin = endMin - startMin;

            if (diffMin <= 0) return 0;

            // 10분당 1개
            return Math.floor(diffMin / 10);
        } catch {
            return 0;
        }
    }

    validate() {
        const errors = [];

        // 도움 유형 검증
        if (!this.helpType || ![1, 2, 3, 4].includes(this.helpType)) {
            errors.push('도움 유형을 선택해주세요.');
        }

        // 서비스 날짜 검증 (오늘부터 가능)
        if (!this.serviceDate) {
            errors.push('서비스 날짜를 선택해주세요.');
        } else {
            // KST 기준으로 비교 → utils/time.js에서 헬퍼 불러와 사용
            // - toKstDateOnly: DB/입력 날짜를 KST 날짜 객체로 변환
            // - getKstStartOfTodayUtc: 오늘 00:00(KST)의 UTC (여기선 단순히 KST '오늘 00:00'을 만들어 비교)
            const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
            kstNow.setHours(0, 0, 0, 0); // 오늘 KST 자정
            const serviceDateKst = new Date(new Date(this.serviceDate).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
            serviceDateKst.setHours(0, 0, 0, 0);
            if (serviceDateKst < kstNow) {
                errors.push('서비스 날짜는 오늘 또는 이후여야 합니다.');
            }
        }

        // 시간 검증
        if (!this.startTime) {
            errors.push('시작 시간을 선택해주세요.');
        }
        if (!this.endTime) {
            errors.push('종료 시간을 선택해주세요.');
        }

        if (this.startTime && this.endTime) {
            const start = new Date(`2000-01-01 ${this.startTime}`);
            const end = new Date(`2000-01-01 ${this.endTime}`);

            if (start >= end) {
                errors.push('종료 시간은 시작 시간보다 늦어야 합니다.');
            }
        }

        // 주소 검증
        if (!this.addressText || this.addressText.length < 2) {
            errors.push('주소를 입력해주세요.');
        }

        return errors;
    }

    // 데이터베이스 저장용 형태로 변환
    toDatabaseFormat(requesterId) {
        return {
            requesterId,
            helpType: this.helpType,
            serviceDate: new Date(this.serviceDate),
            startTime: new Date(`2000-01-01 ${this.startTime}:00`), // DateTime 객체로 변환
            endTime: new Date(`2000-01-01 ${this.endTime}:00`),     // DateTime 객체로 변환
            addressText: this.addressText,
            requestLocation: this.requestLocation,
            requestDetail: this.requestDetail,
            requestNote: this.requestNote,
            rewardTokens: this.rewardTokens,
            status: 0, // 기본값: 요청 상태
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}

// 내 돌봄요청 리스트 응답 DTO
export class MyHelpRequestListResponseDto {
    constructor(requests, page, totalPage) {
        this.requests = requests.map(request => new MyHelpRequestListItemDto(request));
        this.pagination = {
            page: page,
            totalPage: totalPage
        };
    }
}