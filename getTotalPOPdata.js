const fs = require("fs");
const { CAPITAL_LOCATION } = require("./locations");

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
      totalPOPStats[`POP${i}`].arrayLength += arrayLength;
      totalPOPStats[`POP${i}`].didItRainLength += didItRainLength;
      totalPOPStats.totalArrayCount += arrayLength;
      totalPOPStats.totalDidItRainCount += didItRainLength;
    }
  }
  return totalPOPStats;
}
const writeTotalPOPDataToFile = async (destination, fileName, capital) => {
  const lastUpdatedSince = new Date();
  const totalPOPStats = getAllPOPs(capital);
  const newData = {
    lastUpdatedSince: lastUpdatedSince,
    ...totalPOPStats,
  };
  //add a updated date to data
  const filePath = `./data/${destination}/${fileName}.js`;
  const existingData = require(filePath);

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
