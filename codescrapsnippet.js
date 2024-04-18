function dummyDataGen() {
  const timeArray = [];

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

async function processLocationData() {
  try {
    const results = [];

    // Use Promise.all to await all asynchronous operations concurrently
    await Promise.all(
      locationData.map(async (location) => {
        const currentItems = await fetchWeatherData("client", location);
        const pastItems = await fetchWeatherData("pastData", location);
        const { hour } = currentItems;
        const fcstTime = formatPlusOneHour(hour);

        const PTY = currentItems.item.find((item) => item.category === "PTY");

        results.push({ ...location, PTY, POP });
      })
    );

    return results;
  } catch (error) {
    console.error("Error in processLocationData:", error);
    throw error;
  }
}
//Cursed testCases
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
  console.log(getCurrentBaseDate(midnightDate, baseTimes, "DB")); // Should output the closest past base time
  //Test case 3: Edge case - Near Midnight
  const nearMidnightDate = new Date();
  nearMidnightDate.setHours(5, 15, 0, 0); // 11:45 PM
  console.log(nearMidnightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(nearMidnightDate, baseTimes, "DB")); // Should output the closest past base time
  // Test case 4: Edge case - Early Morning
  const earlyMorningDate = new Date();
  earlyMorningDate.setHours(8, 15, 0, 0); // 1:00 AM
  console.log(earlyMorningDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(earlyMorningDate, baseTimes, "DB")); // Should output the closest past base time from the previous day
  // Test case 5: Edge case - Late Night
  const afternoonDate = new Date();
  afternoonDate.setHours(11, 15, 0, 0); // 11:00 PM
  console.log(afternoonDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(afternoonDate, baseTimes, "DB")); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const fourTeenDate = new Date();
  fourTeenDate.setHours(14, 15, 0, 0); // 3:00 AM
  console.log(fourTeenDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(fourTeenDate, baseTimes, "DB")); // Should output the closest past base time from the previous day
  const dinnerDate = new Date();
  dinnerDate.setHours(17, 15, 0, 0); // 11:00 PM
  console.log(dinnerDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dinnerDate, baseTimes, "DB")); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const pastDinnerDate = new Date();
  pastDinnerDate.setHours(20, 15, 0, 0); // 3:00 AM
  console.log(pastDinnerDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(pastDinnerDate, baseTimes, "DB")); // Should output the closest past base time from the previous day

  const dayTransitionDate = new Date();
  dayTransitionDate.setHours(23, 15, 0, 0); // 3:00 AM
  console.log(dayTransitionDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dayTransitionDate, baseTimes, "DB")); // Should output the closest past base time from the previous day
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
  console.log(getCurrentBaseDate(midnightDate, baseTimes, "client")); // Should output the closest past base time
  //Test case 3: Edge case - Near Midnight
  const nearMidnightDate = new Date();
  nearMidnightDate.setHours(23, 45, 0, 0); // 11:45 PM
  console.log(nearMidnightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(nearMidnightDate, baseTimes, "client")); // Should output the closest past base time
  // Test case 4: Edge case - Early Morning
  const earlyMorningDate = new Date();
  earlyMorningDate.setHours(1, 0, 0, 0); // 1:00 AM
  console.log(earlyMorningDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(earlyMorningDate, baseTimes, "client")); // Should output the closest past base time from the previous day
  // Test case 5: Edge case - Late Night
  const lateNightDate = new Date();
  lateNightDate.setHours(23, 0, 0, 0); // 11:00 PM
  console.log(lateNightDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(lateNightDate, baseTimes, "client")); // Should output the closest past base time from the current day
  // Test case 6: Edge case - Day Transition
  const dayTransitionDate = new Date();
  dayTransitionDate.setHours(3, 0, 0, 0); // 3:00 AM
  console.log(dayTransitionDate.toLocaleDateString("ko-KR", options));
  console.log(getCurrentBaseDate(dayTransitionDate, baseTimes, "client")); // Should output the closest past base time from the previous day
}
function getClosestBaseTime(baseTimes, hour, minusHour) {
  let closestTime = baseTimes[0];
  let adjustedHour = hour - minusHour;
  let minDifference = Math.abs(adjustedHour - baseTimes[0]);
  let daySubtract = 0;
  baseTimes.forEach((time) => {
    const difference = Math.abs(adjustedHour - time);
    if (difference < minDifference) {
      minDifference = difference;
      closestTime = time;
    }
  });
  let baseTimeIndex = baseTimes.indexOf(closestTime);

  if (baseTimeIndex < 0) {
    baseTimeIndex = baseTimes.length - 1;
    daySubtract = 1;
  }
  return { closestTime: baseTimes[baseTimeIndex], daySubtract: daySubtract };
}
const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];

// Function to convert time from "HH:MM" format to minutes
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Function to determine the base time for a given time range
function determineBaseTime(startTime, endTime, baseTimes) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Finding the base time based on the time range
  for (let i = 0; i < baseTimes.length; i++) {
    const baseTime = baseTimes[i];
    if (
      startMinutes <= baseTime * 60 + 14 &&
      endMinutes >= baseTime * 60 + 15
    ) {
      return baseTime;
    }
  }

  return null; // If no matching base time found
}

// Define your time ranges
const timeRanges = [
  { startTime: "23:15", endTime: "02:14", baseTime: 23 },
  { startTime: "02:15", endTime: "05:14", baseTime: 2 },
  { startTime: "05:15", endTime: "08:14", baseTime: 5 },
  { startTime: "08:15", endTime: "11:14", baseTime: 8 },
  { startTime: "11:15", endTime: "14:14", baseTime: 11 },
  { startTime: "14:15", endTime: "17:14", baseTime: 14 },
  { startTime: "17:15", endTime: "20:14", baseTime: 17 },
  { startTime: "20:15", endTime: "23:14", baseTime: 20 },
];

// Generate the array of objects with base time for each time range
const result = timeRanges.map((range) => {
  const { startTime, endTime } = range;
  const baseTime = determineBaseTime(startTime, endTime, baseTimes);
  return { startTime, endTime, baseTime };
});

console.log("Array result:");
console.log(result);

console.log("\nIndividual objects:");
// Print the array
result.forEach((obj) => {
  console.log(
    `{ startTime: ${obj.startTime}, endTime: ${obj.endTime}, baseTime: ${obj.baseTime} }`
  );
});
