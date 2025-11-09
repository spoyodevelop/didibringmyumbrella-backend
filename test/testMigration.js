const { CAPITAL_LOCATION } = require("./locations");

console.log("=".repeat(60));
console.log("마이그레이션 테스트 시작");
console.log("=".repeat(60));

let passCount = 0;
let failCount = 0;

// 테스트 1: 압축된 POPstats 파일 읽기
console.log("\n[테스트 1] 압축된 POPstats 파일 읽기");
try {
  const seoulData = require("./data/Seoul/POPstats.js");
  const latestStats = seoulData.POPstats[seoulData.POPstats.length - 1];

  // 필수 필드 확인
  if (!latestStats.POP0 || !latestStats.POP30 || !latestStats.rainOutOfBlue) {
    throw new Error("필수 필드 누락");
  }

  // filteredWeatherData가 제거되었는지 확인
  if (latestStats.POP0.filteredWeatherData) {
    throw new Error("filteredWeatherData가 여전히 존재합니다!");
  }

  // rainOutOfBlue가 객체 형태인지 확인
  if (
    !latestStats.rainOutOfBlue.count &&
    latestStats.rainOutOfBlue.count !== 0
  ) {
    throw new Error("rainOutOfBlue가 올바른 형식이 아닙니다");
  }

  console.log("✅ 통과: 압축된 데이터 구조가 올바릅니다");
  console.log(
    `   - POP0: arrayLength=${latestStats.POP0.arrayLength}, didItRainLength=${latestStats.POP0.didItRainLength}`
  );
  console.log(`   - rainOutOfBlue: count=${latestStats.rainOutOfBlue.count}`);
  passCount++;
} catch (error) {
  console.log(`❌ 실패: ${error.message}`);
  failCount++;
}

// 테스트 2: getFilteredWeatherData 함수
console.log("\n[테스트 2] 필터링 함수 테스트");
try {
  const { getFilteredWeatherData } = require("./getMergedObjAndStats");
  const pop30Data = getFilteredWeatherData("Seoul", 30);

  if (!Array.isArray(pop30Data)) {
    throw new Error("반환값이 배열이 아닙니다");
  }

  if (pop30Data.length === 0) {
    throw new Error("데이터가 비어있습니다");
  }

  // 첫 번째 데이터 확인
  if (!pop30Data[0].POP || !pop30Data[0].baseDate) {
    throw new Error("데이터 구조가 올바르지 않습니다");
  }

  console.log(`✅ 통과: POP30 데이터 ${pop30Data.length}개 가져오기 성공`);
  console.log(
    `   - 첫 번째 데이터: POP=${pop30Data[0].POP}, didItRain=${pop30Data[0].didItRain}`
  );
  passCount++;
} catch (error) {
  console.log(`❌ 실패: ${error.message}`);
  failCount++;
}

// 테스트 3: getRainOutOfBlueData 함수
console.log("\n[테스트 3] 청천벽력 데이터 가져오기");
try {
  const { getRainOutOfBlueData } = require("./getMergedObjAndStats");
  const rainData = getRainOutOfBlueData("Seoul");

  if (!Array.isArray(rainData)) {
    throw new Error("반환값이 배열이 아닙니다");
  }

  // 모든 데이터가 POP 0이고 didItRain이 true인지 확인
  const allValid = rainData.every((item) => {
    const popRounded =
      item.POP % 10 < 5
        ? Math.floor(item.POP / 10) * 10
        : Math.ceil(item.POP / 10) * 10;
    return popRounded === 0 && item.didItRain === true;
  });

  if (!allValid) {
    throw new Error("청천벽력 데이터가 조건을 만족하지 않습니다");
  }

  console.log(`✅ 통과: 청천벽력 데이터 ${rainData.length}개 가져오기 성공`);
  passCount++;
} catch (error) {
  console.log(`❌ 실패: ${error.message}`);
  failCount++;
}

// 테스트 4: 모든 지역 POPstats 확인
console.log("\n[테스트 4] 모든 지역 POPstats 파일 검증");
try {
  let allRegionsValid = true;
  const invalidRegions = [];

  CAPITAL_LOCATION.forEach((capital) => {
    try {
      const dest = capital.administrativeArea;
      const popstatsData = require(`./data/${dest}/POPstats.js`);
      const latestStats =
        popstatsData.POPstats[popstatsData.POPstats.length - 1];

      // 필수 필드 확인
      for (let i = 0; i <= 100; i += 10) {
        const key = `POP${i}`;
        if (!latestStats[key] || latestStats[key].filteredWeatherData) {
          allRegionsValid = false;
          invalidRegions.push(dest);
          break;
        }
      }

      // rainOutOfBlue 확인
      if (
        !latestStats.rainOutOfBlue ||
        (latestStats.rainOutOfBlue.count === undefined &&
          !Array.isArray(latestStats.rainOutOfBlue))
      ) {
        allRegionsValid = false;
        invalidRegions.push(dest);
      }
    } catch (error) {
      allRegionsValid = false;
      invalidRegions.push(capital.administrativeArea);
    }
  });

  if (!allRegionsValid) {
    throw new Error(
      `일부 지역의 데이터가 올바르지 않습니다: ${invalidRegions.join(", ")}`
    );
  }

  console.log(
    `✅ 통과: ${CAPITAL_LOCATION.length}개 지역 모두 올바르게 압축됨`
  );
  passCount++;
} catch (error) {
  console.log(`❌ 실패: ${error.message}`);
  failCount++;
}

// 테스트 5: totalOfAllArea 확인
console.log("\n[테스트 5] totalOfAllArea 검증");
try {
  const totalData = require("./data/totalOfAllArea/POPstats.js");
  const latestStats = totalData.POPstats[totalData.POPstats.length - 1];

  if (!latestStats.totalArrayCount || !latestStats.rainOutOfBlue) {
    throw new Error("totalOfAllArea 데이터 구조가 올바르지 않습니다");
  }

  // rainOutOfBlue가 객체 형태인지 확인
  if (
    latestStats.rainOutOfBlue.count === undefined &&
    !Array.isArray(latestStats.rainOutOfBlue)
  ) {
    throw new Error("rainOutOfBlue 형식이 올바르지 않습니다");
  }

  console.log(`✅ 통과: totalOfAllArea 데이터 구조 정상`);
  console.log(`   - 전체 데이터 수: ${latestStats.totalArrayCount}`);
  console.log(`   - 실제 비 온 횟수: ${latestStats.totalDidItRainCount}`);
  passCount++;
} catch (error) {
  console.log(`❌ 실패: ${error.message}`);
  failCount++;
}

// 결과 요약
console.log("\n" + "=".repeat(60));
console.log("테스트 결과");
console.log("=".repeat(60));
console.log(`✅ 통과: ${passCount}개`);
console.log(`❌ 실패: ${failCount}개`);

if (failCount === 0) {
  console.log(
    "\n🎉 모든 테스트 통과! 마이그레이션이 성공적으로 완료되었습니다."
  );
  console.log("\n다음 단계:");
  console.log("1. MongoDB 마이그레이션 실행: node migrateMongoDBSchema.js");
  console.log("2. Cron job 재시작");
} else {
  console.log("\n⚠️ 일부 테스트 실패. 위의 오류를 확인하세요.");
}

console.log("=".repeat(60));
