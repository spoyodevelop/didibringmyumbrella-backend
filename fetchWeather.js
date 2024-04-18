const { XMLParser } = require("fast-xml-parser");
const { fetchClientLocationsData } = require("./locationMapping");

const { getTimeObj, getUrl } = require("./getUrlAndTimeObj");
const { DUMMY_CAPITAL } = require("./locations");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;

async function fetchWeatherDataWithRetry(usage, dataType, location, delay) {
  const maxTries = 10;

  for (let tries = 1; tries <= maxTries; tries++) {
    try {
      if (tries === 1) {
        console.log(`fetching Weather Data... this is first try....`);
      } else {
        console.log(
          `fetching weather data... this is ${tries} tries and ${
            maxTries - tries
          } tries remaining`
        );
      }
      const weatherData = await fetchWeatherData(usage, dataType, location);

      return weatherData;
    } catch (error) {
      if (tries === maxTries) {
        throw new Error(
          `Failed to fetch data for ${location.administrativeArea} after ${maxTries} attempts. Error: ${error.message}`
        );
      }

      // Exponentially increase delay
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for the next retry
    }
  }
}

async function fetchWeatherData(usage, dataType, location) {
  const timeObj = getTimeObj(usage, dataType);
  const url = getUrl(location, timeObj);
  console.log(url);

  try {
    // Configure axios retry. which is pretty mucccchhhh useless now.
    axiosRetry(axios, {
      retries: 10,
      retryDelay: (...args) => axiosRetry.exponentialDelay(...args, 2000),
      onRetry: (retryCount, error, requestConfig) => {
        console.log(`retry count: `, retryCount);
      },
    });

    // Fetch weather data
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
    console.error("An error occurred while fetching weather data:", error);
    throw error; // Re-throw the error to propagate it
  }
}

// DUMMY_CAPITAL.forEach((capital) => {
//   fetchWeatherDataWithRetry("DB", "currentData", capital, 1000).then((data) =>
//     console.log(data)
//   );
// });

//TODO server-side와 client-side 분리하기
//mongodb 와 연결하는 파일 따로 만들기.

// locations.forEach((location) => {
// mergeLocationsData(CAPITAL_LOCATION, location).then((mergedLocation) => {
//   // fetchWeatherData("client", "pastData", mergedLocation).then((data) =>
//   //   console.log(data)
//   // );
//   fetchWeatherData("client", "currentData", mergedLocation).then((data) =>
//     console.log(data)
//   );
// fetchWeatherData("DB", "pastData", mergedLocation).then((data) =>
//   console.log(data)
// );
// fetchWeatherData("DB", "currentData", mergedLocation).then((data) =>
//   console.log(data)
// );
//     });
//   });
// });
// fetchLocationsData().then((locations) => {
//   locations.forEach((location) => {
//     console.log(location);
//     mergeLocationsData(location).then((mergedLocation) =>
//       console.log(mergedLocation)
//     );
//   });
// });

// fetchLocationsData().then((locations) =>
//   locations.forEach((location) => {
//     console.log(location);
//     console.log(getLocationObj("client", location));
//   })
// );
module.exports = {
  fetchWeatherDataWithRetry,
};
