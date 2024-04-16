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
function dateTestCases() {
  // Test case 1: Normal case
  // console.log(getCurrentBaseDate()); // Should output the current or closest past base time
  // Test case 2: Edge case - Midnight
  // const midnightDate = new Date();
  // midnightDate.setHours(0, 0, 0, 0);
  // console.log(midnightDate.toLocaleDateString("ko-KR", options));
  // console.log(getCurrentBaseDate(midnightDate)); // Should output the closest past base time
  // //Test case 3: Edge case - Near Midnight
  // const nearMidnightDate = new Date();
  // nearMidnightDate.setHours(23, 45, 0, 0); // 11:45 PM
  // console.log(nearMidnightDate.toLocaleDateString("ko-KR", options));
  // console.log(getCurrentBaseDate(nearMidnightDate)); // Should output the closest past base time
  // // Test case 4: Edge case - Early Morning
  // const earlyMorningDate = new Date();
  // earlyMorningDate.setHours(1, 0, 0, 0); // 1:00 AM
  // console.log(earlyMorningDate.toLocaleDateString("ko-KR", options));
  // console.log(getCurrentBaseDate(earlyMorningDate)); // Should output the closest past base time from the previous day
  // // Test case 5: Edge case - Late Night
  // const lateNightDate = new Date();
  // lateNightDate.setHours(23, 0, 0, 0); // 11:00 PM
  // console.log(lateNightDate.toLocaleDateString("ko-KR", options));
  // console.log(getCurrentBaseDate(lateNightDate)); // Should output the closest past base time from the current day
  // // Test case 6: Edge case - Day Transition
  // const dayTransitionDate = new Date();
  // dayTransitionDate.setHours(3, 0, 0, 0); // 3:00 AM
  // console.log(dayTransitionDate.toLocaleDateString("ko-KR", options));
  // console.log(getCurrentBaseDate(dayTransitionDate)); // Should output the closest past base time from the previous day
}
