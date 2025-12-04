const fs = require("fs");
const path = require("path");

// data 폴더 경로 (프로젝트 루트 기준)
const DATA_DIR = path.join(__dirname, "../../../data");

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
    const filePath = path.join(DATA_DIR, dest, "POPstats.js");
    
    // Clear require cache
    delete require.cache[require.resolve(filePath)];
    const weatherData = require(filePath);

    const POPstats = weatherData.POPstats[weatherData.POPstats.length - 1];

    if (POPstats.rainOutOfBlue && Array.isArray(POPstats.rainOutOfBlue)) {
      POPstats.rainOutOfBlue.forEach((item) => {
        totalPOPStats.rainOutOfBlue.push({ administrativeArea: dest, ...item });
      });
    }

    for (let i = 0; i <= 100; i += 10) {
      if (typeof POPstats !== "object" || POPstats === null) {
        console.log(
          `Warning: POPstats is not defined or is not an object for ${dest}`
        );
        continue;
      }

      const { arrayLength, didItRainLength } = POPstats[`POP${i}`];

      totalPOPStats[`POP${i}`].arrayLength += arrayLength;
      totalPOPStats[`POP${i}`].didItRainLength += didItRainLength;
      totalPOPStats.totalArrayCount += arrayLength;
      totalPOPStats.totalDidItRainCount += didItRainLength;
    }
  }

  totalPOPStats.rainOutOfBlue.sort((a, b) => {
    return new Date(a.baseDate) - new Date(b.baseDate);
  });

  return totalPOPStats;
}

const writeTotalPOPDataToFile = async (destination, fileName, capital) => {
  const lastUpdatedSince = new Date();
  const totalPOPStats = getAllPOPs(capital);
  const newData = {
    lastUpdatedSince: lastUpdatedSince,
    ...totalPOPStats,
  };

  const filePath = path.join(DATA_DIR, destination, `${fileName}.js`);
  
  // Clear require cache
  delete require.cache[require.resolve(filePath)];
  const existingData = require(filePath);
  
  existingData.POPstats.shift();
  existingData.POPstats.push(newData);

  fs.writeFileSync(
    filePath,
    `module.exports = ${JSON.stringify(existingData)};`
  );
  console.log(`Data successfully saved to ${filePath}`);
};

module.exports = {
  getAllPOPs,
  writeTotalPOPDataToFile,
};

