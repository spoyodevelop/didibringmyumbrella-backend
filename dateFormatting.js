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

function getCurrentBaseTime() {
  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  let closestTime = baseTimes[0];
  let minDifference = Math.abs(currentHour - baseTimes[0]);
  baseTimes.forEach((time) => {
    const difference = Math.abs(currentHour - time);
    if (difference < minDifference) {
      minDifference = difference;
      closestTime = time;
    }
  });
  let pastDate = new Date(currentDate.getTime());
  let baseTimeIndex = baseTimes.indexOf(closestTime) - 1;
  if (baseTimeIndex < 0) {
    baseTimeIndex = baseTimes.length - 1;
    pastDate.setDate(pastDate.getDate() - 1);
  }
  const correctedTime = baseTimes[baseTimeIndex];

  pastDate.setHours(correctedTime);
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
// function runTests() {
//   const options = {
//     hourCycle: "h23",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   };
//   // Test case 1: Current time is exactly one of the base times
//   console.log("Test case 1:");
//   console.log("Current time is exactly one of the base times:");
//   // Set the current time to be one of the base times
//   const testDate1 = new Date("2024-04-14T08:00:00"); // April 14, 2024 08:00:00
//   console.log("Testing Date:", testDate1.toLocaleDateString("ko-KR", options));
//   getCurrentBaseTime(testDate1);

//   // Test case 2: Current time is between two base times
//   console.log("\nTest case 2:");
//   console.log("Current time is between two base times:");
//   // Set the current time to be between two base times
//   const testDate2 = new Date("2024-04-14T09:30:00"); // April 14, 2024 09:30:00
//   console.log("Testing Date:", testDate2.toLocaleDateString("ko-KR", options));
//   getCurrentBaseTime(testDate2);

//   // Test case 3: Current time is before the first base time
//   console.log("\nTest case 3:");
//   console.log("Current time is before the first base time:");
//   // Set the current time to be before the first base time
//   const testDate3 = new Date("2024-04-14T01:00:00"); // April 14, 2024 01:00:00
//   console.log("Testing Date:", testDate3.toLocaleDateString("ko-KR", options));
//   getCurrentBaseTime(testDate3);

//   // Test case 4: Current time is after the last base time
//   console.log("\nTest case 4:");
//   console.log("Current time is after the last base time:");
//   // Set the current time to be after the last base time
//   const testDate4 = new Date("2024-04-15T02:00:00"); // April 15, 2024 02:00:00
//   console.log("Testing Date:", testDate4.toLocaleDateString("ko-KR", options));
//   getCurrentBaseTime(testDate4);

//   // Test case 5: Current time is close to midnight
//   console.log("\nTest case 5:");
//   console.log("Current time is close to midnight:");
//   // Set the current time to be close to midnight
//   const testDate5 = new Date("2024-04-14T23:30:00"); // April 14, 2024 23:30:00
//   console.log("Testing Date:", testDate5.toLocaleDateString("ko-KR", options));
//   getCurrentBaseTime(testDate5);
// }

// runTests();

module.exports = {
  getPastFormattedHour,
  getCurrentBaseTime,
  formatPlusOneHour,
};
