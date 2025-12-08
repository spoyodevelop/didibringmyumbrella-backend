const { Sentry } = require("./sentry");
const { TIMEZONE } = require("../config/constants");

/**
 * 실행 컨텍스트 생성
 * @returns {{ executionId: number, startTime: Date }}
 */
function createExecutionContext() {
  return {
    executionId: Date.now(),
    startTime: new Date(),
  };
}

/**
 * 실행 시간 계산 (초 단위)
 * @param {Date} startTime
 * @returns {number}
 */
function getDuration(startTime) {
  return (new Date() - startTime) / 1000;
}

/**
 * Sentry Check-In 시작
 * @param {Object} monitor - 모니터 설정 (SENTRY.WEATHER 등)
 * @param {string} cronSchedule - 크론 스케줄 문자열
 * @returns {string} checkInId
 */
function startCheckIn(monitor, cronSchedule) {
  return Sentry.captureCheckIn(
    {
      monitorSlug: monitor.MONITOR_SLUG,
      status: "in_progress",
    },
    {
      schedule: {
        type: "crontab",
        value: cronSchedule,
      },
      checkinMargin: monitor.CHECKIN_MARGIN,
      maxRuntime: monitor.MAX_RUNTIME,
      timezone: TIMEZONE,
    }
  );
}

/**
 * Sentry Check-In 완료
 * @param {string} checkInId
 * @param {string} monitorSlug
 * @param {"ok" | "error"} status
 */
function completeCheckIn(checkInId, monitorSlug, status) {
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug,
    status,
  });
}

/**
 * Breadcrumb 추가
 * @param {string} category
 * @param {string} message
 * @param {"info" | "warning" | "error"} level
 * @param {Object} [data={}]
 */
function addBreadcrumb(category, message, level = "info", data = {}) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
}

/**
 * 크론잡 시작 breadcrumb
 * @param {Object} context - { executionId, startTime, checkInId }
 */
function breadcrumbCronStart({ executionId, startTime, checkInId }) {
  addBreadcrumb("cron", "크론잡 실행 시작", "info", {
    executionId: executionId.toString(),
    startTime: startTime.toISOString(),
    checkInId,
  });
}

/**
 * 크론잡 완료 breadcrumb
 * @param {number} duration - 실행 시간(초)
 */
function breadcrumbCronComplete(duration) {
  addBreadcrumb("cron", "크론잡 정상 완료", "info", {
    duration: `${duration}s`,
    endTime: new Date().toISOString(),
  });
}

/**
 * Step 시작/완료 breadcrumb
 * @param {number} stepNum
 * @param {string} nameKo
 * @param {"start" | "complete"} phase
 */
function breadcrumbStep(stepNum, nameKo, phase) {
  const suffix = phase === "start" ? "시작" : "완료";
  addBreadcrumb("cron.step", `Step ${stepNum}: ${nameKo} ${suffix}`, "info");
}

/**
 * 에러 캡처
 * @param {Error} error
 * @param {Object} options
 * @param {Object} options.monitor - 모니터 설정
 * @param {number} options.executionId
 * @param {Date} options.startTime
 * @param {number} options.duration
 * @param {Object} [options.extraTags={}]
 * @param {Object} [options.extraData={}]
 */
function captureError(
  error,
  { monitor, executionId, startTime, duration, extraTags = {}, extraData = {} }
) {
  Sentry.captureException(error, {
    level: "error",
    tags: {
      service: monitor.SERVICE_NAME,
      executionId: executionId.toString(),
      ...extraTags,
    },
    extra: {
      timestamp: new Date().toISOString(),
      startTime: startTime.toISOString(),
      duration: `${duration}s`,
      errorMessage: error.message,
      errorStack: error.stack,
      ...extraData,
    },
  });
}

/**
 * 성공 메시지 캡처 (backup용)
 * @param {string} message
 * @param {Object} options
 */
function captureSuccess(message, { monitor, triggerType, extraData = {} }) {
  Sentry.captureMessage(message, {
    level: "info",
    tags: {
      service: monitor.SERVICE_NAME,
      trigger: triggerType,
    },
    extra: {
      timestamp: new Date().toISOString(),
      ...extraData,
    },
  });
}

/**
 * 모니터링이 적용된 함수 실행 (크론잡용)
 * @param {Object} options
 * @param {Object} options.monitor - 모니터 설정 (SENTRY.WEATHER)
 * @param {string} options.cronSchedule - 크론 스케줄 문자열
 * @param {Function} options.execute - 실행할 함수
 * @param {Object} [options.extraTags={}] - 에러 시 추가 태그
 * @param {Object} [options.extraData={}] - 에러 시 추가 데이터
 */
async function withCronMonitoring({
  monitor,
  cronSchedule,
  execute,
  extraTags = {},
  extraData = {},
}) {
  const { executionId, startTime } = createExecutionContext();

  console.log(
    `[${startTime.toISOString()}] Cron job execution started (ID: ${executionId})`
  );

  const checkInId = startCheckIn(monitor, cronSchedule);
  breadcrumbCronStart({ executionId, startTime, checkInId });

  try {
    await execute();

    const duration = getDuration(startTime);
    console.log(
      `[${new Date().toLocaleDateString(
        "ko-KR"
      )}] Cron job completed successfully (${duration}s)`
    );

    breadcrumbCronComplete(duration);
    completeCheckIn(checkInId, monitor.MONITOR_SLUG, "ok");
  } catch (error) {
    const duration = getDuration(startTime);

    console.error("❌ Error:", error);
    console.error("Error details:", {
      message: error.message,
      executionId,
      duration: `${duration}s`,
    });

    captureError(error, {
      monitor,
      executionId,
      startTime,
      duration,
      extraTags,
      extraData,
    });

    completeCheckIn(checkInId, monitor.MONITOR_SLUG, "error");
    await Sentry.flush(2000);
  }
}

module.exports = {
  createExecutionContext,
  getDuration,
  startCheckIn,
  completeCheckIn,
  addBreadcrumb,
  breadcrumbCronStart,
  breadcrumbCronComplete,
  breadcrumbStep,
  captureError,
  captureSuccess,
  withCronMonitoring,
};
