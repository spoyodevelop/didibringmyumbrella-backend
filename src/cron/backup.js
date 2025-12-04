const schedule = require("node-schedule");
const Sentry = require("@sentry/node");
const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
require("dotenv").config();

const execAsync = promisify(exec);

// Sentry 초기화
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: 0,
  maxBreadcrumbs: 30,
});

// 설정
const BACKUP_CONFIG = {
  source: path.join(__dirname, "../../data/"),
  destination: "spoyodrive:WeatherData/",
  schedule: "30 0 * * *", // 매일 0시 30분
};

console.log("🚀 Backup Cron Service starting...");

function getSeoulLastUpdated() {
  try {
    const seoulPath = path.join(BACKUP_CONFIG.source, "Seoul/POPstats.js");
    delete require.cache[require.resolve(seoulPath)];

    const data = require(seoulPath);
    const stats = data.POPstats;
    const last = stats[stats.length - 1];

    return {
      lastUpdatedSince: last.lastUpdatedSince,
      totalArrayCount: last.totalArrayCount,
      administrativeArea: last.administrativeArea,
    };
  } catch (error) {
    console.error("Failed to get Seoul metadata:", error.message);
    return null;
  }
}

async function getFolderSize() {
  try {
    const { stdout } = await execAsync(`du -sm "${BACKUP_CONFIG.source}"`);
    const sizeMB = parseInt(stdout.split("\t")[0], 10);
    return sizeMB;
  } catch (error) {
    console.error("Failed to get folder size:", error.message);
    return null;
  }
}

async function runBackup() {
  const command = `rclone sync "${BACKUP_CONFIG.source}" "${BACKUP_CONFIG.destination}" --verbose`;

  console.log(`📦 Executing: ${command}`);

  const { stdout, stderr } = await execAsync(command, {
    timeout: 10 * 60 * 1000, // 10분 타임아웃
  });

  if (stdout) console.log("stdout:", stdout);
  if (stderr) console.log("stderr:", stderr);

  return { stdout, stderr };
}

async function executeBackup(isManual = false) {
  const executionId = Date.now();
  const startTime = new Date();
  const triggerType = isManual ? "manual" : "scheduled";

  console.log(
    `[${startTime.toISOString()}] Backup job started (ID: ${executionId}, trigger: ${triggerType})`
  );

  const seoulMeta = getSeoulLastUpdated();
  const sizeMB = await getFolderSize();

  console.log(`📊 Seoul lastUpdated: ${seoulMeta?.lastUpdatedSince || "unknown"}`);
  console.log(`📦 Data size: ${sizeMB}MB`);

  try {
    await runBackup();

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.log(
      `✅ [${endTime.toISOString()}] Backup completed successfully (${duration}s)`
    );

    Sentry.captureMessage(`✅ Backup Success`, {
      level: "info",
      tags: {
        service: "backup-cron",
        trigger: triggerType,
      },
      extra: {
        executionId: executionId.toString(),
        duration: `${duration}s`,
        sizeMB: sizeMB,
        seoulLastUpdated: seoulMeta?.lastUpdatedSince,
        seoulTotalCount: seoulMeta?.totalArrayCount,
        timestamp: endTime.toISOString(),
      },
    });

    await Sentry.flush(2000);
  } catch (error) {
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.error("❌ Backup failed:", error.message);

    Sentry.captureException(error, {
      level: "error",
      tags: {
        service: "backup-cron",
        trigger: triggerType,
        executionId: executionId.toString(),
      },
      extra: {
        source: BACKUP_CONFIG.source,
        destination: BACKUP_CONFIG.destination,
        duration: `${duration}s`,
        sizeMB: sizeMB,
        seoulLastUpdated: seoulMeta?.lastUpdatedSince,
        errorMessage: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      },
    });

    await Sentry.flush(2000);
    throw error;
  }
}

const job = schedule.scheduleJob(BACKUP_CONFIG.schedule, async function () {
  await executeBackup(false);
});

console.log(`✅ Backup job scheduled: ${BACKUP_CONFIG.schedule} (Asia/Seoul)`);
console.log(`   Source: ${BACKUP_CONFIG.source}`);
console.log(`   Destination: ${BACKUP_CONFIG.destination}`);

if (process.argv.includes("--manual")) {
  console.log("🔧 매뉴얼로 백업 시도");
  executeBackup(true)
    .then(() => {
      console.log("✅ 매뉴얼 백업 완료!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ 매뉴얼 백업 실패 아이고...:", err.message);
      process.exit(1);
    });
}

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  job.cancel();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

