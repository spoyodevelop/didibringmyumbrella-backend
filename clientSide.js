const { fetchClientLocationData } = require("./locationMapping");
const { DUMMY_POSITION } = require("./locations");
const { fetchWeatherData } = require("./fetchWeather");
DUMMY_POSITION.forEach((position) =>
  fetchClientLocationData(position).then((location) =>
    fetchWeatherData("client", "pastData", location).then((data) =>
      console.log(data)
    )
  )
);
