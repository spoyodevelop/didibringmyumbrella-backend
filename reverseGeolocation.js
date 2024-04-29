const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const { dfs_xy_conv } = require("./positionFormatting");
require("dotenv").config();
const naverAPIClientID = process.env.NAVER_CLIENT_ID;

const naverAPIClientSecret = process.env.NAVER_CLIENT_SECRET;
const {
  DUMMY_CAPITAL,
  DUMMY_POSITION,
  CAPITAL_LOCATION,
} = require("./locations");
async function reverseGeocode(location) {
  const { place, latitude, longitude } = location;
  const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&orders=legalcode&output=json`;
  const headers = {
    "X-NCP-APIGW-API-KEY-ID": naverAPIClientID,
    "X-NCP-APIGW-API-KEY": naverAPIClientSecret,
  };
  try {
    axiosRetry(axios, { retries: 3 });
    const response = await axios.get(url, { headers });
    const data = response.data;
    const region = data.results[0].region;
    const { x: convertedX, y: convertedY } = dfs_xy_conv(
      "toXY",
      latitude,
      longitude
    );

    return {
      convertedX,
      convertedY,
      administrativeAreaKorean: region.area1?.name,
      area2: region.area2?.name,
      area3: region.area3?.name,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

async function mergeLocationsData(capitalLocationData, locationData) {
  const matchedPlace = capitalLocationData.filter(
    (capital) =>
      capital.administrativeAreaKorean === locationData.administrativeAreaKorean
  );
  const matchedLocation = matchedPlace.length > 0 ? matchedPlace[0] : {};
  return {
    ...matchedLocation,
    ...locationData,
  };
}

async function fetchClientLocationData(position) {
  try {
    const locationData = await reverseGeocode(position);
    const mergedLocationsData = await mergeLocationsData(
      CAPITAL_LOCATION,
      locationData
    );

    return mergedLocationsData;
  } catch (error) {
    console.error("Error in fetchLocationsData:", error);
    throw error; // Pass the error to the caller
  }
}

module.exports = { fetchClientLocationData };
