const schedule = require("node-schedule");

const { sendEmail } = require("./sendEmail");
const { CAPITAL_LOCATION } = require("./locations.js");
const { baseTimes } = require("./dateFormatting");
const { processWeatherData } = require("./processWeatherDataAndSave.js");

console.log("starting job....");
const job = schedule.scheduleJob(
  "15 2,5,8,11,14,17,20,23 * * *",
  async function () {
    try {
      console.log();
      await processWeatherData(CAPITAL_LOCATION);
    } catch (error) {
      console.error("Error processing weather data:", error);
      await sendEmail(error);
    }
  }
);
