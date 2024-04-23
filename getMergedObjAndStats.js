const fs = require("fs");
const { CAPITAL_LOCATION } = require("./locations");

// Function to write data to a file
const writeDataFile = (data, destination, fileName) => {
  const lastUpdatedSince = new Date();

  const newData = {
    lastUpdatedSince: lastUpdatedSince,
    administrativeArea: destination,
    ...Object.values(data).reduce((acc, val) => {
      const key = Object.keys(val)[0];
      acc[key] = val[key];
      return acc;
    }, {}),
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

async function getAllMergedObjAndSaveFile(capitals) {
  capitals.forEach((capital) => {
    const dest = capital.administrativeArea;
    const fileName = "weatherData";
    const weatherData = require(`./data/${dest}/${fileName}.js`);

    const saveByPOP = (data, popValue) => {
      return data
        .filter((item) => item.mergedObj.POP === popValue)
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
            filteredWeatherData: filteredData,
          },
        };
      }
    );

    // Save each set of filtered data

    writeDataFile(POPObjects, dest, "POPstats");
  });
}

// Call the function with capital locations
module.exports = {
  getAllMergedObjAndSaveFile,
};
