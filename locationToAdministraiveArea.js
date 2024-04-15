const { dfs_xy_conv } = require("./positionFormatting");
const { GOOGLE_API_KEY } = require("./majorKeys");
const DUMMY_LOCATION = [
  {
    place: "남산타워",
    latitude: 37.5515,
    longitude: 126.988,
  },
  {
    place: "해운대해수욕장",
    latitude: 35.1585,
    longitude: 129.1603,
  },
  {
    place: "동성로",
    latitude: 35.8692,
    longitude: 128.6014,
  },
  // {
  //   place: "인천 차이나타운",
  //   latitude: 37.4765,
  //   longitude: 126.6235,
  // },
  // {
  //   place: "광주 518 기념공원",
  //   latitude: 35.1469,
  //   longitude: 126.8754,
  // },
  // {
  //   place: "대전 엑스포 공원",
  //   latitude: 36.3622,
  //   longitude: 127.3832,
  // },
  // {
  //   place: "울산 대왕암공원",
  //   latitude: 35.5473,
  //   longitude: 129.317,
  // },
  // {
  //   place: "세종 호수공원",
  //   latitude: 36.4879,
  //   longitude: 127.2495,
  // },
  // {
  //   place: "에버랜드",
  //   latitude: 37.2935,
  //   longitude: 127.202,
  // },
  // {
  //   place: "남이섬",
  //   latitude: 37.7979,
  //   longitude: 127.6392,
  // },
  // {
  //   place: "청주 청남대",
  //   latitude: 36.6421,
  //   longitude: 127.4885,
  // },
  // {
  //   place: "대천 해수욕장",
  //   latitude: 36.3299,
  //   longitude: 126.4122,
  // },
  // // {
  // //   place: "전주 한옥마을",
  // //   latitude: 35.8142,
  // //   longitude: 127.1522,
  // // },
  // {
  //   place: "여수 바다목장",
  //   latitude: 34.7569,
  //   longitude: 127.7444,
  // },
  // {
  //   place: "경주 석굴암",
  //   latitude: 35.7935,
  //   longitude: 129.3602,
  // },
  // {
  //   place: "통영",
  //   latitude: 34.8502,
  //   longitude: 128.4338,
  // },
  // {
  //   place: "성산일출봉",
  //   latitude: 33.4596,
  //   longitude: 126.9428,
  // },
];

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
