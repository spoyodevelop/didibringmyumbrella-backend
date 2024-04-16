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

  const convertedDateObj = {
    year: "" + year,
    month: month < 10 ? "0" + month : "" + month,
    day: day < 10 ? "0" + day : "" + day,
    hour: hour < 10 ? "0" + hour : "" + hour,
    minute: minute,
  };

  return convertedDateObj;
}
function getPastFormattedHour(hourAgo, type) {
  const hour = hourAgo;

  //hourAgo만큼의 이전 시간을 가져옵니다.
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
    currentDate.getTime() - hour * 60 * 60 * 1000
  ).toLocaleDateString("ko-KR", options);
  const dateObj = convertDate(pastDate, type);
  return dateObj;
}
function getClosestPastBaseTime(baseTimes, hour) {
  let closestTime = baseTimes[0];
  let minDifference = Math.abs(hour - baseTimes[0]);
  let daySubtract = 0;
  baseTimes.forEach((time) => {
    const difference = Math.abs(hour - time);
    if (difference < minDifference) {
      minDifference = difference;
      closestTime = time;
    }
  });
  let baseTimeIndex = baseTimes.indexOf(closestTime) - 1;

  if (baseTimeIndex < 0) {
    baseTimeIndex = baseTimes.length - 1;
    daySubtract = 1;
  }
  return { closestTime: baseTimes[baseTimeIndex], daySubtract: daySubtract };
}

function getCurrentBaseDate(date) {
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  const currentDate = date;
  const currentHour = currentDate.getHours();

  let pastDate = new Date(currentDate.getTime());

  pastDate.setDate(pastDate.getDate());
  const { closestTime, daySubtract } = getClosestPastBaseTime(
    baseTimes,
    currentHour
  );
  pastDate.setDate(pastDate.getDate() - daySubtract);
  pastDate.setHours(closestTime);
  pastDate.setMinutes(0);
  const formattedPastDate = pastDate.toLocaleDateString("ko-KR", options);
  const dateObj = convertDate(formattedPastDate, false);
  return dateObj;
}
function formatPlusOneHour(hour) {
  let hourInt = +hour;
  hourInt += 1;
  if (hourInt === 24) {
    hourInt = 0;
  }
  const result = hourInt + "00";
  return +result;
}

const options = {
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

module.exports = {
  getPastFormattedHour,
  getCurrentBaseDate,
  formatPlusOneHour,
};
