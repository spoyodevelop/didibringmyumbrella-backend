const moment = require("moment");

const timeRanges = [
  { startTime: "00:01", endTime: "03:00", baseTime: 23 },
  { startTime: "03:01", endTime: "06:00", baseTime: 2 },
  { startTime: "06:01", endTime: "09:00", baseTime: 5 },
  { startTime: "09:01", endTime: "12:00", baseTime: 8 },
  { startTime: "12:01", endTime: "15:00", baseTime: 11 },
  { startTime: "15:01", endTime: "18:00", baseTime: 14 },
  { startTime: "18:01", endTime: "21:00", baseTime: 17 },
  { startTime: "21:01", endTime: "00:00", baseTime: 20 },
];

function getBaseTimeForGivenTime(givenDate) {
  const givenMoment = moment(givenDate);
  const currentDate = moment();

  // Check if the given time is between "00:00" and "03:00"
  if (
    givenMoment.isBetween(
      moment("00:00", "HH:mm"),
      moment("03:00", "HH:mm"),
      null,
      "[)"
    )
  ) {
    currentDate.subtract(1, "day");
  }

  for (const range of timeRanges) {
    const startTime = moment(range.startTime, "HH:mm");
    let endTime = moment(range.endTime, "HH:mm");

    if (range.startTime === "21:01") {
      startTime.subtract(1, "day");
    }
    // Adjust end time for "00:00""
    if (range.endTime === "00:00") {
      endTime = endTime.add(1, "day");
    }

    // Include the end time in the comparison
    if (givenMoment.isBetween(startTime, endTime, null, "[]")) {
      currentDate.set({
        hour: range.baseTime,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      return currentDate.toDate();
    }
  }
  currentDate.set({ hour: 23, minute: 0, second: 0, millisecond: 0 });
  return currentDate.toDate();
}

// const newDate = new Date();
// const testCases = [
//   // Test cases within defined ranges
//   { givenDate: "2024-04-28T00:01:00", expectedOutput: 23 },
//   { givenDate: "2024-04-28T22:00:00", expectedOutput: 20 },
//   { givenDate: "2024-04-28T08:15:00", expectedOutput: 5 },
//   { givenDate: "2024-04-28T15:30:00", expectedOutput: 14 },

//   // Test cases at the boundaries of defined ranges
//   { givenDate: "2024-04-28T23:14:59", expectedOutput: 20 },
//   { givenDate: "2024-04-28T02:15:00", expectedOutput: 23 },

//   // Test cases for times that span across midnight
//   { givenDate: "2024-04-28T23:59:59", expectedOutput: 20 },
//   { givenDate: "2024-04-28T00:01:10", expectedOutput: 23 },

//   // Test cases for times just before and after the defined ranges
//   { givenDate: "2024-04-28T23:14:58", expectedOutput: 20 },
//   { givenDate: "2024-04-28T02:15:01", expectedOutput: 23 },

//   // Test cases for times at the very start and end of the day
//   { givenDate: "2024-04-28T00:00:00", expectedOutput: 20 },
//   { givenDate: "2024-04-28T23:59:59", expectedOutput: 20 },

//   // Test cases for times that fall between ranges
//   { givenDate: "2024-04-28T02:14:59", expectedOutput: 23 },
//   { givenDate: "2024-04-28T05:30:00", expectedOutput: 2 },

//   // Test cases for times just before the earliest time in the range
//   { givenDate: "2024-04-28T23:14:59", expectedOutput: 20 },
//   // Test cases for times just after the latest time in the range
//   { givenDate: "2024-04-28T02:15:00", expectedOutput: 23 },

//   { givenDate: newDate, expectedOutput: 5 },
// ];

// Example usage

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
