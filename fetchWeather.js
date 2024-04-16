const { XMLParser } = require("fast-xml-parser");
const { fetchClientLocationsData } = require("./locationMapping");

const { getTimeObj, getUrl } = require("./getUrlAndTimeObj");
const { DUMMY_CAPITAL } = require("./locations");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
async function fetchWeatherData(usage, dataType, location) {
  const timeObj = getTimeObj(dataType);
  const url = getUrl(usage, location, timeObj);
  try {
    axiosRetry(axios, {
      retries: 10,
      retryDelay: (...arg) => axiosRetry.exponentialDelay(...arg, 1000),
      onRetry: (retryCount, error, requestConfig) => {
        console.log(`retry count: `, retryCount);
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

    if (!jObj.response.body) {
      throw new Error(
        `Failed to fetch weather data for ${location}. Body does not exist in response.`
      );
    }
    const items = jObj.response.body.items;
    return {
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
  fetchWeatherData,
};
