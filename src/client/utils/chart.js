/**
 * POP 데이터를 Nivo 차트용으로 변환
 * @param {Object} data - POP0~POP100 필드를 가진 날씨 데이터
 * @returns {Array} Nivo 차트용 배열 [{id, value}, ...]
 */
function transformDataForNivoChart(data) {
  const transformedData = [];

  Object.keys(data).forEach((key) => {
    if (key.startsWith("POP")) {
      if (
        data[key].didItRainCount &&
        typeof data[key].didItRainCount === "number" &&
        data[key].arrayLength &&
        typeof data[key].arrayLength === "number"
      ) {
        const percentage =
          (data[key].didItRainCount / data[key].arrayLength) * 100;

        if (!isNaN(percentage)) {
          transformedData.push({
            id: key,
            value: percentage,
          });
        }
      }
    }
  });

  return transformedData;
}

module.exports = { transformDataForNivoChart };

