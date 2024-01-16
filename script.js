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

function displayData(lat, lon, units) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&APPID=${settings.appid}`
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log(data);
      mainContent.innerHTML = weatherCard(data, units);
      container.style.background = `url('./img/${data.weather[0].main}.jpg')`;
      container.style.opacity = "0.8";
      container.style.backgroundSize = "cover";
      container.style.backgroundRepeat = "no-repeat";
      container.style.backgroundPosition = "center";
    })
    .then(unitChanger)
    .catch((error) => {
      console.error("Weather query error:", error);
    });
}

displayData(settings.lat, settings.lon, units);
