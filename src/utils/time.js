const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 오늘 KST 00:00을 "UTC Date"로 반환
 * 예) KST 2025-09-07 00:00:00 → UTC 2025-09-06 15:00:00
 */
export function kstStartOfTodayAsUtc() {
    const nowUtcMs = Date.now();                        // 현재 UTC epoch(ms)
    const kstEpochMs = nowUtcMs + KST_OFFSET_MS;        // KST 타임라인으로 이동
    const kstDays = Math.floor(kstEpochMs / MS_PER_DAY);// KST 기준 '오늘'의 일수
    const kstMidnightEpochMs = kstDays * MS_PER_DAY;    // KST 자정(epoch, KST 타임라인)
    const utcMs = kstMidnightEpochMs - KST_OFFSET_MS;   // 다시 UTC로 환산
    return new Date(utcMs);
}

/** 내일 KST 00:00의 UTC Date */
export function kstStartOfTomorrowAsUtc() {
    const todayUtc = kstStartOfTodayAsUtc();
    return new Date(todayUtc.getTime() + MS_PER_DAY);
}

/**
 * 현재 시간을 UTC time-only(1970-01-01 기준) Date로 반환
 * - DB TIME(@db.Time, UTC)와 안전 비교용
 */
export function nowUtcTimeOfDayEpoch() {
    const now = new Date(); // UTC 기준 시/분/초 사용
    return new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
}