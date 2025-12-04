const { transformDataForNivoChart } = require("../utils/chart");

describe("Nivo 차트 변환 테스트", () => {
  const mockData = {
    _id: "66272d03e1664fe341afd36c",
    administrativeArea: "Seoul",
    lastUpdatedSince: "2024-05-06T12:15:01.273Z",
    totalArrayCount: 123,
    totalDidItRainCount: 10,
    POP0: { arrayLength: 64, didItRainCount: 0 },
    POP10: { arrayLength: 0, didItRainCount: 0 },
    POP20: { arrayLength: 15, didItRainCount: 0 },
    POP30: { arrayLength: 29, didItRainCount: 0 },
    POP40: { arrayLength: 0, didItRainCount: 0 },
    POP50: { arrayLength: 0, didItRainCount: 0 },
    POP60: { arrayLength: 10, didItRainCount: 5 },
    POP70: { arrayLength: 3, didItRainCount: 3 },
    POP80: { arrayLength: 0, didItRainCount: 0 },
    POP90: { arrayLength: 1, didItRainCount: 1 },
    POP100: { arrayLength: 1, didItRainCount: 1 },
  };

  test("POP 데이터를 Nivo 차트 형식으로 변환해야 한다", () => {
    const result = transformDataForNivoChart(mockData);
    expect(Array.isArray(result)).toBe(true);
  });

  test("각 항목에 id와 value가 있어야 한다", () => {
    const result = transformDataForNivoChart(mockData);
    result.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.value).toBeDefined();
    });
  });

  test("POP60의 비율이 50%여야 한다 (5/10)", () => {
    const result = transformDataForNivoChart(mockData);
    const pop60 = result.find((item) => item.id === "POP60");
    expect(pop60.value).toBe(50);
  });

  test("POP70, POP90, POP100의 비율이 100%여야 한다", () => {
    const result = transformDataForNivoChart(mockData);
    const pop70 = result.find((item) => item.id === "POP70");
    const pop90 = result.find((item) => item.id === "POP90");
    const pop100 = result.find((item) => item.id === "POP100");

    expect(pop70.value).toBe(100);
    expect(pop90.value).toBe(100);
    expect(pop100.value).toBe(100);
  });

  test("arrayLength가 0인 POP은 결과에 포함되지 않아야 한다", () => {
    const result = transformDataForNivoChart(mockData);
    const pop10 = result.find((item) => item.id === "POP10");
    expect(pop10).toBeUndefined();
  });

  test("POP이 아닌 필드는 무시해야 한다", () => {
    const result = transformDataForNivoChart(mockData);
    const nonPop = result.find((item) => !item.id.startsWith("POP"));
    expect(nonPop).toBeUndefined();
  });
});

