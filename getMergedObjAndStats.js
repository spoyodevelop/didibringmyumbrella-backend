const fs = require("fs");
const { CAPITAL_LOCATION } = require("./locations");

// Function to write data to a file
const writeDataFile = (data, destination, fileName) => {
  const lastUpdatedSince = new Date();

  let totalArrayCount = 0;
  let totalDidItRainCount = 0;

  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      // Add arrayLength and didItRainLength to totals
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

async function getAllMergedObjAndSaveFile(capitals) {
  capitals.forEach((capital) => {
    const dest = capital.administrativeArea;
    const fileName = "weatherData";
    const weatherData = require(`./data/${dest}/${fileName}.js`);
    //todo: adjust data that should be round-to-nearest-even after 2 weeks or so.
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

    // 0부터 100까지 10 단위로 POP 값에 대한 객체들 저장
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
  const weatherData = require(`./data/${destination}/${fileName}.js`);

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
  const popstatsData = require(`./data/${destination}/${fileName}.js`);
  const latestStats = popstatsData.POPstats[popstatsData.POPstats.length - 1];
  return latestStats.rainOutOfBlue || [];
};

module.exports = {
  getAllMergedObjAndSaveFile,
  getFilteredWeatherData,
  getRainOutOfBlueData,
};
