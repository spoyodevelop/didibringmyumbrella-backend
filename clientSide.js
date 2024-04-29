const { fetchClientLocationData } = require("./reverseGeolocation");
const { DUMMY_POSITION } = require("./locations");
const { fetchWeatherDataWithRetry } = require("./fetchWeather");
DUMMY_POSITION.forEach((position) =>
  fetchClientLocationData(position).then((location) =>
    fetchWeatherDataWithRetry("client", "pastData", location).then((data) =>
      console.log(data)
    )
  )
);
