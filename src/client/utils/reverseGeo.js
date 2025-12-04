const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const { dfs_xy_conv } = require("../../utils/position");
const { CAPITAL_LOCATION } = require("../../config/locations");
require("dotenv").config();

const naverAPIClientID = process.env.NAVER_CLIENT_ID;
const naverAPIClientSecret = process.env.NAVER_CLIENT_SECRET;

/**
 * 네이버 API를 이용한 역지오코딩
 * @param {Object} location - { place, latitude, longitude }
 * @returns {Object} 변환된 좌표와 행정구역 정보
 */
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

/**
 * 위치 데이터 병합
 */
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

/**
 * 클라이언트용 위치 데이터 가져오기
 * @param {Object} position - { place, latitude, longitude }
 */
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
    throw error;
  }
}

module.exports = {
  reverseGeocode,
  mergeLocationsData,
  fetchClientLocationData,
};

