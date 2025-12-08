const MINUTES_TO_MS = 60 * 1000;

const TIMEOUTS = {
  BACKUP: 10 * MINUTES_TO_MS, // 10분
  SENTRY_FLUSH: 2000, // 2초
  SENTRY_FLUSH_ERROR: 5000, // 5초 (에러 시)
};

const TIMEZONE = "Asia/Seoul";

const CRON = {
  WEATHER: {
    MINUTE: 15,
    HOURS: "3,6,9,12,15,18,21,0",
    get SCHEDULE() {
      return `${this.MINUTE} ${this.HOURS} * * *`;
    },
  },
  BACKUP: {
    SCHEDULE: "30 0 * * *", // 매일 0시 30분
  },
};

const SENTRY = {
  WEATHER: {
    SERVICE_NAME: "weather-cron",
    MONITOR_SLUG: "weather-cron-job",
    TRACES_SAMPLE_RATE: 0.1,
    MAX_BREADCRUMBS: 50,
    CHECKIN_MARGIN: 5,
    MAX_RUNTIME: 10,
  },
  BACKUP: {
    SERVICE_NAME: "backup-cron",
    TRACES_SAMPLE_RATE: 0,
    MAX_BREADCRUMBS: 30,
  },
  DEFAULTS: {
    TRACES_SAMPLE_RATE: 0.1,
    MAX_BREADCRUMBS: 50,
  },
};

const BACKUP = {
  DESTINATION: "spoyodrive:WeatherData/",
};

const DATA_FILES = {
  TOTAL_AREA: "totalOfAllArea",
  POP_STATS: "POPstats",
};

module.exports = {
  MINUTES_TO_MS,
  TIMEOUTS,
  TIMEZONE,
  CRON,
  SENTRY,
  BACKUP,
  DATA_FILES,
};
