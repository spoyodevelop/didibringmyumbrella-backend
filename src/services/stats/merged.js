const fs = require("fs");
const path = require("path");

// data 폴더 경로 (프로젝트 루트 기준)
const DATA_DIR = path.join(__dirname, "../../../data");

const writeDataFile = (data, destination, fileName) => {
  const lastUpdatedSince = new Date();

  let totalArrayCount = 0;
  let totalDidItRainCount = 0;

  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "rainOutOfBlue") {
        totalArrayCount += item[key].arrayLength;
        totalDidItRainCount += item[key].didItRainLength;
      }
    });
  });

  const newData = {
    lastUpdatedSince: lastUpdatedSince,
    administrativeArea: destination,
    totalArrayCount,
    totalDidItRainCount,
    ...Object.values(data).reduce((acc, val) => {
      const key = Object.keys(val)[0];
      acc[key] = val[key];
      return acc;
    }, {}),
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

async function getAllMergedObjAndSaveFile(capitals) {
  capitals.forEach((capital) => {
    const dest = capital.administrativeArea;
    const fileName = "weatherData";
    const filePath = path.join(DATA_DIR, dest, `${fileName}.js`);
    
    // Clear require cache
    delete require.cache[require.resolve(filePath)];
    const weatherData = require(filePath);

    const saveByPOP = (data, popValue) => {
      function rounding(number) {
        if (number % 10 < 5) {
          return Math.floor(number / 10) * 10;
        } else {
          return Math.ceil(number / 10) * 10;
        }
      }
      return data
        .filter((item) => rounding(item.mergedObj.POP) === popValue)
        .map((item) => item.mergedObj);
    };

    const POPObjects = Array.from({ length: 11 }, (_, index) => index * 10).map(
      (popValue) => {
        const filteredData = saveByPOP(weatherData.weatherData, popValue);
        return {
          [`POP${popValue}`]: {
            arrayLength: filteredData.length,
            didItRainLength: filteredData.filter(
              (item) => item.didItRain === true
            ).length,
          },
        };
      }
    );

    const rainOutOfBlueData = saveByPOP(weatherData.weatherData, 0).filter(
      (item) => item.didItRain === true
    );

    POPObjects.push({
      rainOutOfBlue: rainOutOfBlueData,
    });

    writeDataFile(POPObjects, dest, "POPstats");
  });
}

const getFilteredWeatherData = (destination, popValue) => {
  const fileName = "weatherData";
  const filePath = path.join(DATA_DIR, destination, `${fileName}.js`);
  
  // Clear require cache
  delete require.cache[require.resolve(filePath)];
  const weatherData = require(filePath);

  function rounding(number) {
    if (number % 10 < 5) {
      return Math.floor(number / 10) * 10;
    } else {
      return Math.ceil(number / 10) * 10;
    }
  }

  return weatherData.weatherData
    .filter((item) => rounding(item.mergedObj.POP) === popValue)
    .map((item) => item.mergedObj);
};

const getRainOutOfBlueData = (destination) => {
  const fileName = "POPstats";
  const filePath = path.join(DATA_DIR, destination, `${fileName}.js`);
  
  // Clear require cache
  delete require.cache[require.resolve(filePath)];
  const popstatsData = require(filePath);
  
  const latestStats = popstatsData.POPstats[popstatsData.POPstats.length - 1];
  return latestStats.rainOutOfBlue || [];
};

module.exports = {
  getAllMergedObjAndSaveFile,
  getFilteredWeatherData,
  getRainOutOfBlueData,
};

