const schedule = require("node-schedule");
const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");

const { Sentry, initCronService } = require("../utils/sentry");
const { CRON, SENTRY, BACKUP, TIMEOUTS } = require("../config/constants");
const {
  createExecutionContext,
  getDuration,
  captureError,
  captureSuccess,
} = require("../utils/monitoring");
const { formatKoreanDate } = require("../utils/time");

const execAsync = promisify(exec);

const BACKUP_CONFIG = {
  source: path.join(__dirname, "../../data/"),
  destination: BACKUP.DESTINATION,
  schedule: CRON.BACKUP.SCHEDULE,
};

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

async function collectBackupMetadata() {
  const seoulMeta = getSeoulLastUpdated();
  const sizeMB = await getFolderSize();

  console.log(
    `📊 Seoul lastUpdated: ${formatKoreanDate(seoulMeta?.lastUpdatedSince)}`
  );
  console.log(`📦 Data size: ${sizeMB}MB`);

  return { seoulMeta, sizeMB };
}

async function runRcloneSync() {
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
  const { executionId, startTime } = createExecutionContext();
  const triggerType = isManual ? "manual" : "scheduled";

  console.log(
    `[${startTime.toISOString()}] Backup job started (ID: ${executionId}, trigger: ${triggerType})`
  );

  const { seoulMeta, sizeMB } = await collectBackupMetadata();

  try {
    await runRcloneSync();

    const duration = getDuration(startTime);
    console.log(
      `✅ [${new Date().toISOString()}] Backup completed successfully (${duration}s)`
    );

    captureSuccess(`✅ Backup Success`, {
      monitor: SENTRY.BACKUP,
      triggerType,
      extraData: {
        executionId: executionId.toString(),
        duration: `${duration}s`,
        sizeMB,
        seoulLastUpdated: seoulMeta?.lastUpdatedSince,
        seoulTotalCount: seoulMeta?.totalArrayCount,
      },
    });

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH);
    return { success: true, duration };
  } catch (error) {
    const duration = getDuration(startTime);
    console.error("❌ Backup failed:", error.message);

    captureError(error, {
      monitor: SENTRY.BACKUP,
      executionId,
      startTime,
      duration,
      extraTags: { trigger: triggerType },
      extraData: {
        source: BACKUP_CONFIG.source,
        destination: BACKUP_CONFIG.destination,
        sizeMB,
        seoulLastUpdated: seoulMeta?.lastUpdatedSince,
        stdout: error.stdout,
        stderr: error.stderr,
      },
    });

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH);
    throw error;
  }
}

let cleanup = () => {};

const { gracefulShutdown } = initCronService({
  serviceName: SENTRY.BACKUP.SERVICE_NAME,
  tracesSampleRate: SENTRY.BACKUP.TRACES_SAMPLE_RATE,
  maxBreadcrumbs: SENTRY.BACKUP.MAX_BREADCRUMBS,
  extraStartInfo: { schedule: BACKUP_CONFIG.schedule },
  onShutdown: () => cleanup(),
});

console.log("🚀 Backup Cron Service starting...");

const job = schedule.scheduleJob(BACKUP_CONFIG.schedule, () =>
  executeBackup(false)
);

cleanup = () => job.cancel();

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

module.exports = { executeBackup, gracefulShutdown };
