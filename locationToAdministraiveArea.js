const { dfs_xy_conv } = require("./positionFormatting");
const { GOOGLE_API_KEY } = require("./majorKeys");
const { DUMMY_LOCATION } = require("./locations");
async function locationToAdministrativeArea(locations) {
  try {
    const promises = locations.map(async (location) => {
      const { place, latitude, longitude } = location;
      const fetchUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch geocode data");
      }
      const data = await response.json();
      const firstResult = data.results[0];
      const { x: convertedX, y: convertedY } = dfs_xy_conv(
        "toXY",
        latitude,
        longitude
      );
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

      const formattedAddress = firstResult.formatted_address;
      return {
        place,
        administrativeArea,
        formattedAddress,
        convertedX,
        convertedY,
      };
    });

    return Promise.all(promises);
  } catch (error) {
    console.error("Error in locationToAdministrativeArea:", error);
    throw error; // Pass the error to the caller
  }
}

async function fetchLocationsData() {
  try {
    const locationsData = await locationToAdministrativeArea(DUMMY_LOCATION);
    return locationsData;
  } catch (error) {
    console.error("Error in fetchLocationsData:", error);
    throw error; // Pass the error to the caller
  }
}

module.exports = {
  fetchLocationsData,
};
