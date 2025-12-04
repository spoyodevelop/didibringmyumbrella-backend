const fs = require("fs");
const path = require("path");
const { CAPITAL_LOCATION } = require("../../config/locations");

// data 폴더 경로 (프로젝트 루트 기준)
const DATA_DIR = path.join(__dirname, "../../../data");

function compressPOPstatsFile(destination) {
  console.log(`압축 시작: ${destination}`);

  const filePath = path.join(DATA_DIR, destination, "POPstats.js");

  try {
    // Clear require cache
    delete require.cache[require.resolve(filePath)];
    const existingData = require(filePath);

    const compressedPOPstats = existingData.POPstats.map((statEntry) => {
      const compressedEntry = {
        lastUpdatedSince: statEntry.lastUpdatedSince,
        administrativeArea: statEntry.administrativeArea,
        totalArrayCount: statEntry.totalArrayCount,
        totalDidItRainCount: statEntry.totalDidItRainCount,
      };

      for (let i = 0; i <= 100; i += 10) {
        const key = `POP${i}`;
        if (statEntry[key]) {
          compressedEntry[key] = {
            arrayLength: statEntry[key].arrayLength,
            didItRainLength: statEntry[key].didItRainLength,
          };
        }
      }

      if (statEntry.rainOutOfBlue) {
        compressedEntry.rainOutOfBlue = statEntry.rainOutOfBlue;
      }

      return compressedEntry;
    });

    const compressedData = {
      POPstats: compressedPOPstats,
    };

    fs.writeFileSync(
      filePath,
      `module.exports = ${JSON.stringify(compressedData, null, 2)};`
    );

    console.log(`✅ 압축 완료: ${destination}`);

    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   파일 크기: ${fileSizeInMB} MB`);
  } catch (error) {
    console.error(`❌ 압축 실패: ${destination}`, error.message);
  }
}

function compressAllPOPstats() {
  console.log("=".repeat(60));
  console.log("POPstats 파일 압축 시작");
  console.log("=".repeat(60));

  if (Array.isArray(CAPITAL_LOCATION)) {
    CAPITAL_LOCATION.forEach((capital) => {
      compressPOPstatsFile(capital.administrativeArea);
    });
  } else {
    const directories = fs
      .readdirSync(DATA_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => name !== "totalOfAllArea");

    directories.forEach((destination) => {
      const popstatsPath = path.join(DATA_DIR, destination, "POPstats.js");
      if (fs.existsSync(popstatsPath)) {
        compressPOPstatsFile(destination);
      }
    });
  }

  const totalPath = path.join(DATA_DIR, "totalOfAllArea", "POPstats.js");
  if (fs.existsSync(totalPath)) {
    compressPOPstatsFile("totalOfAllArea");
  }

  console.log("=".repeat(60));
  console.log("✅ 모든 POPstats 파일 압축 완료");
  console.log("=".repeat(60));
}

// 스크립트 직접 실행 시
if (require.main === module) {
  compressAllPOPstats();
}

module.exports = {
  compressPOPstatsFile,
  compressAllPOPstats,
};

