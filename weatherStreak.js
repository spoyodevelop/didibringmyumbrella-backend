//1. 중기 데이터를 가져온다.
//2. 단기 데이터를 가져온다.
//3. 이 일을 1시간 마다 한번씩 한다.
const { XMLParser } = require("fast-xml-parser");
const { fetchLocationsData } = require("./locationToAdministraiveArea");
const {
  getPastFormattedHour,
  getCurrentBaseDate,
  formatPlusOneHour,
} = require("./dateFormatting");
const { KOREA_METEOROLOGICAL_API_KEY } = require("./majorKeys");

const locations = [
  {
    administrativeArea: "Seoul",
    capitalNX: 60,
    capitalNY: 127,
    koreanName: "서울",
  },
  {
    administrativeArea: "Busan",
    capitalNX: 98,
    capitalNY: 76,
    koreanName: "부산",
  },
  {
    administrativeArea: "Daegu",
    capitalNX: 89,
    capitalNY: 90,
    koreanName: "대구",
  },
  {
    administrativeArea: "Incheon",
    capitalNX: 55,
    capitalNY: 124,
    koreanName: "인천",
  },
  {
    administrativeArea: "Gwangju",
    capitalNX: 58,
    capitalNY: 74,
    koreanName: "광주",
  },
  {
    administrativeArea: "Daejeon",
    capitalNX: 67,
    capitalNY: 100,
    koreanName: "대전",
  },
  {
    administrativeArea: "Ulsan",
    capitalNX: 102,
    capitalNY: 84,
    koreanName: "울산",
  },
  {
    administrativeArea: "Sejong-si",
    capitalNX: 66,
    capitalNY: 103,
    koreanName: "세종",
  },
  {
    administrativeArea: "Gyeonggi-do",
    capitalNX: 60,
    capitalNY: 120,
    koreanName: "경기도",
  },
  {
    administrativeArea: "Gangwon-do",
    capitalNX: 73,
    capitalNY: 134,
    koreanName: "강원도",
  },
  {
    administrativeArea: "Chungcheongbuk-do",
    capitalNX: 69,
    capitalNY: 107,
    koreanName: "충청북도",
  },
  {
    administrativeArea: "Chungcheongnam-do",
    capitalNX: 68,
    capitalNY: 100,
    koreanName: "충청남도",
  },
  {
    administrativeArea: "Jeollabuk-do",
    capitalNX: 63,
    capitalNY: 89,
    koreanName: "전라북도",
  },
  {
    administrativeArea: "Jeollanam-do",
    capitalNX: 51,
    capitalNY: 67,
    koreanName: "전라남도",
  },
  {
    administrativeArea: "Gyeongsangbuk-do",
    capitalNX: 89,
    capitalNY: 91,
    koreanName: "경상북도",
  },
  {
    administrativeArea: "Gyeongsangnam-do",
    capitalNX: 91,
    capitalNY: 77,
    koreanName: "경상남도",
  },
  {
    administrativeArea: "Jeju-do",
    capitalNX: 52,
    capitalNY: 38,
    koreanName: "제주",
  },
];
async function mergeLocationsData(locationData) {
  const matchedPlace = locations.filter(
    (location) =>
      location.administrativeArea === locationData.administrativeArea
  );
  const matchedLocation = matchedPlace.length > 0 ? matchedPlace[0] : {};
  // console.log(matchedLocation);
  // console.log(locationData);
  const { capitalNX, capitalNY, koreanName, administrativeArea } =
    matchedLocation;
  return {
    capitalNX,
    capitalNY,
    koreanName,
    administrativeArea,
    ...locationData,
  };
}

function dummyDataGen() {
  // 배열을 담을 변수를 선언합니다.
  const timeArray = [];

  // 시작 시간과 종료 시간을 정의합니다.
  const startTime = new Date();
  startTime.setHours(22, 0, 0); // 22:00:00

  const endTime = new Date();
  endTime.setHours(23, 59, 59); // 23:59:59
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  // 시작 시간부터 종료 시간까지의 시간 객체를 배열에 추가합니다.
  let currentTime = new Date(startTime); // 시작 시간으로 초기화
  while (currentTime <= endTime) {
    timeArray.push(new Date(currentTime).toLocaleDateString("ko-KR", options)); // 현재 시간을 배열에 추가
    currentTime.setMinutes(currentTime.getMinutes() + 1); // 1분씩 증가
  }

  // 결과 출력
  return timeArray;
}
function getTimeObj(dataType) {
  let year, month, day, hour, minute;

  if (dataType === "currentData") {
    ({ year, month, day, hour, minute } = getPastFormattedHour(1, true));
  } else if (dataType === "pastData") {
    ({ year, month, day, hour, minute } = getCurrentBaseDate());
  }
  return { dataType, year, month, day, hour, minute };
}
function getLocationObj(usage, location) {
  let capitalNX,
    capitalNY,
    administrativeArea,
    convertedX,
    convertedY,
    koreanName,
    place;

  if (usage === "client") {
    ({
      administrativeArea,
      koreanName,
      place,
      formattedAddress,
      convertedX,
      convertedY,
      capitalNX,
      capitalNY,
    } = location);
    return {
      usage,
      administrativeArea,
      koreanName,
      place,
      formattedAddress,
      convertedX,
      convertedY,
      capitalNX,
      capitalNY,
    };
  }
  if (usage === "DB") {
    ({ capitalNX, capitalNY, administrativeArea, koreanName } = location);
    console.log(location);
    return {
      usage,
      capitalNX,
      capitalNY,
      administrativeArea,
      koreanName,
    };
  }
}
function getUrlAndMergedObject(locationObj, timeObj) {
  let url;
  const { usage, administrativeArea, koreanName } = locationObj;
  let capitalNX, capitalNY, convertedX, convertedY;

  if (usage === "client") {
    ({ convertedX, convertedY, capitalNX, capitalNY, place, formattedAddress } =
      locationObj);
  } else if (usage === "DB") {
    ({ capitalNX, capitalNY } = locationObj);
  }
  // console.log(locationObj);

  const { dataType, year, month, day, hour, minute } = timeObj;

  if (dataType === "pastData") {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  } else {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  }

  return {
    usage,
    url,
    year,
    month,
    day,
    hour,
    minute,
    capitalNX,
    capitalNY,
    administrativeArea,
    koreanName,
    place: usage === "DB" ? koreanName : place,
    formattedAddress: usage === "DB" ? koreanName : place,
    convertedX: usage === "DB" ? capitalNX : convertedX,
    convertedY: usage === "DB" ? capitalNY : convertedY,
  };
}

async function fetchWeatherData(usage, dataType, location) {
  const locationObj = getLocationObj(usage, location);
  console.log(locationObj);
  const timeObj = getTimeObj(dataType);
  const urlAndMergedObj = getUrlAndMergedObject(locationObj, timeObj);
  // console.log(urlAndMergedObj);
  const { url } = urlAndMergedObj;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}`);
    }
    const xmlData = await response.text();
    const parser = new XMLParser();
    let jObj = parser.parse(xmlData);

    if (!jObj.response.body) {
      throw new Error("Failed to fetch weather data. body does not exist.");
    }
    const items = jObj.response.body.items;
    return {
      dataType,
      urlAndMergedObj,
      ...items,
    };
  } catch (error) {
    console.error("Error fetching data weatherData:", error);
    throw error;
  }
}

async function processLocationData() {
  try {
    const locationData = await mergeLocationsData();

    const results = [];

    // Use Promise.all to await all asynchronous operations concurrently
    await Promise.all(
      locationData.map(async (location) => {
        const currentItems = await fetchWeatherData("client", location);
        const pastItems = await fetchWeatherData("pastData", location);
        const { hour } = currentItems;
        const fcstTime = formatPlusOneHour(hour);

        const PTY = currentItems.item.find(
          (item) => item.category === "PTY" && item.fcstTime === fcstTime
        );
        const POP = pastItems.item.find((item) => item.category === "POP");

        results.push({ ...location, PTY, POP });
      })
    );

    return results;
  } catch (error) {
    console.error("Error in processLocationData:", error);
    throw error;
  }
}
//TODO server-side와 client-side 분리하기
//mongodb 와 연결하는 파일 따로 만들기.

fetchLocationsData().then((locations) => {
  locations.forEach((location) => {
    mergeLocationsData(location).then((mergedLocation) => {
      fetchWeatherData("client", "pastData", mergedLocation).then((data) =>
        console.log(data)
      );
      fetchWeatherData("client", "currentData", mergedLocation).then((data) =>
        console.log(data)
      );
      fetchWeatherData("DB", "pastData", mergedLocation).then((data) =>
        console.log(data)
      );
      fetchWeatherData("DB", "currentData", mergedLocation).then((data) =>
        console.log(data)
      );
    });
  });
});
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
