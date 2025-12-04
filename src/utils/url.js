const { getPastFormattedHour, getCurrentBaseDate } = require("./time");

process.env.TZ = "Asia/Seoul";
const KOREA_METEOROLOGICAL_API_KEY = process.env.KOREA_METEOROLOGICAL_API_KEY;

function getTimeObj(usage, dataType) {
  let year, month, day, hour, minute;

  if (dataType === "currentData") {
    ({ year, month, day, hour, minute } = getPastFormattedHour(1, false));
  } else if (dataType === "pastData") {
    ({ year, month, day, hour, minute } = getCurrentBaseDate(
      new Date(Date.now())
    ));
  }

  return { usage, dataType, year, month, day, hour, minute };
}

function getUrl(locationObj, timeObj) {
  const { usage } = timeObj;

  let capitalNX, capitalNY, convertedX, convertedY;

  if (usage === "client") {
    ({ convertedX, convertedY } = locationObj);
  } else if (usage === "DB") {
    ({ capitalNX, capitalNY } = locationObj);
  }

  const { dataType, year, month, day, hour, minute } = timeObj;

  let url;
  if (dataType === "pastData") {
    url = `https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getVilageFcst?authKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  } else {
    url = `https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getUltraSrtNcst?authKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  }

  return url;
}

module.exports = {
  getTimeObj,
  getUrl,
};

