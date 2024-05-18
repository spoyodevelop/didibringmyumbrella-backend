const { getAllPOPs } = require("./getTotalPOPdata");
const { DUMMY_CAPITAL, CAPITAL_LOCATION } = require("./locations");
require("dotenv").config();
const mongoose = require("mongoose");
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

//I can make this schema programmatically of course, but it is wise
//to make ANY schemas explicit as possible for building safety net.

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
  let connection; // Declare connection variable outside the try-catch block
  try {
    // Connect to MongoDB before the loop
    const url = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@weathercluster.wnaoze9.mongodb.net/POPdata`;
    connection = await mongoose.connect(url, {});

    for (const capital of capitals) {
      const dest = capital.administrativeArea;

      console.log("Connected to MongoDB for", dest);

      const weatherData = require(`./data/${dest}/POPstats.js`);
      const uploadingData =
        weatherData.POPstats[weatherData.POPstats.length - 1];
      await uploadWeatherData(uploadingData, dest); // Pass dest to uploadWeatherData
      console.log("Disconnected from MongoDB for", dest);
    }
    const totalData = require("./data/totalOfAllArea/POPstats.js");
    const uploadingTotalData =
      totalData.POPstats[totalData.POPstats.length - 1];

    await uploadWeatherData(uploadingTotalData, "totalOfAllArea"); // Pass dest to uploadWeatherData
    console.log("Disconnected from MongoDB for", "totalOfAllArea");
    // Disconnect from MongoDB after all operations are complete
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    if (connection) {
      // If an error occurs, close the connection
      await mongoose.disconnect();
    }
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

    // Directly replace existing document or insert if not found
    await Weather.findOneAndReplace({ administrativeArea: dest }, weatherData, {
      upsert: true,
    });

    console.log(`Weather data for ${dest} saved to MongoDB`);
  } catch (error) {
    console.error(`Error saving weather data for ${dest}:`, error);
  }
}

module.exports = {
  getWeatherDataInsertToDB,
  uploadWeatherData,
};
