const { XMLParser } = require("fast-xml-parser");
const { getTimeObj, getUrl } = require("../../utils/url");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;

async function fetchWeatherDataWithRetry(usage, dataType, location, delay) {
  const maxTries = 10;

  for (let tries = 1; tries <= maxTries; tries++) {
    try {
      if (tries === 1) {
        console.log(
          `Fetching weather data for ${location.administrativeArea}... (first try)`
        );
      } else {
        console.log(
          `Retrying weather data for ${location.administrativeArea}... (attempt ${tries}/${maxTries})`
        );
      }
      const weatherData = await fetchWeatherData(usage, dataType, location);

      return weatherData;
    } catch (error) {
      if (tries === maxTries) {
        const finalError = new Error(
          `Failed to fetch data for ${location.administrativeArea} after ${maxTries} attempts. Error: ${error.message}`
        );
        console.error(finalError.message);
        throw finalError;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

async function fetchWeatherData(usage, dataType, location) {
  const timeObj = getTimeObj(usage, dataType);
  const url = getUrl(location, timeObj);
  console.log(url);

  try {
    axiosRetry(axios, {
      retries: 10,
      retryDelay: (...args) => axiosRetry.exponentialDelay(...args, 2000),
      onRetry: (retryCount, error, requestConfig) => {
        console.log(
          `Axios retry count: ${retryCount} for ${location.administrativeArea}`
        );
      },
    });

    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch data from ${url}. Status: ${response.status}`
      );
    }

    const xmlData = await response.data;
    const parser = new XMLParser();
    let jObj = parser.parse(xmlData);

    if (!jObj || !jObj.response) {
      throw new Error(
        `Failed to fetch data for ${location.administrativeArea}. it has no jObj or jObj response`
      );
    }
    if (!jObj.response.header) {
      throw new Error(
        `Failed to fetch data for ${location.administrativeArea}. it has no header.`
      );
    }
    if (
      isNaN(jObj.response.header.resultCode) ||
      +jObj.response.header.resultCode !== 0
    ) {
      throw new Error(
        `Failed to fetch data for ${location.administrativeArea}. Errors are ${jObj.response.header.resultCode} ${jObj.response.header.resultMsg}.`
      );
    }

    const newDate = new Date();
    const items = jObj.response.body.items;

    return {
      newDate,
      dataType,
      usage,
      url,
      location,
      timeObj,
      ...items,
    };
  } catch (error) {
    console.error(
      `Error fetching weather data for ${location.administrativeArea}:`,
      error.message
    );
    throw error;
  }
}

module.exports = {
  fetchWeatherDataWithRetry,
};

