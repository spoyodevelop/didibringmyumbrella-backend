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
  { administrativeArea: "Seoul", nx: 60, ny: 127, koreanName: "서울" },
  { administrativeArea: "Busan", nx: 98, ny: 76, koreanName: "부산" },
  { administrativeArea: "Daegu", nx: 89, ny: 90, koreanName: "대구" },
  { administrativeArea: "Incheon", nx: 55, ny: 124, koreanName: "인천" },
  { administrativeArea: "Gwangju", nx: 58, ny: 74, koreanName: "광주" },
  { administrativeArea: "Daejeon", nx: 67, ny: 100, koreanName: "대전" },
  { administrativeArea: "Ulsan", nx: 102, ny: 84, koreanName: "울산" },
  { administrativeArea: "Sejong-si", nx: 66, ny: 103, koreanName: "세종" },
  { administrativeArea: "Gyeonggi-do", nx: 60, ny: 120, koreanName: "경기도" },
  { administrativeArea: "Gangwon-do", nx: 73, ny: 134, koreanName: "강원도" },
  {
    administrativeArea: "Chungcheongbuk-do",
    nx: 69,
    ny: 107,
    koreanName: "충청북도",
  },
  {
    administrativeArea: "Chungcheongnam-do",
    nx: 68,
    ny: 100,
    koreanName: "충청남도",
  },
  {
    administrativeArea: "Jeollabuk-do",
    nx: 63,
    ny: 89,
    koreanName: "전라북도",
  },
  {
    administrativeArea: "Jeollanam-do",
    nx: 51,
    ny: 67,
    koreanName: "전라남도",
  },
  {
    administrativeArea: "Gyeongsangbuk-do",
    nx: 89,
    ny: 91,
    koreanName: "경상북도",
  },
  {
    administrativeArea: "Gyeongsangnam-do",
    nx: 91,
    ny: 77,
    koreanName: "경상남도",
  },
  { administrativeArea: "Jeju-do", nx: 52, ny: 38, koreanName: "제주" },
];
async function mergeLocationsData() {
  try {
    const locationsData = await fetchLocationsData();

    const result = locationsData.map((location) => {
      const matchedPlace = locations.filter(
        (l) => l.administrativeArea === location.administrativeArea
      );
      const matchedLocation = matchedPlace.length > 0 ? matchedPlace[0] : {};
      return { ...matchedLocation, ...location };
    });

    return result;
  } catch (error) {
    console.error("Error in mergeLocationsData:", error);
    throw error;
  }
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
function getTimeObj(timeType) {
  let year, month, day, hour, minute;

  if (timeType === "currentData") {
    ({ year, month, day, hour, minute } = getPastFormattedHour(1, true));
  } else if (timeType === "pastData") {
    ({ year, month, day, hour, minute } = getCurrentBaseDate());
  }
  return { timeType, year, month, day, hour, minute };
}
function getLocationObj(usage, location) {
  let nx, ny, administrativeArea, convertedX, convertedY, koreanName;
  if (usage === "client") {
    ({ nx, ny, administrativeArea, convertedX, convertedY, koreanName } =
      location);
    (nx = convertedX), (ny = convertedY);
  }
  if (usage === "DB") {
    ({ nx, ny, administrativeArea, koreanName } = location);
  }
  return {
    usage,
    nx,
    ny,
    administrativeArea,
    convertedX: convertedX ? convertedX : nx,
    convertedY: convertedY ? convertedY : ny,
    koreanName,
  };
}
function getUrlAndMergedObject(locationObj, timeObj) {
  let url;
  const {
    usage,
    ny,
    nx,
    administrativeArea,
    convertedX: convertedXValue,
    convertedY: convertedYValue,
    koreanName,
  } = locationObj;

  const convertedX = "convertedX" in locationObj ? convertedXValue : undefined;
  const convertedY = "convertedY" in locationObj ? convertedYValue : undefined;
  const { timeType, year, month, day, hour, minute } = timeObj;
  if (timeType === "pastData") {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${nx}&ny=${ny}`;
  } else {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${nx}&ny=${ny}`;
  }

  return {
    usage,
    url,
    year,
    month,
    day,
    hour,
    minute,
    nx,
    ny,
    administrativeArea,
    koreanName,
    convertedX: convertedX ? convertedX : undefined,
    convertedY: convertedY ? convertedY : undefined,
  };
}
async function fetchWeatherData(usage, timeType, location) {
  const locationObj = getLocationObj(usage, location);
  const timeObj = getTimeObj(timeType);
  const urlAndMergedObj = getUrlAndMergedObject(locationObj, timeObj);
  const {
    url,
    year,
    month,
    day,
    hour,
    minute,
    nx,
    ny,
    administrativeArea,
    koreanName,
    convertedX,
    convertedY,
  } = urlAndMergedObj;
  console.log(url);
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
      convertedX,
      convertedY,
      year,
      month,
      day,
      hour,
      minute,
      administrativeArea,
      koreanName,
      nx,
      ny,
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

// processLocationData().then((data) => console.log(data));
// fetchWeatherData("DB", "pastData", locations).then((data) => console.log(data));
locations.forEach((location) => {
  console.log(getLocationObj("DB", location));
});
