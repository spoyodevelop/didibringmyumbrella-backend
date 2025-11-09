// getMergedObjAndStats.js 사용 예시

const {
  getAllMergedObjAndSaveFile,
  getFilteredWeatherData,
  getRainOutOfBlueData,
} = require("./getMergedObjAndStats");

const popStats = require("./data/Seoul/POPstats.js");

console.log("서울 최신 통계:");
const latestStats = popStats.POPstats[popStats.POPstats.length - 1];
console.log(`- 업데이트 시간: ${latestStats.lastUpdatedSince}`);
console.log(`- 전체 데이터 수: ${latestStats.totalArrayCount}`);
console.log(`- 실제 비 온 횟수: ${latestStats.totalDidItRainCount}`);
console.log(`- POP 30% 데이터 수: ${latestStats.POP30.arrayLength}`);
console.log(`- POP 30%에서 비 온 횟수: ${latestStats.POP30.didItRainLength}`);
console.log(
  `- 청천벽력 (POP 0%인데 비 온 경우): ${latestStats.rainOutOfBlue.length}회`
);
if (latestStats.rainOutOfBlue.length > 0) {
  console.log(`  예시:`, latestStats.rainOutOfBlue[0]);
}

console.log("\n--- 필요할 때 데이터 가져오기 ---");

const pop30Data = getFilteredWeatherData("Seoul", 30);
console.log(`\nPOP 30% 실제 데이터 (첫 3개):`, pop30Data.slice(0, 3));

const rainOutOfBlue = getRainOutOfBlueData("Seoul");
console.log(`\n아니땐 비 ${rainOutOfBlue.length}개`);
console.log(`첫 2개:`, rainOutOfBlue.slice(0, 2));

console.log("\n--- MongoDB 업로드 예시 ---");
const dataForMongoDB = {
  administrativeArea: latestStats.administrativeArea,
  lastUpdatedSince: latestStats.lastUpdatedSince,
  totalArrayCount: latestStats.totalArrayCount,
  totalDidItRainCount: latestStats.totalDidItRainCount,
  POP0: latestStats.POP0,
  POP10: latestStats.POP10,
  POP20: latestStats.POP20,
  POP30: latestStats.POP30,
  POP40: latestStats.POP40,
  POP50: latestStats.POP50,
  POP60: latestStats.POP60,
  POP70: latestStats.POP70,
  POP80: latestStats.POP80,
  POP90: latestStats.POP90,
  POP100: latestStats.POP100,
  rainOutOfBlue: latestStats.rainOutOfBlue,
};

console.log(
  "MongoDB에 올릴 데이터 구조:",
  JSON.stringify(dataForMongoDB, null, 2)
);
