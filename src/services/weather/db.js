const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

const DATA_DIR = path.join(__dirname, "../../../data");

const weatherSchema = new mongoose.Schema({
  administrativeArea: { type: String, required: true },
  lastUpdatedSince: { type: Date, required: true },
  totalArrayCount: { type: Number, required: true },
  totalDidItRainCount: { type: Number, required: true },
  POP0: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP10: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP20: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP30: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP40: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP50: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP60: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP70: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP80: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP90: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  POP100: {
    arrayLength: { type: Number, required: true },
    didItRainCount: { type: Number, required: true },
  },
  rainOutOfBlue: {
    type: [
      {
        administrativeArea: { type: String, required: true },
        baseDate: { type: Date, required: true },
        didItRain: { type: Boolean, required: true },
        POP: { type: Number, required: true },
        PTY: { type: Number, required: true },
        RN1: { type: Number, required: true },
      },
    ],
  },
});

const Weather = mongoose.model("Weather", weatherSchema);

async function getWeatherDataInsertToDB(capitals) {
  let connection;
  try {
    const url = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@weathercluster.wnaoze9.mongodb.net/POPdata`;
    connection = await mongoose.connect(url, {});

    for (const capital of capitals) {
      const dest = capital.administrativeArea;

      console.log("Connected to MongoDB for", dest);

      const filePath = path.join(DATA_DIR, dest, "POPstats.js");

      // Clear require cache
      delete require.cache[require.resolve(filePath)];
      const weatherData = require(filePath);

      const uploadingData =
        weatherData.POPstats[weatherData.POPstats.length - 1];
      await uploadWeatherData(uploadingData, dest);
      console.log("Uploaded data for", dest);
    }

    const totalFilePath = path.join(DATA_DIR, "totalOfAllArea", "POPstats.js");

    // Clear require cache
    delete require.cache[require.resolve(totalFilePath)];
    const totalData = require(totalFilePath);

    const uploadingTotalData =
      totalData.POPstats[totalData.POPstats.length - 1];

    await uploadWeatherData(uploadingTotalData, "totalOfAllArea");
    console.log("Uploaded data for totalOfAllArea");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error uploading to DB:", error);
    if (connection) {
      await mongoose.disconnect();
    }
    throw error;
  }
}

async function uploadWeatherData(data, dest) {
  try {
    const weatherData = {
      lastUpdatedSince: data.lastUpdatedSince,
      administrativeArea: dest,
      totalArrayCount: data.totalArrayCount,
      totalDidItRainCount: data.totalDidItRainCount,
      ...Array.from({ length: 11 }, (_, i) => {
        const popValue = i * 10;
        const popKey = `POP${popValue}`;
        return {
          [popKey]: {
            arrayLength: data[popKey].arrayLength,
            didItRainCount: data[popKey].didItRainLength,
          },
        };
      }).reduce((acc, obj) => ({ ...acc, ...obj }), {}),
      rainOutOfBlue: data?.rainOutOfBlue,
    };

    await Weather.findOneAndReplace({ administrativeArea: dest }, weatherData, {
      upsert: true,
    });

    console.log(`Weather data for ${dest} saved to MongoDB`);
  } catch (error) {
    console.error(`Error saving weather data for ${dest}:`, error);
    throw error;
  }
}

module.exports = {
  getWeatherDataInsertToDB,
  uploadWeatherData,
};
