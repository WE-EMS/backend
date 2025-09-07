import cron from "node-cron";
import { helpsRepository } from "../helps/helps.repository.js";
import { kstStartOfTodayAsUtc, kstStartOfTomorrowAsUtc, nowUtcTimeOfDayEpoch } from "../utils/time.js";

export function scheduleCloseExpiredHelps() {
    const run = async () => {
        const todayStartUtc = kstStartOfTodayAsUtc();
        const tomorrowStartUtc = kstStartOfTomorrowAsUtc();
        const nowUtcTime = nowUtcTimeOfDayEpoch();

        await helpsRepository.closeExpiredByPastDate(todayStartUtc);
        await helpsRepository.closeExpiredByStartTimeToday({
            todayStartUtc, tomorrowStartUtc, nowUtcTime
        });
        // console.log(`[closeExpiredHelps/update] past=${r1.count}, todayPastStart=${r2.count}`);
    };

    run(); // 서버 시작 시 즉시 실행
    cron.schedule("*/30 * * * *", run, { timezone: "Asia/Seoul" });
}
