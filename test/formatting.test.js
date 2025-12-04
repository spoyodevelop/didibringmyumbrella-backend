const {
  getFilteredWeatherData,
  getRainOutOfBlueData,
} = require("../src/services/stats/merged");

const popStats = require("../data/Seoul/POPstats.js");

describe("서울 통계 데이터 포맷팅 테스트", () => {
  let latestStats;

  beforeAll(() => {
    latestStats = popStats.POPstats[popStats.POPstats.length - 1];
  });

  describe("최신 통계 데이터 구조 검증", () => {
    test("lastUpdatedSince가 존재해야 한다", () => {
      expect(latestStats.lastUpdatedSince).toBeDefined();
    });

    test("totalArrayCount가 숫자여야 한다", () => {
      expect(typeof latestStats.totalArrayCount).toBe("number");
      expect(latestStats.totalArrayCount).toBeGreaterThan(0);
    });

    test("totalDidItRainCount가 숫자여야 한다", () => {
      expect(typeof latestStats.totalDidItRainCount).toBe("number");
    });

    test("POP30에 arrayLength와 didItRainLength가 있어야 한다", () => {
      expect(latestStats.POP30.arrayLength).toBeDefined();
      expect(latestStats.POP30.didItRainLength).toBeDefined();
    });

    test("rainOutOfBlue가 배열이어야 한다", () => {
      expect(Array.isArray(latestStats.rainOutOfBlue)).toBe(true);
    });
  });

  describe("getFilteredWeatherData 함수 테스트", () => {
    let pop30Data;

    beforeAll(() => {
      pop30Data = getFilteredWeatherData("Seoul", 30);
    });

    test("POP 30% 데이터를 배열로 반환해야 한다", () => {
      expect(Array.isArray(pop30Data)).toBe(true);
    });

    test("반환된 데이터가 비어있지 않아야 한다", () => {
      expect(pop30Data.length).toBeGreaterThan(0);
    });

    test("각 데이터에 POP 필드가 있어야 한다", () => {
      pop30Data.slice(0, 3).forEach((item) => {
        expect(item.POP).toBeDefined();
      });
    });
  });

  describe("getRainOutOfBlueData 함수 테스트", () => {
    let rainOutOfBlue;

    beforeAll(() => {
      rainOutOfBlue = getRainOutOfBlueData("Seoul");
    });

    test("배열로 반환해야 한다", () => {
      expect(Array.isArray(rainOutOfBlue)).toBe(true);
    });

    test("청천벽력 데이터에 필수 필드가 있어야 한다", () => {
      if (rainOutOfBlue.length > 0) {
        expect(rainOutOfBlue[0].POP).toBeDefined();
        expect(rainOutOfBlue[0].didItRain).toBe(true);
      }
    });
  });

  describe("MongoDB 업로드용 데이터 구조 검증", () => {
    let dataForMongoDB;

    beforeAll(() => {
      dataForMongoDB = {
        administrativeArea: latestStats.administrativeArea,
        lastUpdatedSince: latestStats.lastUpdatedSince,
        totalArrayCount: latestStats.totalArrayCount,
        totalDidItRainCount: latestStats.totalDidItRainCount,
        POP0: latestStats.POP0,
        POP10: latestStats.POP10,
        POP20: latestStats.POP20,
        POP30: latestStats.POP30,
        POP40: latestStats.POP40,
        POP50: latestStats.POP50,
        POP60: latestStats.POP60,
        POP70: latestStats.POP70,
        POP80: latestStats.POP80,
        POP90: latestStats.POP90,
        POP100: latestStats.POP100,
        rainOutOfBlue: latestStats.rainOutOfBlue,
      };
    });

    test("administrativeArea가 Seoul이어야 한다", () => {
      expect(dataForMongoDB.administrativeArea).toBe("Seoul");
    });

    test("모든 POP 필드(0~100)가 존재해야 한다", () => {
      for (let i = 0; i <= 100; i += 10) {
        expect(dataForMongoDB[`POP${i}`]).toBeDefined();
      }
    });

    test("각 POP 필드에 arrayLength가 있어야 한다", () => {
      for (let i = 0; i <= 100; i += 10) {
        expect(dataForMongoDB[`POP${i}`].arrayLength).toBeDefined();
      }
    });

    test("rainOutOfBlue가 존재해야 한다", () => {
      expect(dataForMongoDB.rainOutOfBlue).toBeDefined();
    });
  });
});
