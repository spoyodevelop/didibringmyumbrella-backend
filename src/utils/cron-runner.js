const schedule = require("node-schedule");
const { initCronService } = require("./sentry");
const {
  withCronMonitoring,
  breadcrumbStep,
  createExecutionContext,
  getDuration,
} = require("./monitoring");

/**
 * 파이프라인 실행
 * @param {Array<{ name: string, nameKo: string, execute: Function }>} pipeline
 * @param {Object} options
 * @param {boolean} [options.withBreadcrumbs=false] - breadcrumb 기록 여부
 */
async function executePipeline(pipeline, { withBreadcrumbs = false } = {}) {
  for (const [i, step] of pipeline.entries()) {
    const stepNum = i + 1;

    console.log(`Step ${stepNum}: ${step.name}...`);

    if (withBreadcrumbs) {
      breadcrumbStep(stepNum, step.nameKo, "start");
    }

    await step.execute();

    if (withBreadcrumbs) {
      breadcrumbStep(stepNum, step.nameKo, "complete");
    }
  }
}

/**
 * 모니터링이 적용된 크론잡 생성
 * @param {Object} options
 * @param {Array} options.pipeline - 실행할 파이프라인 스텝들
 * @param {Object} options.schedule - 크론 스케줄 설정 (CRON.WEATHER)
 * @param {Object} options.monitor - 모니터 설정 (SENTRY.WEATHER)
 * @param {Object} [options.extraTags={}] - 에러 시 추가 태그
 * @param {Object} [options.extraData={}] - 에러 시 추가 데이터
 * @returns {{ job: Object, gracefulShutdown: Function, executeManually: Function }}
 */
function createMonitoredCronJob({
  pipeline,
  schedule: cronSchedule,
  monitor,
  extraTags = {},
  extraData = {},
}) {
  let job;

  const { gracefulShutdown } = initCronService({
    serviceName: monitor.SERVICE_NAME,
    tracesSampleRate: monitor.TRACES_SAMPLE_RATE,
    maxBreadcrumbs: monitor.MAX_BREADCRUMBS,
    extraStartInfo: { schedule: cronSchedule.SCHEDULE },
    onShutdown: () => job?.cancel(),
  });

  console.log("starting job....");

  job = schedule.scheduleJob(cronSchedule.SCHEDULE, () =>
    withCronMonitoring({
      monitor,
      cronSchedule: cronSchedule.SCHEDULE,
      execute: () => executePipeline(pipeline, { withBreadcrumbs: true }),
      extraTags: {
        minute: cronSchedule.MINUTE?.toString(),
        ...extraTags,
      },
      extraData,
    })
  );

  console.log(
    `✅ Cron job scheduled: ${cronSchedule.MINUTE || ""} minutes past ${
      cronSchedule.HOURS || ""
    } hours`.trim()
  );

  /**
   * 매뉴얼 실행 (breadcrumb 없이)
   */
  async function executeManually() {
    const { executionId, startTime } = createExecutionContext();

    console.log("🔧 매뉴얼 실행 시작...");
    console.log(`[${startTime.toISOString()}] Execution ID: ${executionId}`);

    try {
      await executePipeline(pipeline, { withBreadcrumbs: false });

      const duration = getDuration(startTime);
      console.log(`✅ 매뉴얼 실행 완료! (${duration}s)`);

      return { success: true, duration };
    } catch (error) {
      console.error("❌ 매뉴얼 실행 실패:", error.message);
      throw error;
    }
  }

  return { job, gracefulShutdown, executeManually };
}

module.exports = {
  executePipeline,
  createMonitoredCronJob,
};
