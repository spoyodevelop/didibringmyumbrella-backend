const fs = require("fs");
const { calculateSonagiMeter } = require("./sonagiMeterCalculation");

function getAllPOPs(capitals) {
  const totalPOPStats = {
    administrativeArea: "totalOfAllArea",
    totalArrayCount: 0,
    totalDidItRainCount: 0,
    POP0: { arrayLength: 0, didItRainLength: 0 },
    POP10: { arrayLength: 0, didItRainLength: 0 },
    POP20: { arrayLength: 0, didItRainLength: 0 },
    POP30: { arrayLength: 0, didItRainLength: 0 },
    POP40: { arrayLength: 0, didItRainLength: 0 },
    POP50: { arrayLength: 0, didItRainLength: 0 },
    POP60: { arrayLength: 0, didItRainLength: 0 },
    POP70: { arrayLength: 0, didItRainLength: 0 },
    POP80: { arrayLength: 0, didItRainLength: 0 },
    POP90: { arrayLength: 0, didItRainLength: 0 },
    POP100: { arrayLength: 0, didItRainLength: 0 },
    rainOutOfBlue: [],
  };

  for (const capital of capitals) {
    const dest = capital.administrativeArea;
    const weatherData = require(`./data/${dest}/POPstats.js`);

    const POPstats = weatherData.POPstats[weatherData.POPstats.length - 1];

    POPstats.rainOutOfBlue.forEach((item) => {
      totalPOPStats.rainOutOfBlue.push({ administrativeArea: dest, ...item });
    });
    for (let i = 0; i <= 100; i += 10) {
      //This SHOULDN'T HAPPEN
      if (typeof POPstats !== "object" || POPstats === null) {
        console.log("POPstats is not defined or is not an object.");
        continue;
      }

      const { arrayLength, didItRainLength } = POPstats[`POP${i}`];

      totalPOPStats[`POP${i}`].arrayLength += arrayLength;
      totalPOPStats[`POP${i}`].didItRainLength += didItRainLength;
      totalPOPStats.totalArrayCount += arrayLength;
      totalPOPStats.totalDidItRainCount += didItRainLength;
    }
  }
  const allPOPdataStats = require(`./data/totalOfAllArea/POPstats.js`);
  let { totalSonagiMeter } =
    allPOPdataStats.POPstats[allPOPdataStats.POPstats.length - 1];
  //if totalSonagiMeter is not defined, create an empty array
  if (!totalSonagiMeter) {
    totalSonagiMeter = [];
  }

  totalSonagiMeter.sort((a, b) => a.baseDate - b.baseDate);

  totalPOPStats.rainOutOfBlue.sort((a, b) => {
    return new Date(a?.baseDate) - new Date(b?.baseDate);
  });
  let sonagiMeter = calculateSonagiMeter(totalPOPStats);
  totalSonagiMeter.push({ baseDate: new Date(), sonagiMeter });
  return { totalPOPStats, totalSonagiMeter };
}
const writeTotalPOPDataToFile = async (destination, fileName, capital) => {
  const lastUpdatedSince = new Date();
  const { totalPOPStats, totalSonagiMeter } = getAllPOPs(capital);

  const newData = {
    lastUpdatedSince,
    ...totalPOPStats,
    totalSonagiMeter,
  };
  //add a updated date to data
  const filePath = `./data/${destination}/${fileName}.js`;
  const existingData = require(filePath);
  // Remove the first element of the array and push the new data
  existingData.POPstats.shift();
  existingData.POPstats.push(newData);

  fs.writeFileSync(
    filePath,
    `module.exports = ${JSON.stringify(existingData)};`
  );
  console.log(`Data successfully saved to ${filePath}`);
};

module.exports = {
  writeTotalPOPDataToFile,
};
