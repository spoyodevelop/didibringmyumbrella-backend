const schedule = require("node-schedule");
const Sentry = require("@sentry/node");
require("dotenv").config();

// Sentry 초기화 - 에러만 추적
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: 0.1, // 샘플링 레이트 낮춤
  maxBreadcrumbs: 50, // Breadcrumb 최대 개수
});

const { CAPITAL_LOCATION } = require("./locations.js");
const { processDataAndWriteToFile } = require("./processWeatherDataAndSave.js");
const { getAllMergedObjAndSaveFile } = require("./getMergedObjAndStats.js");
const {
  getWeatherDataInsertToDB,
} = require("./getWeatherDataAndInsertToDB.js");
const { writeTotalPOPDataToFile } = require("./getTotalPOPdata.js");

console.log("starting job....");

const minute = 15;

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
        checkinMargin: 5, // 5분 마진
        maxRuntime: 10, // 최대 10분
        timezone: "Asia/Seoul",
      }
    );

    // Breadcrumb으로 로그 (쿼터 안 먹음!)
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
      // Step 1: 날씨 데이터 처리 및 파일 저장
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

      // Step 2: 병합된 객체와 통계 저장
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

      // Step 3: 전체 POP 데이터 저장
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

      // Step 4: DB에 날씨 데이터 삽입
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

      // 완료
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(
        `[${endTime.toISOString()}] ✅ Cron job completed successfully (${duration}s)`
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

      // 에러만 Sentry로 전송 (위의 Breadcrumb들이 자동으로 함께 전송됨)
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

      // 에러 전송 완료 대기
      await Sentry.flush(2000);
    }
  }
);

console.log(
  `✅ Cron job scheduled: ${minute} minutes past 3,6,9,12,15,18,21,0 hours`
);
