const schedule = require("node-schedule");
const Sentry = require("@sentry/node");
require("dotenv").config();

// Sentry 초기화
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: 0.1,
  maxBreadcrumbs: 50,
});

const { CAPITAL_LOCATION } = require("../config/locations");
const { processDataAndWriteToFile } = require("../services/weather/process");
const { getAllMergedObjAndSaveFile } = require("../services/stats/merged");
const { getWeatherDataInsertToDB } = require("../services/weather/db");
const { writeTotalPOPDataToFile } = require("../services/stats/total");

const minute = 15;

console.log("starting job....");

// 🚀 서비스 시작 알림 (재시작 감지 포인트!)
Sentry.captureMessage("✅ Weather Cron Service Started", {
  level: "info",
  tags: {
    service: "weather-cron",
    event: "startup",
  },
  extra: {
    startedAt: new Date().toISOString(),
    schedule: `${minute} 3,6,9,12,15,18,21,0 * * *`,
    nodeVersion: process.version,
    hostname: require("os").hostname(),
    pid: process.pid,
  },
});

const job = schedule.scheduleJob(
  `${minute} 3,6,9,12,15,18,21,0 * * *`,
  async function () {
    const executionId = Date.now();
    const startTime = new Date();
    const monitorSlug = "weather-cron-job";

    console.log(
      `[${startTime.toISOString()}] Cron job execution started (ID: ${executionId})`
    );

    // Sentry Cron Monitor 시작 체크인
    const checkInId = Sentry.captureCheckIn(
      {
        monitorSlug: monitorSlug,
        status: "in_progress",
      },
      {
        schedule: {
          type: "crontab",
          value: `${minute} 3,6,9,12,15,18,21,0 * * *`,
        },
        checkinMargin: 5,
        maxRuntime: 10,
        timezone: "Asia/Seoul",
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
      console.log("Step 1: Processing weather data...");
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 1: 날씨 데이터 처리 시작",
        level: "info",
      });

      await processDataAndWriteToFile(CAPITAL_LOCATION, minute);

      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 1: 날씨 데이터 처리 완료",
        level: "info",
      });

      console.log("Step 2: Merging objects and stats...");
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 2: 객체 병합 및 통계 저장 시작",
        level: "info",
      });

      await getAllMergedObjAndSaveFile(CAPITAL_LOCATION);

      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 2: 객체 병합 및 통계 저장 완료",
        level: "info",
      });

      console.log("Step 3: Writing total POP data...");
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 3: 전체 POP 데이터 저장 시작",
        level: "info",
      });

      await writeTotalPOPDataToFile(
        "totalOfAllArea",
        "POPstats",
        CAPITAL_LOCATION
      );

      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 3: 전체 POP 데이터 저장 완료",
        level: "info",
      });

      console.log("Step 4: Inserting weather data to DB...");
      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 4: DB 삽입 시작",
        level: "info",
      });

      await getWeatherDataInsertToDB(CAPITAL_LOCATION);

      Sentry.addBreadcrumb({
        category: "cron.step",
        message: "Step 4: DB 삽입 완료",
        level: "info",
      });

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

      // Sentry Cron Monitor 성공 체크인
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: monitorSlug,
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
          service: "weather-cron",
          executionId: executionId.toString(),
          minute: minute.toString(),
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

      // Sentry Cron Monitor 실패 체크인
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: monitorSlug,
        status: "error",
      });

      await Sentry.flush(2000);
    }
  }
);

console.log(
  `✅ Cron job scheduled: ${minute} minutes past 3,6,9,12,15,18,21,0 hours`
);

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  Sentry.captureMessage(`⚠️ Weather Cron Service Stopped (${signal})`, {
    level: "warning",
    tags: { service: "weather-cron", event: "shutdown" },
    extra: { 
      stoppedAt: new Date().toISOString(),
      signal,
      pid: process.pid,
    },
  });

  await Sentry.flush(2000);
  job.cancel();
  process.exit(0);
};

// 비정상 종료 감지 (Point of Failure!)
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);

  Sentry.captureException(error, {
    level: "fatal",
    tags: { 
      service: "weather-cron", 
      event: "crash",
      type: "uncaughtException",
    },
    extra: {
      crashedAt: new Date().toISOString(),
      pid: process.pid,
    },
  });

  await Sentry.flush(5000);
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection:", reason);

  Sentry.captureException(reason, {
    level: "fatal",
    tags: { 
      service: "weather-cron", 
      event: "crash",
      type: "unhandledRejection",
    },
    extra: {
      crashedAt: new Date().toISOString(),
      pid: process.pid,
    },
  });

  await Sentry.flush(5000);
  process.exit(1);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// 수동 실행 모드
async function executeManually() {
  const executionId = Date.now();
  const startTime = new Date();

  console.log("🔧 매뉴얼 날씨 데이터 수집 시작...");
  console.log(`[${startTime.toISOString()}] Execution ID: ${executionId}`);

  try {
    console.log("Step 1: Processing weather data...");
    await processDataAndWriteToFile(CAPITAL_LOCATION, minute);

    console.log("Step 2: Merging objects and stats...");
    await getAllMergedObjAndSaveFile(CAPITAL_LOCATION);

    console.log("Step 3: Writing total POP data...");
    await writeTotalPOPDataToFile("totalOfAllArea", "POPstats", CAPITAL_LOCATION);

    console.log("Step 4: Inserting weather data to DB...");
    await getWeatherDataInsertToDB(CAPITAL_LOCATION);

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
