const { CAPITAL_LOCATION } = require("../src/config/locations");
const { getFilteredWeatherData, getRainOutOfBlueData } = require("../src/services/stats/merged");

describe("마이그레이션 테스트", () => {
  describe("압축된 POPstats 파일 읽기", () => {
    let seoulData;
    let latestStats;

    beforeAll(() => {
      seoulData = require("../data/Seoul/POPstats.js");
      latestStats = seoulData.POPstats[seoulData.POPstats.length - 1];
    });

    test("필수 필드(POP0, POP30, rainOutOfBlue)가 존재해야 한다", () => {
      expect(latestStats.POP0).toBeDefined();
      expect(latestStats.POP30).toBeDefined();
      expect(latestStats.rainOutOfBlue).toBeDefined();
    });

    test("filteredWeatherData가 제거되어야 한다", () => {
      expect(latestStats.POP0.filteredWeatherData).toBeUndefined();
    });

    test("rainOutOfBlue가 올바른 형식(count 필드 또는 배열)이어야 한다", () => {
      const hasCount = latestStats.rainOutOfBlue.count !== undefined;
      const isArray = Array.isArray(latestStats.rainOutOfBlue);
      expect(hasCount || isArray).toBe(true);
    });

    test("POP0에 arrayLength와 didItRainLength가 있어야 한다", () => {
      expect(latestStats.POP0.arrayLength).toBeDefined();
      expect(latestStats.POP0.didItRainLength).toBeDefined();
    });
  });

  describe("필터링 함수 테스트", () => {
    let pop30Data;

    beforeAll(() => {
      pop30Data = getFilteredWeatherData("Seoul", 30);
    });

    test("반환값이 배열이어야 한다", () => {
      expect(Array.isArray(pop30Data)).toBe(true);
    });

    test("데이터가 비어있지 않아야 한다", () => {
      expect(pop30Data.length).toBeGreaterThan(0);
    });

    test("데이터에 POP과 baseDate가 있어야 한다", () => {
      expect(pop30Data[0].POP).toBeDefined();
      expect(pop30Data[0].baseDate).toBeDefined();
    });
  });

  describe("청천벽력 데이터 가져오기", () => {
    let rainData;

    beforeAll(() => {
      rainData = getRainOutOfBlueData("Seoul");
    });

    test("반환값이 배열이어야 한다", () => {
      expect(Array.isArray(rainData)).toBe(true);
    });

    test("모든 데이터가 POP 0(반올림)이고 didItRain이 true여야 한다", () => {
      const rounding = (number) => {
        if (number % 10 < 5) {
          return Math.floor(number / 10) * 10;
        } else {
          return Math.ceil(number / 10) * 10;
        }
      };

      rainData.forEach((item) => {
        const popRounded = rounding(item.POP);
        expect(popRounded).toBe(0);
        expect(item.didItRain).toBe(true);
      });
    });
  });

  describe("모든 지역 POPstats 파일 검증", () => {
    test.each(CAPITAL_LOCATION.map((c) => [c.administrativeArea]))(
      "%s 지역의 POPstats가 올바르게 압축되어 있어야 한다",
      (dest) => {
        const popstatsData = require(`../data/${dest}/POPstats.js`);
        const latestStats = popstatsData.POPstats[popstatsData.POPstats.length - 1];

        // 0~100까지 10단위로 POP 필드 확인
        for (let i = 0; i <= 100; i += 10) {
          const key = `POP${i}`;
          expect(latestStats[key]).toBeDefined();
          expect(latestStats[key].filteredWeatherData).toBeUndefined();
        }

        // rainOutOfBlue 확인
        expect(latestStats.rainOutOfBlue).toBeDefined();
        const hasCount = latestStats.rainOutOfBlue.count !== undefined;
        const isArray = Array.isArray(latestStats.rainOutOfBlue);
        expect(hasCount || isArray).toBe(true);
      }
    );
  });

  describe("totalOfAllArea 검증", () => {
    let latestStats;

    beforeAll(() => {
      const totalData = require("../data/totalOfAllArea/POPstats.js");
      latestStats = totalData.POPstats[totalData.POPstats.length - 1];
    });

    test("totalArrayCount가 존재해야 한다", () => {
      expect(latestStats.totalArrayCount).toBeDefined();
    });

    test("rainOutOfBlue가 존재해야 한다", () => {
      expect(latestStats.rainOutOfBlue).toBeDefined();
    });

    test("rainOutOfBlue가 올바른 형식이어야 한다", () => {
      const hasCount = latestStats.rainOutOfBlue.count !== undefined;
      const isArray = Array.isArray(latestStats.rainOutOfBlue);
      expect(hasCount || isArray).toBe(true);
    });

    test("totalDidItRainCount가 존재해야 한다", () => {
      expect(latestStats.totalDidItRainCount).toBeDefined();
    });
  });
});
