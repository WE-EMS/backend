const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 오늘 KST 00:00을 UTC Date로 반환 */
export function kstStartOfTodayAsUtc() {
    const nowUtcMs = Date.now();
    const nowKst = new Date(nowUtcMs + KST_OFFSET_MS);
    nowKst.setHours(0, 0, 0, 0);
    return new Date(nowKst.getTime() - KST_OFFSET_MS);
}

/** 내일 KST 00:00을 UTC Date로 반환 */
export function kstStartOfTomorrowAsUtc() {
    const t = kstStartOfTodayAsUtc();
    return new Date(t.getTime() + 24 * 60 * 60 * 1000);
}

/** 현재 시간을 UTC time-only(1970-01-01 기준)로 반환 */
export function nowUtcTimeOfDayEpoch() {
    const now = new Date();
    return new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
}