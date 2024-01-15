import settings from "./settings.js";
import weatherCard from "./components/weathercard.js";

const mainContent = document.querySelector(".main-content");
const locationForm = document.querySelector(".locationform");
let units = settings.units;
const errorMsg = document.querySelector(".error");
const container = document.querySelector(".container");

// Caputre location form submit
locationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMsg.classList.add("hidden");
  const cords = getCord();
  displayData(cords[0], cords[1], units);
});

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
        // console.log(cityList);
        return {
          results: cityList,
        };
      },
    },
  });
});

const unitChanger = () => {
  const unitsButton = document.querySelector("#units");
  unitsButton.addEventListener("click", () => {
    units === "metric" ? (units = "imperial") : (units = "metric");
    displayData(settings.lat, settings.lon, units);
  });
};

function getCord() {
  var result = $(".js-data-example-ajax").find(":selected").val();
  return result.split(",");
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
      mainContent.style.backgroundSize = "cover";
      mainContent.style.backgroundRepeat = "no-repeat";
      mainContent.style.backgroundPosition = "center";
    })
    .then(unitChanger)
    .catch((error) => {
      console.error("Weather query error:", error);
    });
}

displayData(settings.lat, settings.lon, units);
