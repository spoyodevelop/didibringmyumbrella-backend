const { DUMMY_CAPITAL } = require("./locations");
require("dotenv").config();
const mongoose = require("mongoose");
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

const weatherSchema = new mongoose.Schema({
  administrativeArea: { type: String, required: true },
  lastUpdatedSince: { type: Date, required: true },
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
});

const Weather = mongoose.model("Weather", weatherSchema);

async function getWeatherDataInsertToDB(capitals) {
  try {
    for (const capital of capitals) {
      const dest = capital.administrativeArea;
      const url = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@weathercluster.wnaoze9.mongodb.net/${dest}`;

      await mongoose.connect(url, {});

      console.log("Connected to MongoDB for", dest);

      const weatherData = require(`./data/${dest}/POPstats.js`);
      await uploadWeatherData(weatherData, dest);

      mongoose.disconnect();
      console.log("Disconnected from MongoDB for", dest);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function uploadWeatherData(data, dest) {
  try {
    const weatherData = new Weather({
      lastUpdatedSince: data.lastUpdatedSince,
      administrativeArea: dest,
      // Dynamically fill data for POPs from POP0 to POP100
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
    });

    await weatherData.save();
    console.log(`Weather data for ${dest} saved to MongoDB`);
  } catch (error) {
    console.error(`Error saving weather data for ${dest}:`, error);
  }
}

module.exports = {
  getWeatherDataInsertToDB,
};
