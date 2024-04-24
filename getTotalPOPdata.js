function getAllPOPs(capitals) {
  const date = new Date();
  const totalPOPStats = {
    lastUpdatedSince: date,
    administrativeArea: "totalOfAllArea",
    totalArrayCount: 0,
    totalDidItRainCount: 0,
    POP0: { arrayLength: 0, didItRainCount: 0 },
    POP10: { arrayLength: 0, didItRainCount: 0 },
    POP20: { arrayLength: 0, didItRainCount: 0 },
    POP30: { arrayLength: 0, didItRainCount: 0 },
    POP40: { arrayLength: 0, didItRainCount: 0 },
    POP50: { arrayLength: 0, didItRainCount: 0 },
    POP60: { arrayLength: 0, didItRainCount: 0 },
    POP70: { arrayLength: 0, didItRainCount: 0 },
    POP80: { arrayLength: 0, didItRainCount: 0 },
    POP90: { arrayLength: 0, didItRainCount: 0 },
    POP100: { arrayLength: 0, didItRainCount: 0 },
  };

  for (const capital of capitals) {
    const dest = capital.administrativeArea;
    const weatherData = require(`./data/${dest}/POPstats.js`);

    const POPstats = weatherData.POPstats[weatherData.POPstats.length - 1];

    for (let i = 0; i <= 100; i += 10) {
      //This SHOULDN'T HAPPEN
      if (typeof POPstats !== "object" || POPstats === null) {
        console.log("POPstats is not defined or is not an object.");
        continue;
      }
      const { arrayLength, didItRainLength } = POPstats[`POP${i}`];
      totalPOPStats[`totalPOP${i}`].arrayLength += arrayLength;
      totalPOPStats[`totalPOP${i}`].didItRainCount += didItRainLength;
      totalPOPStats.totalArrayCount += arrayLength;
      totalPOPStats.totalDidItRainCount += didItRainLength;
    }
  }
  return totalPOPStats;
}

module.exports = {
  getAllPOPs,
};
