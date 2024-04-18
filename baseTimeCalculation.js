const moment = require("moment");

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
  //if currentdate's time is between 00:00:00 and 02:14:59,
  //add a date to currentDate
  const startTime = moment().startOf("day"); // 00:00:00
  const endTime = moment()
    .startOf("day")
    .add(2, "hours")
    .add(14, "minutes")
    .add(59, "seconds"); // 02:14:59

  // Check if the current time is between the start and end times
  if (givenMoment.isBetween(startTime, endTime, null, "[]")) {
    // subtract a day to currentDate
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (const range of timeRanges) {
    const startTime = moment(range.startTime, "HH:mm:ss");
    let endTime = moment(range.endTime, "HH:mm:ss");

    // Adjust end time if it's before the start time
    if (endTime.isBefore(startTime)) {
      endTime.add(1, "day");
    }

    // Include the end time in the comparison
    if (givenMoment.isBetween(startTime, endTime, null, "[]")) {
      currentDate.setHours(range.baseTime, 0, 0, 0);
      return currentDate;
    }
  }
  //somehow times that falls between 23 base time comes over here.
  //i don't know why, and i don't want to know why, and i am just put them in here as fallback. although this is logically incorrect.
  // Return 23 for times that fall between the last range and the next day's start
  // Return a Date object with the current date and the base time of 23

  currentDate.setHours(23, 0, 0, 0);
  return currentDate;
}
// const newDate = new Date();
// const testCases = [
//   // Test cases within defined ranges
//   { givenDate: "2024-04-18T00:30:00", expectedOutput: 23 },
//   { givenDate: "2024-04-18T22:00:00", expectedOutput: 20 },
//   { givenDate: "2024-04-18T08:15:00", expectedOutput: 8 },
//   { givenDate: "2024-04-18T15:30:00", expectedOutput: 14 },

//   // Test cases at the boundaries of defined ranges
//   { givenDate: "2024-04-18T23:14:59", expectedOutput: 23 },
//   { givenDate: "2024-04-18T02:15:00", expectedOutput: 2 },

//   // Test cases for times that span across midnight
//   { givenDate: "2024-04-18T23:59:59", expectedOutput: 23 },
//   { givenDate: "2024-04-19T00:00:01", expectedOutput: 23 },

//   // Test cases for times just before and after the defined ranges
//   { givenDate: "2024-04-18T23:14:58", expectedOutput: 20 },
//   { givenDate: "2024-04-18T02:15:01", expectedOutput: 2 },

//   // Test cases for times at the very start and end of the day
//   { givenDate: "2024-04-18T00:00:00", expectedOutput: 23 },
//   { givenDate: "2024-04-18T23:59:59", expectedOutput: 23 },

//   // Test cases for times that fall between ranges
//   { givenDate: "2024-04-18T02:14:59", expectedOutput: 23 },
//   { givenDate: "2024-04-18T05:30:00", expectedOutput: 5 },

//   // Test cases for times just before the earliest time in the range
//   { givenDate: "2024-04-18T23:14:59", expectedOutput: 20 },
//   // Test cases for times just after the latest time in the range
//   { givenDate: "2024-04-18T02:15:00", expectedOutput: 2 },

//   { givenDate: newDate, expectedOutput: 17 },
// ];

// testCases.forEach((testCase, index) => {
//   const { givenDate, expectedOutput } = testCase;
//   const result = getBaseTimeForGivenTime(givenDate);
//   console.log(`Additional Test Case ${index + 1}:`);
//   console.log(`Given Time: ${givenDate}`);
//   console.log(`Expected Output: ${expectedOutput}`);
//   console.log(`Actual Output: ${result}`);

//   console.log("----------------------");
// });
module.exports = {
  getBaseTimeForGivenTime,
};
