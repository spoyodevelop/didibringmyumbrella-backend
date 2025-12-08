const { executeManually: executeWeather } = require("./weather");
const { executeBackup } = require("./backup");

// 태스크 선언 - "무엇을" 실행할지만 표현
const MANUAL_TASKS = [
  {
    name: "날씨 데이터 수집",
    emoji: "📊",
    execute: executeWeather,
    skipWhen: "--backup-only",
  },
  {
    name: "백업",
    emoji: "📦",
    execute: () => executeBackup(true),
    skipWhen: "--weather-only",
  },
];

function shouldSkip(task, args) {
  return args.includes(task.skipWhen);
}

function getTasksToRun(tasks, args) {
  return tasks.filter((task) => !shouldSkip(task, args));
}

async function runTasks(tasks) {
  const total = tasks.length;

  for (const [i, task] of tasks.entries()) {
    const stepNum = i + 1;
    console.log(`${task.emoji} [${stepNum}/${total}] ${task.name} 시작...\n`);
    await task.execute();
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tasksToRun = getTasksToRun(MANUAL_TASKS, args);

  console.log("=".repeat(60));
  console.log("🚀 수동 실행 시작");
  console.log("=".repeat(60));
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log();

  const startTime = Date.now();

  try {
    await runTasks(tasksToRun);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

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
