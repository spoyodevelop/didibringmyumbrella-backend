const schedule = require("node-schedule");

const { sendEmail } = require("./sendEmail");
const { CAPITAL_LOCATION } = require("./locations.js");
const { baseTimes } = require("./dateFormatting");
const { processDataAndWriteToFile } = require("./processWeatherDataAndSave.js");

console.log("starting job....");
const minute = 15;
const job = schedule.scheduleJob(
  `${minute} 3,6,9,12,15,18,21,0 * * *`,
  async function () {
    try {
      console.log();
      await processDataAndWriteToFile(CAPITAL_LOCATION, minute);
    } catch (error) {
      console.error("Error processing weather data:", error);
      await sendEmail(error);
    }
  }
);
