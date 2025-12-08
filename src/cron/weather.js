const { createMonitoredCronJob } = require("../utils/cron-runner");
const { CAPITAL_LOCATION } = require("../config/locations");
const { CRON, SENTRY, DATA_FILES } = require("../config/constants");
const { processDataAndWriteToFile } = require("../services/weather/process");
const { getAllMergedObjAndSaveFile } = require("../services/stats/merged");
const { getWeatherDataInsertToDB } = require("../services/weather/db");
const { writeTotalPOPDataToFile } = require("../services/stats/total");

const WEATHER_PIPELINE = [
  {
    name: "Processing weather data",
    nameKo: "날씨 데이터 처리",
    execute: () =>
      processDataAndWriteToFile(CAPITAL_LOCATION, CRON.WEATHER.MINUTE),
  },
  {
    name: "Merging objects and stats",
    nameKo: "객체 병합 및 통계 저장",
    execute: () => getAllMergedObjAndSaveFile(CAPITAL_LOCATION),
  },
  {
    name: "Writing total POP data",
    nameKo: "전체 POP 데이터 저장",
    execute: () =>
      writeTotalPOPDataToFile(
        DATA_FILES.TOTAL_AREA,
        DATA_FILES.POP_STATS,
        CAPITAL_LOCATION
      ),
  },
  {
    name: "Inserting weather data to DB",
    nameKo: "DB 삽입",
    execute: () => getWeatherDataInsertToDB(CAPITAL_LOCATION),
  },
];

const { job, gracefulShutdown, executeManually } = createMonitoredCronJob({
  pipeline: WEATHER_PIPELINE,
  schedule: CRON.WEATHER,
  monitor: SENTRY.WEATHER,
  extraData: { location: "CAPITAL_LOCATION" },
});

if (process.argv.includes("--manual")) {
  executeManually()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { executeManually, gracefulShutdown };
