const moment = require("moment");

// Base times for weather data
const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];

const timeRanges = [
  { startTime: "23:15:00", endTime: "02:14:59", baseTime: 23 },
  { startTime: "02:15:00", endTime: "05:14:59", baseTime: 2 },
  { startTime: "05:15:00", endTime: "08:14:59", baseTime: 5 },
  { startTime: "08:15:00", endTime: "11:14:59", baseTime: 8 },
  { startTime: "11:15:00", endTime: "14:14:59", baseTime: 11 },
  { startTime: "14:15:00", endTime: "17:14:59", baseTime: 14 },
  { startTime: "17:15:00", endTime: "20:14:59", baseTime: 17 },
  { startTime: "20:15:00", endTime: "23:14:59", baseTime: 20 },
];

function getBaseTimeForGivenTime(givenDate) {
  const givenMoment = moment(givenDate);
  const currentDate = new Date();

  const startTime = moment().startOf("day");
  const endTime = moment()
    .startOf("day")
    .add(2, "hours")
    .add(14, "minutes")
    .add(59, "seconds");

  if (givenMoment.isBetween(startTime, endTime, null, "[]")) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (const range of timeRanges) {
    const rangeStart = moment(range.startTime, "HH:mm:ss");
    let rangeEnd = moment(range.endTime, "HH:mm:ss");

    if (rangeEnd.isBefore(rangeStart)) {
      rangeEnd.add(1, "day");
    }

    if (givenMoment.isBetween(rangeStart, rangeEnd, null, "[]")) {
      currentDate.setHours(range.baseTime, 0, 0, 0);
      return currentDate;
    }
  }

  currentDate.setHours(23, 0, 0, 0);
  return currentDate;
}

function convertDate(str, isMinuteNeeded) {
  const parts = str.match(/\d+/g);
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const hour = parseInt(parts[3]);
  let minute = parseInt(parts[4]);

  if (isMinuteNeeded) {
    minute = "30";
  } else {
    minute = "00";
  }

  return {
    year: "" + year,
    month: month < 10 ? "0" + month : "" + month,
    day: day < 10 ? "0" + day : "" + day,
    hour: hour < 10 ? "0" + hour : "" + hour,
    minute: minute,
  };
}

function getPastFormattedHour(hourAgo, type) {
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  const currentDate = new Date();
  const pastDate = new Date(
    currentDate.getTime() - hourAgo * 60 * 60 * 1000
  ).toLocaleDateString("ko-KR", options);

  return convertDate(pastDate, type);
}

function getCurrentBaseDate(date) {
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  const pastDate = getBaseTimeForGivenTime(date);
  const formattedPastDate = pastDate.toLocaleDateString("ko-KR", options);
  return convertDate(formattedPastDate, false);
}

function formatPlusOneHour(hour) {
  let hourInt = +hour;
  hourInt += 1;
  if (hourInt === 24) {
    hourInt = 0;
  }
  return +(hourInt + "00");
}

function JSDateToConvertedDate(date) {
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return date.toLocaleDateString("ko-KR", options);
}

function formatKoreanDate(isoString) {
  if (!isoString) return "unknown";
  return new Date(isoString).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = {
  baseTimes,
  getBaseTimeForGivenTime,
  getPastFormattedHour,
  getCurrentBaseDate,
  formatPlusOneHour,
  JSDateToConvertedDate,
  formatKoreanDate,
};
