const fs = require("fs");
const Sentry = require("@sentry/node");
const {
  formatPlusOneHour,
  JSDateToConvertedDate,
  baseTimes,
} = require("./dateFormatting.js");
const { DUMMY_CAPITAL, CAPITAL_LOCATION } = require("./locations.js");
const { fetchWeatherDataWithRetry } = require("./fetchWeather.js");

async function processWeatherData(CAPITALS, fetchingMinute) {
  try {
    const dataPromises = CAPITALS.map(async (capital) => {
      try {
        const { administrativeArea, koreanName } = capital;
        console.log(`${koreanName}의 데이터를 가져옵니다....`);
        Sentry.captureMessage(`${koreanName}의 데이터를 가져오는 중입니다`, {
          level: "info",
          tags: { service: "weather-processor", location: koreanName },
        });

        const currentData = await fetchWeatherDataWithRetry(
          "DB",
          "currentData",
          capital,
          2000
        );
        const pastData = await fetchWeatherDataWithRetry(
          "DB",
          "pastData",
          capital,
          2000
        );

        const newDate = new Date();
        function createBaseDate(fetchingMinute) {
          const date = new Date();
          date.setMinutes(fetchingMinute);
          date.setSeconds(0);
          date.setMilliseconds(0);
          return date;
        }

        const convertedDate = JSDateToConvertedDate(newDate);
        const baseDate = createBaseDate(fetchingMinute);

        const filterAndMapItems = (data, category) => {
          return data.item
            .filter((item) => item.category === category)
            .reduce((acc, item) => {
              acc[item.category] = { ...item };
              return acc;
            }, {});
        };

        const RN1 = filterAndMapItems(currentData, "RN1");
        const PTY = filterAndMapItems(currentData, "PTY");
        const POP = filterAndMapItems(pastData, "POP");

        const message = `${koreanName}의 데이터를 ${convertedDate}에 가져왔습니다.`;

        const mergedObj = {
          baseDate,
          POP: POP.POP.fcstValue,
          PTY: PTY.PTY.obsrValue,
          RN1: RN1.RN1.obsrValue,
          didItRain: PTY.PTY.obsrValue > 0,
        };
        return {
          date: newDate,
          mergedObj,
          message,
          capital,
          administrativeArea,
          ...PTY,
          ...POP,
          ...RN1,
        };
      } catch (error) {
        console.error(
          "Error fetching weather data for capital",
          capital,
          error
        );
        Sentry.captureException(error, {
          level: "error",
          tags: {
            service: "weather-processor",
            location: capital.koreanName,
            step: "fetchCapitalData",
          },
          extra: { capital },
        });
        throw error;
      }
    });

    const processedData = await Promise.all(dataPromises);
    return processedData;
  } catch (error) {
    console.error("Error processing location data", error);
    Sentry.captureException(error, {
      level: "error",
      tags: { service: "weather-processor", step: "processLocationData" },
    });
    throw error;
  }
}

async function writeDataToFile(data, destination, fileName) {
  try {
    const existingData = require(`./data/${destination}/${fileName}.js`);
    existingData.weatherData.push(data);

    fs.writeFileSync(
      `./data/${destination}/${fileName}.js`,
      `module.exports = ${JSON.stringify(existingData)};`
    );

    console.log("Data written to file successfully");
    Sentry.captureMessage("파일에 데이터가 성공적으로 저장되었습니다", {
      level: "info",
      tags: { service: "weather-processor", destination, fileName },
    });
  } catch (error) {
    console.error("Error writing data to file", error);
    Sentry.captureException(error, {
      level: "error",
      tags: { service: "weather-processor", step: "writeFile", destination },
    });
    throw error;
  }
}

async function processDataAndWriteToFile(capital, fetchingMinutes) {
  try {
    const processedData = await processWeatherData(capital, fetchingMinutes);

    const promises = processedData.map((data) =>
      writeDataToFile(data, data.administrativeArea, "weatherData")
    );

    await Promise.all(promises);

    console.log("All data has been written to files successfully.");
    Sentry.captureMessage("모든 데이터가 파일에 성공적으로 저장되었습니다", {
      level: "info",
      tags: { service: "weather-processor", step: "complete" },
    });
  } catch (error) {
    console.error("Error processing weather data:", error);
    Sentry.captureException(error, {
      level: "error",
      tags: { service: "weather-processor", step: "processAndWrite" },
    });
  }
}

module.exports = { processDataAndWriteToFile };
