import cron from "node-cron";
import { helpsRepository } from "../helps/helps.repository.js";
import {
    kstStartOfTodayAsUtc,
    kstStartOfTomorrowAsUtc,
    nowUtcTimeOfDayEpoch
} from "../utils/time.js";

export function scheduleCloseExpiredHelps() {
    const run = async () => {
        const todayStartUtc = kstStartOfTodayAsUtc();
        const tomorrowStartUtc = kstStartOfTomorrowAsUtc();
        const nowUtcTime = nowUtcTimeOfDayEpoch();

        await helpsRepository.closeExpiredByPastDate(todayStartUtc);
        await helpsRepository.closeExpiredByStartTimeToday({
            todayStartUtc, tomorrowStartUtc, nowUtcTime
        });
        // await helpsRepository.debugCheckRow(24, { todayStartUtc, tomorrowStartUtc, nowUtcTime });

    };

    run(); // 서버 시작 즉시 1회
    cron.schedule("*/30 * * * *", run, { timezone: "Asia/Seoul" });
}
