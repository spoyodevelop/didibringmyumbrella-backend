const { getBaseTimeForGivenTime } = require("./baseTimeCalculation.js");
const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
//pastData= POP을 쓰되, 2시에 부를것을 3시에 부르고, hour만 조정하자.

//어쩌피 3시에 한번 부를꺼니까, 1시간 빼고, minute를 00으로 맞추면 된다.
//client의 경우에는 동네예보를 통해 받아온 3시간 전의 것 === 현재의 것(놀랍게도 분까지 넣어도 상관 없다!)
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
  const convertedDate = date.toLocaleDateString("ko-KR", options);
  return convertedDate;
}

module.exports = {
  getPastFormattedHour,
  getCurrentBaseDate,
  formatPlusOneHour,
  baseTimes,
  JSDateToConvertedDate,
};
function dateTestCases() {
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  //Test case 2: Edge case - Midnight
  const midnightDate = new Date();
  midnightDate.setHours(2, 15, 0, 0);
  console.log(midnightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(midnightDate)); // Should output the closest past base time
  //Test case 3: Edge case - Near Midnight
  const nearMidnightDate = new Date();
  nearMidnightDate.setHours(5, 15, 0, 0); // 11:45 PM
  console.log(nearMidnightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(nearMidnightDate)); // Should output the closest past base time
  // Test case 4: Edge case - Early Morning
  const earlyMorningDate = new Date();
  earlyMorningDate.setHours(8, 15, 0, 0); // 1:00 AM
  console.log(earlyMorningDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(earlyMorningDate)); // Should output the closest past base time from the previous day
  // Test case 5: Edge case - Late Night
  const afternoonDate = new Date();
  afternoonDate.setHours(11, 15, 0, 0); // 11:00 PM
  console.log(afternoonDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(afternoonDate)); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const fourTeenDate = new Date();
  fourTeenDate.setHours(14, 15, 0, 0); // 3:00 AM
  console.log(fourTeenDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(fourTeenDate)); // Should output the closest past base time from the previous day
  const dinnerDate = new Date();
  dinnerDate.setHours(17, 15, 0, 0); // 11:00 PM
  console.log(dinnerDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dinnerDate)); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const pastDinnerDate = new Date();
  pastDinnerDate.setHours(20, 15, 0, 0); // 3:00 AM
  console.log(pastDinnerDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(pastDinnerDate)); // Should output the closest past base time from the previous day

  const dayTransitionDate = new Date();
  dayTransitionDate.setHours(23, 15, 0, 0); // 3:00 AM
  console.log(dayTransitionDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dayTransitionDate)); // Should output the closest past base time from the previous day
}
function pastDateTestCases() {
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  //Test case 2: Edge case - Midnight
  const midnightDate = new Date();
  midnightDate.setHours(0, 0, 0, 0);
  console.log(midnightDate.toLocaleDateString("ko-KR", options));

  console.log(getCurrentBaseDate(midnightDate)); // Should output the closest past base time
  //Test case 3: Edge case - Near Midnight
  const nearMidnightDate = new Date();
  nearMidnightDate.setHours(23, 45, 0, 0); // 11:45 PM
  console.log(nearMidnightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(nearMidnightDate)); // Should output the closest past base time
  // Test case 4: Edge case - Early Morning
  const earlyMorningDate = new Date();
  earlyMorningDate.setHours(1, 0, 0, 0); // 1:00 AM
  console.log(earlyMorningDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(earlyMorningDate)); // Should output the closest past base time from the previous day
  // Test case 5: Edge case - Late Night
  const lateNightDate = new Date();
  lateNightDate.setHours(23, 0, 0, 0); // 11:00 PM
  console.log(lateNightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(lateNightDate)); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const dayTransitionDate = new Date();
  dayTransitionDate.setHours(3, 0, 0, 0); // 3:00 AM
  console.log(dayTransitionDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dayTransitionDate)); // Should output the closest past base time from the previous day
}
