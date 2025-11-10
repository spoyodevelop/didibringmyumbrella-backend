const schedule = require("node-schedule");
const Sentry = require("@sentry/node");
require("dotenv").config();

// Sentry 초기화
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: 1.0,
});

const { CAPITAL_LOCATION } = require("./locations.js");
const { processDataAndWriteToFile } = require("./processWeatherDataAndSave.js");
const { getAllMergedObjAndSaveFile } = require("./getMergedObjAndStats.js");
const {
  getWeatherDataInsertToDB,
} = require("./getWeatherDataAndInsertToDB.js");
const { writeTotalPOPDataToFile } = require("./getTotalPOPdata.js");

console.log("starting job....");
Sentry.captureMessage("날씨 크론잡이 시작되었습니다", {
  level: "info",
  tags: { service: "weather-cron" },
});

const minute = 15;

const job = schedule.scheduleJob(
  `${minute} 3,6,9,12,15,18,21,0 * * *`,
  async function () {
    const executionId = Date.now();
    const startTime = new Date();

    console.log(`[${startTime.toISOString()}] Cron job execution started`);
    Sentry.captureMessage("크론잡 실행이 시작되었습니다", {
      level: "info",
      tags: {
        service: "weather-cron",
        executionId: executionId.toString(),
      },
    });

    try {
      console.log("Step 1: Processing weather data...");
      await processDataAndWriteToFile(CAPITAL_LOCATION, minute);
      Sentry.captureMessage("날씨 데이터 처리가 완료되었습니다", {
        level: "info",
        tags: { service: "weather-cron", step: "processData" },
      });

      
      console.log("Step 2: Merging objects and stats...");
      await getAllMergedObjAndSaveFile(CAPITAL_LOCATION);
      Sentry.captureMessage("객체 병합 및 통계 저장이 완료되었습니다", {
        level: "info",
        tags: { service: "weather-cron", step: "mergeStats" },
      });

      
      console.log("Step 3: Writing total POP data...");
      await writeTotalPOPDataToFile(
        "totalOfAllArea",
        "POPstats",
        CAPITAL_LOCATION
      );
      Sentry.captureMessage("전체 강수확률 데이터 저장이 완료되었습니다", {
        level: "info",
        tags: { service: "weather-cron", step: "totalPOP" },
      });

      console.log("Step 4: Inserting weather data to DB...");
      await getWeatherDataInsertToDB(CAPITAL_LOCATION);
      Sentry.captureMessage("DB에 날씨 데이터 삽입이 완료되었습니다", {
        level: "info",
        tags: { service: "weather-cron", step: "insertDB" },
      });

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(
        `[${endTime.toLocaleDateString('ko-KR')}] Cron job completed successfully (${duration}s)`
      );
      Sentry.captureMessage("크론잡이 성공적으로 완료되었습니다", {
        level: "info",
        tags: {
          service: "weather-cron",
          executionId: executionId.toString(),
        },
        extra: {
          duration: `${duration}s`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error processing weather data:", error);

      // Sentry로 상세한 에러 전송
      Sentry.captureException(error, {
        level: "error",
        tags: {
          service: "weather-cron",
          executionId: executionId.toString(),
          minute: minute,
        },
        extra: {
          location: "CAPITAL_LOCATION",
          timestamp: new Date().toISOString(),
          startTime: startTime.toISOString(),
          errorMessage: error.message,
          errorStack: error.stack,
        },
      });

      // 에러 전송 완료 대기
      await Sentry.flush(2000);
    }
  }
);
