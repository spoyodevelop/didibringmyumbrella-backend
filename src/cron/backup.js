const schedule = require("node-schedule");
const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");

const { Sentry, initCronService } = require("../utils/sentry");
const { CRON, SENTRY, BACKUP, TIMEOUTS } = require("../config/constants");

const execAsync = promisify(exec);

const BACKUP_CONFIG = {
  source: path.join(__dirname, "../../data/"),
  destination: BACKUP.DESTINATION,
  schedule: CRON.BACKUP.SCHEDULE,
};

let job;

const { gracefulShutdown } = initCronService({
  serviceName: SENTRY.BACKUP.SERVICE_NAME,
  tracesSampleRate: SENTRY.BACKUP.TRACES_SAMPLE_RATE,
  maxBreadcrumbs: SENTRY.BACKUP.MAX_BREADCRUMBS,
  extraStartInfo: { schedule: BACKUP_CONFIG.schedule },
  onShutdown: () => job?.cancel(),
});

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
    timeout: TIMEOUTS.BACKUP,
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

  console.log(
    `📊 Seoul lastUpdated: ${seoulMeta?.lastUpdatedSince || "unknown"}`
  );
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
        service: SENTRY.BACKUP.SERVICE_NAME,
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

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH);
  } catch (error) {
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.error("❌ Backup failed:", error.message);

    Sentry.captureException(error, {
      level: "error",
      tags: {
        service: SENTRY.BACKUP.SERVICE_NAME,
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

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH);
    throw error;
  }
}

job = schedule.scheduleJob(BACKUP_CONFIG.schedule, async function () {
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
