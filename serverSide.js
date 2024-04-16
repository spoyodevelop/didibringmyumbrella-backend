const fs = require("fs");
const { formatPlusOneHour } = require("./dateFormatting");
const { DUMMY_CAPITAL } = require("./locations");
const { fetchWeatherData } = require("./fetchWeather");

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
        const { hour, koreanName } = currentData;
        const fcstTime = formatPlusOneHour(hour);
        const PTY = currentData.item.find((item) => item.category === "PTY");
        const POP = pastData.item.find((item) => item.category === "POP");

        return { capital, koreanName, currentData, pastData, PTY, POP };
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

processLocationData(DUMMY_CAPITAL)
  .then((data) => console.log("Data processed:", data))
  .catch((error) => console.error("Error in processing location data", error));
