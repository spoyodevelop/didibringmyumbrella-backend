#!/usr/bin/env node
/**
 * 수동 실행 스크립트
 * Weather + Backup을 순차적으로 실행합니다.
 * 
 * Usage: node src/cron/manual.js [--weather-only] [--backup-only]
 */

const { executeManually: executeWeather } = require("./weather");

// backup.js에서 executeBackup을 동적으로 가져옴 (순환 참조 방지)
async function executeBackup() {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);
  const path = require("path");

  const backupScript = path.join(__dirname, "backup.js");
  
  console.log("\n📦 백업 스크립트 실행 중...");
  
  try {
    const { stdout, stderr } = await execAsync(`node "${backupScript}" --manual`, {
      timeout: 10 * 60 * 1000, // 10분 타임아웃
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    return { success: true };
  } catch (error) {
    console.error("백업 실패:", error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const weatherOnly = args.includes("--weather-only");
  const backupOnly = args.includes("--backup-only");
  
  console.log("=".repeat(60));
  console.log("🚀 수동 실행 시작");
  console.log("=".repeat(60));
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log();

  const startTime = Date.now();
  
  try {
    // Weather 실행
    if (!backupOnly) {
      console.log("📊 [1/2] 날씨 데이터 수집 시작...\n");
      await executeWeather();
      console.log();
    }

    // Backup 실행 (weather 완료 후 순차 실행 = 동시성 문제 없음!)
    if (!weatherOnly) {
      console.log("📦 [2/2] 백업 시작...\n");
      await executeBackup();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log();
    console.log("=".repeat(60));
    console.log(`✅ 전체 완료! (총 ${duration}초)`);
    console.log("=".repeat(60));
    
    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.error();
    console.error("=".repeat(60));
    console.error(`❌ 실패! (${duration}초 경과)`);
    console.error(`에러: ${error.message}`);
    console.error("=".repeat(60));
    
    process.exit(1);
  }
}

main();

