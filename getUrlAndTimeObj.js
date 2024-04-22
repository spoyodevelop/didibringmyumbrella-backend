const {
  getPastFormattedHour,
  getCurrentBaseDate,
  baseTimes,
} = require("./dateFormatting");
const { DUMMY_CAPITAL } = require("./locations");
require('dotenv').config();
const KOREA_METEOROLOGICAL_API_KEY = process.env.KOREA_METEOROLOGICAL_API_KEY;
// const { KOREA_METEOROLOGICAL_API_KEY } = require("./majorKeys");

//TODO 가능한 버그 => 0, 1, 2, 3분일때, 데이터베이스에 데이터가 없을수가 있다.
//이전데이터를 불러오거나, 인터벌을 땡기자.

function getTimeObj(usage, dataType) {
  let year, month, day, hour, minute;

  if (dataType === "currentData") {
    ({ year, month, day, hour, minute } = getPastFormattedHour(0, false));
  } else if (dataType === "pastData") {
    ({ year, month, day, hour, minute } = getCurrentBaseDate(new Date()));
  }
  return { usage, dataType, year, month, day, hour, minute };
}

function getUrl(locationObj, timeObj) {
  let url;
  const { usage } = timeObj;

  let capitalNX, capitalNY, convertedX, convertedY;

  if (usage === "client") {
    ({ convertedX, convertedY } = locationObj);
  } else if (usage === "DB") {
    ({ capitalNX, capitalNY } = locationObj);
  }

  const { dataType, year, month, day, hour, minute } = timeObj;

  if (dataType === "pastData") {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  } else {
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  }

  return url;
}
// DUMMY_CAPITAL.forEach((capital) => {
//   const time = getTimeObj("DB", "currentData");
//   console.log(getUrl(capital, time));
// });

module.exports = {
  getTimeObj,
  getUrl,
};
