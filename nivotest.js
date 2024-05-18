function transformDataForNivoChart(data) {
  // Initialize the array to store the transformed data
  const transformedData = [];

  // Iterate over the keys of the data object
  Object.keys(data).forEach((key) => {
    // Check if the key starts with "POP"
    if (key.startsWith("POP")) {
      // Ensure the data object has the required properties and they are numbers
      if (
        data[key].didItRainCount &&
        typeof data[key].didItRainCount === "number" &&
        data[key].arrayLength &&
        typeof data[key].arrayLength === "number"
      ) {
        // Calculate the percentage
        const percentage =
          (data[key].didItRainCount / data[key].arrayLength) * 100;

        // Check if the percentage is NaN
        if (!isNaN(percentage)) {
          // Create a transformed data object
          const transformedItem = {
            id: key, // POP category name
            value: percentage, // Percentage value
          };

          // Add the transformed item to the array
          transformedData.push(transformedItem);
        }
      }
    }
  });

  return transformedData;
}

const data = {
  DBData: {
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
  },
};
console.log(transformDataForNivoChart(data.DBData));
