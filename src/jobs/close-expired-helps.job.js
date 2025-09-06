import cron from "node-cron";
import { helpsRepository } from "../helps/helps.repository.js";

/**
 * 오늘의 "KST 자정(00:00)" 시각을 UTC Date 객체로 변환
 * - DB의 serviceDate 비교 기준으로 사용
 * - 예: 2025-09-06 00:00:00 (KST) → 2025-09-05 15:00:00 (UTC)
 */
function kstStartOfTodayAsUtc() {
    const now = new Date();
    // 현재 시간을 KST로 변환
    const kstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    kstNow.setHours(0, 0, 0, 0); // KST 자정으로 맞춤
    // KST → UTC 변환 (9시간 빼기)
    return new Date(kstNow.getTime() - 9 * 60 * 60 * 1000);
}

/**
 * 모집종료(4) 상태 업데이트 스케줄러
 * - 서버 시작 시 즉시 1회 실행
 * - 이후 매 30분마다 실행
 */
export function scheduleCloseExpiredHelps() {
    const run = async () => {
        const cutoffUtc = kstStartOfTodayAsUtc();
        const result = await helpsRepository.closeExpiredHelps(cutoffUtc);
        console.log(
            `[closeExpiredHelps] ${new Date().toISOString()} - updated ${result.count} rows`
        );
    };

    run(); // 서버 시작 시 즉시 1회 실행
    cron.schedule("*/30 * * * *", run, { timezone: "Asia/Seoul" }); // 30분마다 실행
}
