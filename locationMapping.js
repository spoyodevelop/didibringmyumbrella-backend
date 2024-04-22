const { dfs_xy_conv } = require("./positionFormatting");
require("dotenv").config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// const { GOOGLE_API_KEY } = require("./majorKeys");
const { DUMMY_POSITION, CAPITAL_LOCATION } = require("./locations");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;

async function positionToLocation(location) {
  try {
    const { place, latitude, longitude } = location;
    const fetchUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
    axiosRetry(axios, { retries: 3 });
    const response = await axios.get(fetchUrl);

    if (!response.data) {
      throw new Error("Failed to fetch geocode data");
    }

    const data = response.data;
    const firstResult = data.results[0];

    let administrativeArea;
    firstResult.address_components.forEach((component) => {
      if (
        component.types.includes("administrative_area_level_1") &&
        component.types.includes("political")
      ) {
        administrativeArea = component.long_name;
      }
    });

    if (!administrativeArea) {
      throw new Error("Administrative area not found");
    }

    const { x: convertedX, y: convertedY } = dfs_xy_conv(
      "toXY",
      latitude,
      longitude
    );
    const formattedAddress = firstResult.formatted_address;

    return {
      place,
      administrativeArea,
      formattedAddress,
      convertedX,
      convertedY,
    };
  } catch (error) {
    console.error("Error in positionToLocation:", error);
    throw error; // Pass the error to the caller
  }
}

async function mergeLocationsData(capitalLocationData, locationData) {
  const matchedPlace = capitalLocationData.filter(
    (capital) => capital.administrativeArea === locationData.administrativeArea
  );
  const matchedLocation = matchedPlace.length > 0 ? matchedPlace[0] : {};
  return {
    ...matchedLocation,
    ...locationData,
  };
}

async function fetchClientLocationData(position) {
  try {
    const locationsData = await positionToLocation(position);
    const mergedLocationsData = await mergeLocationsData(
      CAPITAL_LOCATION,
      locationsData
    );

    return mergedLocationsData;
  } catch (error) {
    console.error("Error in fetchLocationsData:", error);
    throw error; // Pass the error to the caller
  }
}

module.exports = {
  fetchClientLocationData,
};
