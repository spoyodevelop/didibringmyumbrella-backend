const {
  getPastFormattedHour,
  getCurrentBaseDate,
} = require("./dateFormatting");
const { KOREA_METEOROLOGICAL_API_KEY } = require("./majorKeys");
function getTimeObj(dataType) {
  let year, month, day, hour, minute;

  if (dataType === "currentData") {
    ({ year, month, day, hour, minute } = getPastFormattedHour(1, true));
  } else if (dataType === "pastData") {
    ({ year, month, day, hour, minute } = getCurrentBaseDate());
  }
  return { dataType, year, month, day, hour, minute };
}

function getUrl(usage, locationObj, timeObj) {
  let url;

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
    url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${KOREA_METEOROLOGICAL_API_KEY}&numOfRows=10&pageNo=1&base_date=${year}${month}${day}&base_time=${hour}${minute}&nx=${
      convertedX ? convertedX : capitalNX
    }&ny=${convertedY ? convertedY : capitalNY}`;
  }

  return url;
}
module.exports = {
  getTimeObj,
  getUrl,
};
