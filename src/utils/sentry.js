const Sentry = require("@sentry/node");
require("dotenv").config();

const { TIMEOUTS, SENTRY: SENTRY_CONFIG } = require("../config/constants");

/**
 * Sentry 초기화
 * @param {Object} options
 * @param {string} options.serviceName - 서비스 이름 (예: "weather-cron", "backup-cron")
 * @param {number} [options.tracesSampleRate] - 트레이스 샘플 비율
 * @param {number} [options.maxBreadcrumbs] - 최대 breadcrumb 개수
 */
function initSentry({
  serviceName,
  tracesSampleRate = SENTRY_CONFIG.DEFAULTS.TRACES_SAMPLE_RATE,
  maxBreadcrumbs = SENTRY_CONFIG.DEFAULTS.MAX_BREADCRUMBS,
}) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate,
    maxBreadcrumbs,
  });

  return Sentry;
}

/**
 * 서비스 시작 메시지 전송
 * @param {string} serviceName - 서비스 이름
 * @param {Object} [extraInfo={}] - 추가 정보
 */
function captureServiceStart(serviceName, extraInfo = {}) {
  const emoji = serviceName.includes("backup") ? "📦" : "🌤️";

  Sentry.captureMessage(`✅ ${emoji} ${serviceName} Started`, {
    level: "info",
    tags: {
      service: serviceName,
      event: "startup",
    },
    extra: {
      startedAt: new Date().toISOString(),
      nodeVersion: process.version,
      hostname: require("os").hostname(),
      pid: process.pid,
      ...extraInfo,
    },
  });
}

/**
 * Graceful shutdown 핸들러 생성
 * @param {string} serviceName - 서비스 이름
 * @param {Function} [onShutdown] - 종료 전 실행할 콜백 (예: job.cancel())
 * @returns {Function} shutdown 핸들러
 */
function createGracefulShutdown(serviceName, onShutdown) {
  return async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    Sentry.captureMessage(`⚠️ ${serviceName} Stopped (${signal})`, {
      level: "warning",
      tags: { service: serviceName, event: "shutdown" },
      extra: {
        stoppedAt: new Date().toISOString(),
        signal,
        pid: process.pid,
      },
    });

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH);

    if (onShutdown) {
      onShutdown();
    }

    process.exit(0);
  };
}

/**
 * 프로세스 에러 핸들러 등록
 * @param {string} serviceName - 서비스 이름
 * @param {Function} gracefulShutdown - graceful shutdown 핸들러
 */
function setupProcessHandlers(serviceName, gracefulShutdown) {
  process.on("uncaughtException", async (error) => {
    console.error("💥 Uncaught Exception:", error);

    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        service: serviceName,
        event: "crash",
        type: "uncaughtException",
      },
      extra: {
        crashedAt: new Date().toISOString(),
        pid: process.pid,
      },
    });

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH_ERROR);
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason, promise) => {
    console.error("💥 Unhandled Rejection:", reason);

    Sentry.captureException(reason, {
      level: "fatal",
      tags: {
        service: serviceName,
        event: "crash",
        type: "unhandledRejection",
      },
      extra: {
        crashedAt: new Date().toISOString(),
        pid: process.pid,
      },
    });

    await Sentry.flush(TIMEOUTS.SENTRY_FLUSH_ERROR);
    process.exit(1);
  });

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

/**
 * 크론 서비스 초기화 (한 번에 모든 설정)
 * @param {Object} options
 * @param {string} options.serviceName - 서비스 이름
 * @param {number} [options.tracesSampleRate] - 트레이스 샘플 비율
 * @param {number} [options.maxBreadcrumbs] - 최대 breadcrumb 개수
 * @param {Object} [options.extraStartInfo] - 시작 시 추가 정보
 * @param {Function} [options.onShutdown] - 종료 시 실행할 콜백
 * @returns {Object} { Sentry, gracefulShutdown }
 */
function initCronService({
  serviceName,
  tracesSampleRate,
  maxBreadcrumbs,
  extraStartInfo = {},
  onShutdown,
}) {
  initSentry({ serviceName, tracesSampleRate, maxBreadcrumbs });
  captureServiceStart(serviceName, extraStartInfo);

  const gracefulShutdown = createGracefulShutdown(serviceName, onShutdown);
  setupProcessHandlers(serviceName, gracefulShutdown);

  return { Sentry, gracefulShutdown };
}

module.exports = {
  Sentry,
  initSentry,
  captureServiceStart,
  createGracefulShutdown,
  setupProcessHandlers,
  initCronService,
};
