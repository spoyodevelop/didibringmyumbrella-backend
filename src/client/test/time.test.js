const {
  timeToMinutes,
  getClosestBaseTime,
  determineBaseTime,
  generateDummyTimeArray,
  baseTimes,
} = require("../utils/time");

describe("클라이언트 시간 유틸리티 테스트", () => {
  describe("timeToMinutes", () => {
    test('"00:00"을 0으로 변환해야 한다', () => {
      expect(timeToMinutes("00:00")).toBe(0);
    });

    test('"01:30"을 90으로 변환해야 한다', () => {
      expect(timeToMinutes("01:30")).toBe(90);
    });

    test('"23:59"를 1439로 변환해야 한다', () => {
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    test('"12:00"을 720으로 변환해야 한다', () => {
      expect(timeToMinutes("12:00")).toBe(720);
    });
  });

  describe("getClosestBaseTime", () => {
    test("3시에 가장 가까운 base time은 2여야 한다", () => {
      const result = getClosestBaseTime(3);
      expect(result.closestTime).toBe(2);
    });

    test("10시에 가장 가까운 base time은 11이어야 한다", () => {
      const result = getClosestBaseTime(10);
      expect(result.closestTime).toBe(11);
    });

    test("22시에 가장 가까운 base time은 23이어야 한다", () => {
      const result = getClosestBaseTime(22);
      expect(result.closestTime).toBe(23);
    });
  });

  describe("determineBaseTime", () => {
    test("범위가 base time을 포함하면 해당 base time을 반환해야 한다", () => {
      // 02:14 ~ 02:16은 base time 2를 포함
      expect(determineBaseTime("02:14", "02:16")).toBe(2);
    });

    test("범위가 base time을 포함하면 해당 base time을 반환해야 한다 (8시)", () => {
      expect(determineBaseTime("08:14", "08:16")).toBe(8);
    });

    test("범위에 base time이 없으면 null을 반환해야 한다", () => {
      expect(determineBaseTime("00:00", "01:00")).toBe(null);
    });
  });

  describe("generateDummyTimeArray", () => {
    test("22시~23시 범위의 시간 배열을 생성해야 한다", () => {
      const result = generateDummyTimeArray(22, 23);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test("1분 간격으로 생성되어야 한다 (약 120개)", () => {
      const result = generateDummyTimeArray(22, 23);
      // 22:00 ~ 23:59 = 120분
      expect(result.length).toBe(120);
    });
  });

  describe("baseTimes 상수", () => {
    test("8개의 base time이 있어야 한다", () => {
      expect(baseTimes.length).toBe(8);
    });

    test("3시간 간격이어야 한다", () => {
      for (let i = 1; i < baseTimes.length; i++) {
        expect(baseTimes[i] - baseTimes[i - 1]).toBe(3);
      }
    });
  });
});

