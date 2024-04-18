const fs = require("fs");
const {
  formatPlusOneHour,
  JSDateToConvertedDate,
  baseTimes,
} = require("./dateFormatting.js");
const { DUMMY_CAPITAL, CAPITAL_LOCATION } = require("./locations.js");
const { fetchWeatherDataWithRetry } = require("./fetchWeather.js");

async function processWeatherData(CAPITALS) {
  try {
    const dataPromises = CAPITALS.map(async (capital) => {
      try {
        console.log(`fetchingData`);
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
        const convertedDate = JSDateToConvertedDate(newDate);
        const { hour } = currentData;
        const fcstTime = formatPlusOneHour(hour);

        //this code stinks!
        function filterAndMapItems(data, category) {
          return data.item
            .filter((item) => item.category === category)
            .reduce((acc, item) => {
              const {
                baseDate,
                baseTime,
                category,
                fcstDate,
                fcstTime,
                fcstValue,
                obsrValue,
                nx,
                ny,
              } = item;

              acc[item.category + item.baseTime] = {
                baseDate,
                baseTime,
                category,
                fcstDate,
                fcstTime,
                fcstValue,
                obsrValue,
                nx,
                ny,
              };
              return acc;
            }, {});
        }
        const RN1 = filterAndMapItems(currentData, "RN1");
        const PTY = filterAndMapItems(currentData, "PTY");
        const POP = filterAndMapItems(pastData, "POP");
        const message = `${capital.koreanName} 의 데이터를 ${convertedDate}에 가져왔습니다.`;
        console.log(message);
        return { date: newDate, message, capital, ...PTY, ...POP, ...RN1 };
      } catch (error) {
        console.error(
          "Error fetching weather data for capital",
          capital,
          error
        );
        return { capital, error };
      }
    });

    const processedData = await Promise.all(dataPromises);

    // Write data to file
    await writeDataToFile(processedData);

    return processedData;
  } catch (error) {
    console.error("Error processing location data", error);
    throw error;
  }
}

async function writeDataToFile(data) {
  try {
    // Read existing data from file
    const existingData = require("./data/data.js");
    // Push new data into existing array
    existingData.weatherData.push(...data);

    // Write updated data back to file
    fs.writeFileSync(
      "./data/data.js",
      `module.exports = ${JSON.stringify(existingData)};`
    );

    console.log("Data written to file successfully");
  } catch (error) {
    console.error("Error writing data to file", error);
    throw error;
  }
}

module.exports = { processWeatherData };
