function calculateSonagiMeter(allPOPdata) {
  const weights = {
    POP0: 4,
    POP10: 2,
    POP20: 2,
    POP30: 2,
  };

  // 각 확률 구간에서 비가 온 비율을 계산합니다.
  const rainRatios = (allPOPdata) => {
    return {
      POP0: allPOPdata.POP0.didItRainLength,
      POP10: allPOPdata.POP10.didItRainLength,
      POP20: allPOPdata.POP20.didItRainLength,
      POP30: allPOPdata.POP30.didItRainLength,
    };
  };

  // 가중 평균 계산 함수
  function calculateWeightedAverage(rainRatios, weights) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (let pop in rainRatios) {
      if (rainRatios?.hasOwnProperty(pop) && weights?.hasOwnProperty(pop)) {
        weightedSum += rainRatios[pop] * weights[pop];
        totalWeight += weights[pop];
      }
    }

    return weightedSum / totalWeight;
  }
  const rainRatiosData = rainRatios(allPOPdata);

  // 가중 평균 계산
  const weightedAverage = calculateWeightedAverage(rainRatiosData, weights);
  return weightedAverage;
}
module.exports = { calculateSonagiMeter };
