/**
 * 클라이언트용 시간 유틸리티
 */

const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];

/**
 * "HH:MM" 형식을 분으로 변환
 * @param {string} time - "HH:MM" 형식
 * @returns {number} 분
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * 가장 가까운 base time 찾기
 * @param {number} hour - 시간
 * @param {number} minusHour - 빼줄 시간
 * @returns {Object} { closestTime, daySubtract }
 */
function getClosestBaseTime(hour, minusHour = 0) {
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

  return { closestTime: baseTimes[baseTimeIndex], daySubtract };
}

/**
 * 시간 범위로 base time 결정
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime - "HH:MM"
 * @returns {number|null} baseTime
 */
function determineBaseTime(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let i = 0; i < baseTimes.length; i++) {
    const baseTime = baseTimes[i];
    if (
      startMinutes <= baseTime * 60 + 14 &&
      endMinutes >= baseTime * 60 + 15
    ) {
      return baseTime;
    }
  }

  return null;
}

/**
 * 테스트용 더미 시간 배열 생성
 * @param {number} startHour - 시작 시간
 * @param {number} endHour - 종료 시간
 * @returns {Array<string>} 시간 문자열 배열
 */
function generateDummyTimeArray(startHour = 22, endHour = 23) {
  const timeArray = [];
  const options = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  const startTime = new Date();
  startTime.setHours(startHour, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, 59, 59);

  let currentTime = new Date(startTime);
  while (currentTime <= endTime) {
    timeArray.push(new Date(currentTime).toLocaleDateString("ko-KR", options));
    currentTime.setMinutes(currentTime.getMinutes() + 1);
  }

  return timeArray;
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
  timeToMinutes,
  getClosestBaseTime,
  determineBaseTime,
  generateDummyTimeArray,
  formatKoreanDate,
};
