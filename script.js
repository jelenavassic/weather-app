import settings from "./settings.js";
import weatherCard from "./components/weathercard.js";

const mainContent = document.querySelector(".main-content");
const locationForm = document.querySelector(".locationform");
const errorMsg = document.querySelector(".error");
const container = document.querySelector(".container");
let units = settings.units;

$(function () {
  $(".js-data-example-ajax").select2({
    placeholder: "City, country code",
    minimumInputLength: 3,
    ajax: {
      delay: 250,
      url: " https://secure.geonames.org/searchJSON",
      dataType: "json",
      data: function (params) {
        var query = {
          q: params.term,
          username: "dajmigrad",
        };
        return query;
      },
      processResults: function (data) {
        var cityList = [];
        data.geonames.slice(0, 50).forEach((element) => {
          var cordinates = element.lat + "," + element.lng,
            name = element.name + ", " + element.countryName;
          cityList.push({
            id: cordinates,
            text: name,
          });
        });
        return {
          results: cityList,
        };
      },
    },
  });
});

// Caputre location form submit
locationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMsg.classList.add("hidden");
  let cords = getCord();
  displayData(cords[0], cords[1], units);
});

// Change units
const unitChanger = () => {
  const unitsButton = document.querySelector("#units");
  unitsButton.addEventListener("click", () => {
    units === "metric" ? (units = "imperial") : (units = "metric");
    let cords = getCord();
    displayData(cords[0], cords[1], units);
    updateButtonLabel();
  });
  updateButtonLabel();
};

const updateButtonLabel = () => {
  const unitsButton = document.querySelector("#units");
  unitsButton.innerHTML = units === "metric" ? "°F" : "°C";
};

function getCord() {
  var result = $(".js-data-example-ajax").find(":selected").val();
  if (result !== undefined) {
    return result.split(",");
  } else {
    return [settings.lat, settings.lon];
  }
}

//get current time and date
async function getTime(lat, lon) {
  return fetch(
    `https://api.ipgeolocation.io/timezone?apiKey=${settings.apiTime}&lat=${lat}&long=${lon}`
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      return data;
    });
}
// get utc value
async function getUtc() {
  let cords = getCord();
  let lat = cords[0];
  let lon = cords[1];
  try {
    const time = await getTime(lat, lon);
    const UTCstring = time.date_time_wti;
    const utcArr = UTCstring.split(" ");
    const UTC = utcArr[utcArr.length - 1];
    return UTC;
  } catch (error) {
    console.error("Error fetching timezone data:", error);
  }
}

//get sunrise and sunset time and display it in 24h format
async function getSunset(lat, lon) {
  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}`
    );
    const data = await response.json();
    // console.log(data);
    const sunrise24 = convertTo24HourFormat(data.results.sunrise);
    const sunset24 = convertTo24HourFormat(data.results.sunset);
    const UTC = await getUtc();

    const utcMomentRise = moment.utc(sunrise24, "HH:mm:ss");
    const localMomentRise = utcMomentRise.utcOffset(UTC);
    const realSunrise = localMomentRise.format("HH:mm:ss");

    const utcMomentSet = moment.utc(sunset24, "HH:mm:ss");
    const localMomentSet = utcMomentSet.utcOffset(UTC);
    const realSunset = localMomentSet.format("HH:mm:ss");

    return {
      sunrise: realSunrise,
      sunset: realSunset,
    };
  } catch (error) {
    console.error("Error fetching sunset data:", error);
    throw error;
  }
}

const convertTo24HourFormat = (timeString) => {
  const [time, period] = timeString.split(" ");
  let [hour, minute, second] = time.split(":");
  if (period.toLowerCase() === "pm" && hour !== "12") {
    hour = String(parseInt(hour, 10) + 12).padStart(2, "0");
  } else if (period.toLowerCase() === "am" && hour === "12") {
    hour = "00";
  }
  return `${hour}:${minute}:${second}`;
};

async function displayData(lat, lon, units) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&APPID=${settings.apiWeather}`
    );
    const data = await response.json();
    const time = await getTime(lat, lon);
    const currentTime = time.time_24;
    // console.log(currentTime);
    const sunsetData = await getSunset(lat, lon);
    const sunsetTime = sunsetData.sunset;
    const sunriseTime = sunsetData.sunrise;

    const currentHour = parseInt(currentTime.split(":")[0], 10);
    const sunsetHour = parseInt(sunsetTime.split(":")[0], 10);
    const sunriseHour = parseInt(sunriseTime.split(":")[0], 10);

    const isDaytime = currentHour >= sunriseHour && currentHour < sunsetHour;

    mainContent.innerHTML = weatherCard(data, units);

    const cardSunset = document.querySelector(".card-sunset");
    const cardIcon = document.querySelector(".temp-icon");
    const desc = data.weather[0].main;
    
    cardSunset.innerHTML = `<div>
           <span><img src="./img/sunrise.png" alt=""></span>
          <span class="temp card"> ${sunriseTime} </span><br>
            </div>
            <div>
            <span><img src="./img/sunset.png" alt=""></span>
           <span class="temp card"> ${sunsetTime} </span>
            </div>`;

    // Menja pozadinu samo u slucaju da je Clear, za ostale vremenske uslove odgovaraju dnevne slike
    if (data.weather[0].main == "Clear" && !isDaytime) {
      container.style.background = `url('./img/night-Clear.jpg')`;
      // cardIcon.innerHTML = `<img src="./img/night-${desc}.png" alt="">`;
    } else {
      container.style.background = `url('./img/${desc}.jpg')`;
      cardIcon.innerHTML = `<img src="./img/icon_${desc}.png" alt="">`;
    }
    // Menja ikonice samo ako je oblacno ili magla nocu
    if (data.weather[0].main == desc && !isDaytime) {
      cardIcon.innerHTML = `<img src="./img/night-${desc}.png" alt="">`;
    }
    container.style.opacity = "0.8";
    container.style.backgroundSize = "cover";
    container.style.backgroundRepeat = "no-repeat";
    container.style.backgroundPosition = "center";

    // if (isDaytime) {
    //   container.style.background = `url('./img/${data.weather[0].main}.jpg')`;
    // } else {
    //   container.style.background = `url('./img/night-${data.weather[0].main}.jpg')`;
    // }

    unitChanger();
    getTime(lat, lon);
    getSunset(lat, lon);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}
displayData(settings.lat, settings.lon, units);
