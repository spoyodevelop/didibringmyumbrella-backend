const schedule = require("node-schedule");

const { Sentry, initCronService } = require("../utils/sentry");
const { CAPITAL_LOCATION } = require("../config/locations");
const { CRON, SENTRY, TIMEZONE, DATA_FILES } = require("../config/constants");
const { processDataAndWriteToFile } = require("../services/weather/process");
const { getAllMergedObjAndSaveFile } = require("../services/stats/merged");
const { getWeatherDataInsertToDB } = require("../services/weather/db");
const { writeTotalPOPDataToFile } = require("../services/stats/total");

let job;

const { gracefulShutdown } = initCronService({
  serviceName: SENTRY.WEATHER.SERVICE_NAME,
  tracesSampleRate: SENTRY.WEATHER.TRACES_SAMPLE_RATE,
  maxBreadcrumbs: SENTRY.WEATHER.MAX_BREADCRUMBS,
  extraStartInfo: { schedule: CRON.WEATHER.SCHEDULE },
  onShutdown: () => job?.cancel(),
});

console.log("starting job....");

const WEATHER_STEPS = [
  {
    name: "Processing weather data",
    nameKo: "날씨 데이터 처리",
    fn: () => processDataAndWriteToFile(CAPITAL_LOCATION, CRON.WEATHER.MINUTE),
  },
  {
    name: "Merging objects and stats",
    nameKo: "객체 병합 및 통계 저장",
    fn: () => getAllMergedObjAndSaveFile(CAPITAL_LOCATION),
  },
  {
    name: "Writing total POP data",
    nameKo: "전체 POP 데이터 저장",
    fn: () =>
      writeTotalPOPDataToFile(
        DATA_FILES.TOTAL_AREA,
        DATA_FILES.POP_STATS,
        CAPITAL_LOCATION
      ),
  },
  {
    name: "Inserting weather data to DB",
    nameKo: "DB 삽입",
    fn: () => getWeatherDataInsertToDB(CAPITAL_LOCATION),
  },
];

/**
 * 날씨 데이터 수집 및 처리
 * @param {Object} options
 * @param {boolean} [options.withBreadcrumbs=false]
 */
async function executeWeatherSteps({ withBreadcrumbs = false } = {}) {
  for (const [i, { name, nameKo, fn }] of WEATHER_STEPS.entries()) {
    const stepNum = i + 1;

    console.log(`Step ${stepNum}: ${name}...`);

    if (withBreadcrumbs) {
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: `Step ${stepNum}: ${nameKo} 시작`,
        level: "info",
      });
    }

    await fn();

    if (withBreadcrumbs) {
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: `Step ${stepNum}: ${nameKo} 완료`,
        level: "info",
      });
    }
  }
}

job = schedule.scheduleJob(CRON.WEATHER.SCHEDULE, async function () {
  const executionId = Date.now();
  const startTime = new Date();

  console.log(
    `[${startTime.toISOString()}] Cron job execution started (ID: ${executionId})`
  );

  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: SENTRY.WEATHER.MONITOR_SLUG,
      status: "in_progress",
    },
    {
      schedule: {
        type: "crontab",
        value: CRON.WEATHER.SCHEDULE,
      },
      checkinMargin: SENTRY.WEATHER.CHECKIN_MARGIN,
      maxRuntime: SENTRY.WEATHER.MAX_RUNTIME,
      timezone: TIMEZONE,
    }
  );

  Sentry.addBreadcrumb({
    category: "cron",
    message: "크론잡 실행 시작",
    level: "info",
    data: {
      executionId: executionId.toString(),
      startTime: startTime.toISOString(),
      checkInId,
    },
  });

  try {
    await executeWeatherSteps({ withBreadcrumbs: true });

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    console.log(
      `[${endTime.toLocaleDateString(
        "ko-KR"
      )}] Cron job completed successfully (${duration}s)`
    );

    Sentry.addBreadcrumb({
      category: "cron",
      message: "크론잡 정상 완료",
      level: "info",
      data: {
        duration: `${duration}s`,
        endTime: endTime.toISOString(),
      },
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: SENTRY.WEATHER.MONITOR_SLUG,
      status: "ok",
    });
  } catch (error) {
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.error("❌ Error processing weather data:", error);
    console.error("Error details:", {
      message: error.message,
      executionId,
      duration: `${duration}s`,
    });

    Sentry.captureException(error, {
      level: "error",
      tags: {
        service: SENTRY.WEATHER.SERVICE_NAME,
        executionId: executionId.toString(),
        minute: CRON.WEATHER.MINUTE.toString(),
      },
      extra: {
        location: "CAPITAL_LOCATION",
        timestamp: new Date().toISOString(),
        startTime: startTime.toISOString(),
        duration: `${duration}s`,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: SENTRY.WEATHER.MONITOR_SLUG,
      status: "error",
    });

    await Sentry.flush(2000);
  }
});

console.log(
  `✅ Cron job scheduled: ${CRON.WEATHER.MINUTE} minutes past ${CRON.WEATHER.HOURS} hours`
);

async function executeManually() {
  const executionId = Date.now();
  const startTime = new Date();

  console.log("🔧 매뉴얼 날씨 데이터 수집 시작...");
  console.log(`[${startTime.toISOString()}] Execution ID: ${executionId}`);

  try {
    await executeWeatherSteps({ withBreadcrumbs: false });

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ 매뉴얼 실행 완료! (${duration}s)`);
    return { success: true, duration };
  } catch (error) {
    console.error("❌ 매뉴얼 실행 실패:", error.message);
    throw error;
  }
}

if (process.argv.includes("--manual")) {
  executeManually()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { executeManually };
