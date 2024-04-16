const fs = require("fs");
const { formatPlusOneHour } = require("./dateFormatting");
const { DUMMY_CAPITAL, CAPITAL_LOCATION } = require("./locations");
const { fetchWeatherData } = require("./fetchWeather");
const { basename } = require("path");

async function processLocationData(CAPITALS) {
  try {
    const dataPromises = CAPITALS.map(async (capital) => {
      try {
        const currentData = await fetchWeatherData(
          "DB",
          "currentData",
          capital
        );

        const pastData = await fetchWeatherData("DB", "pastData", capital);

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
                nx,
                ny,
              } = item;
              acc[item.category + item.fcstTime] = {
                baseDate,
                baseTime,
                category,
                fcstDate,
                fcstTime,
                fcstValue,
                nx,
                ny,
              };
              return acc;
            }, {});
        }
        const PTY = filterAndMapItems(currentData, "PTY");
        const POP = filterAndMapItems(pastData, "POP");
        return { capital, ...PTY, ...POP };
      } catch (error) {
        console.error("Error processing data for capital", capital, error);
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

processLocationData(CAPITAL_LOCATION)
  .then((data) => console.log("Data processed:", data))
  .catch((error) => console.error("Error in processing location data", error));
