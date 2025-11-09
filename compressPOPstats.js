const fs = require("fs");
const { CAPITAL_LOCATION } = require("./locations");

function compressPOPstatsFile(destination) {
  console.log(`압축 시작: ${destination}`);

  const filePath = `./data/${destination}/POPstats.js`;

  try {
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

    // 압축된 데이터 저장
    const compressedData = {
      POPstats: compressedPOPstats,
    };

    fs.writeFileSync(
      filePath,
      `module.exports = ${JSON.stringify(compressedData, null, 2)};`
    );

    console.log(`✅ 압축 완료: ${destination}`);

    // 파일 크기 확인
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   파일 크기: ${fileSizeInMB} MB`);
  } catch (error) {
    console.error(`❌ 압축 실패: ${destination}`, error.message);
  }
}

// 모든 지역의 POPstats 파일 압축
function compressAllPOPstats() {
  console.log("=".repeat(60));
  console.log("POPstats 파일 압축 시작");
  console.log("=".repeat(60));

  // CAPITAL_LOCATION 배열에서 각 지역 처리
  if (Array.isArray(CAPITAL_LOCATION)) {
    CAPITAL_LOCATION.forEach((capital) => {
      compressPOPstatsFile(capital.administrativeArea);
    });
  } else {
    const dataDir = "./data";
    const directories = fs
      .readdirSync(dataDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => name !== "totalOfAllArea");

    directories.forEach((destination) => {
      const popstatsPath = `${dataDir}/${destination}/POPstats.js`;
      if (fs.existsSync(popstatsPath)) {
        compressPOPstatsFile(destination);
      }
    });
  }

  const totalPath = "./data/totalOfAllArea/POPstats.js";
  if (fs.existsSync(totalPath)) {
    compressPOPstatsFile("totalOfAllArea");
  }

  console.log("=".repeat(60));
  console.log("✅ 모든 POPstats 파일 압축 완료");
  console.log("=".repeat(60));
}

// 스크립트 실행
if (require.main === module) {
  compressAllPOPstats();
}

module.exports = {
  compressPOPstatsFile,
  compressAllPOPstats,
};
