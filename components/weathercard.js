const tempTranslator = (temp, unit) => {
  const allTemps = {
    k: {
      value: temp,
      unit: "°k",
    },
    c: {
      value: temp - 273,
      unit: "°C",
    },
    f: {
      value: 1.8 * (temp - 273) + 32,
      unit: "°F",
    },
  };
  console.log(allTemps);
  if (unit === "metric") {
    return allTemps.c;
  } else if (unit === "imperial") {
    return allTemps.f;
  } else {
    return allTemps.k;
  }
};

const speedTranslator = (speed, units) => {
  const allSpeeds = {
    metric: {
      value: speed,
      unit: "m/s",
    },
    imperial: {
      value: speed * 3.281,
      unit: "ft/s",
    },
  };
  if (units === "metric") {
    return allSpeeds.metric;
  } else if (units === "imperial") {
    return allSpeeds.imperial;
  } else {
    return allSpeeds.metric;
  }
};

const weatherCard = (data, units) => {
  return `
  





        <div class="weathercard">
        <!-- <link href="loader.css" rel="stylesheet" /> -->
        <!-- <span class="loader hidden"> </span> -->
        <div class="info">

        <div class="weathercard__meta">
          
        <div class="weathercard__temp">
          <span class="temp-info"> ${Math.round(
            tempTranslator(data.main.temp, units).value
          )}</span><span class="tempunit">${
    tempTranslator(data.main.temp, units).unit
  }</span>
  <span class="temp-icon"><img src="./img/icon_${
    data.weather[0].main
  }.png" alt="">
  </span>
        </div>
        <div class="weathercard__meta-location"> </div>${data.name}, ${
    data.sys.country
  }
              </div>
        <div class="weathercard__desc">
        <span class="desc">${data.weather[0].description}</span> 
      </div>
      <button id="units">°C °F</button>

        </div>
        <div class="grid">
        <article>
          <div class="card weathercard__feels__like">
          <div>FEELS LIKE</div>
          <span class="temp"> ${Math.round(
            tempTranslator(data.main.feels_like, units).value
          )} ${tempTranslator(data.main.feels_like, units).unit}</span>
          
          </div>
        </article>
        <article>
          <div class="card weathercard__min__max">
          <div>
          <span>MIN. TEMPERATURE</span>
          <span class="temp card"> ${Math.round(
            tempTranslator(data.main.temp_min, units).value
          )}${tempTranslator(data.main.temp_min, units).unit}</span><br>
            </div>
            <div>
          <span>MAX. TEMPERATURE</span>
          <span class="temp card"> ${Math.round(
            tempTranslator(data.main.temp_max, units).value
          )}${tempTranslator(data.main.temp_max, units).unit}</span>    
            </div>
      </div>
        </article>
<article>
          <div class="card weathercard__humidity">
          <div>HUMIDITY</div>
            <span class="weathercard__humidity">${Math.round(
              tempTranslator(data.main.humidity).value
            )}%</span>
          </div>
        </article>

        <article>
          <div class="weathercard__wind">
            <div class="weathercard__wind-speed">
            <span>WIND</span>
              <span class="speed">${speedTranslator(
                data.wind.speed,
                units
              ).value.toFixed(1)}</span><span class="windunit">${
    speedTranslator(data.wind.speed, units).unit
  }</span>
            </div>
            <div class="weathercard__wind-dir" style="transform:rotate(${
              data.wind.deg + 90
            }deg)">
                <span class="screen-reader-text">${data.wind.deg}</span>
            </div>
          </div>       

        </article>

        </div>
      </div>
    `;
};

export default weatherCard;
