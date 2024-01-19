import settings from "./settings.js";
import weatherCard from "./components/weathercard_copy.js";

const weathercardWrapper = '.main-content';
const weathercardTemplate = 'weatherTemplate'

const locationForm = document.querySelector(".locationform");
const errorMsg = document.querySelector(".error");
const container = document.querySelector(".container");
let units = settings.units;

const updateButtonLabel = () => {
    const unitsButton = document.querySelector("#units");
    unitsButton.innerHTML = units === "metric" ? "°F" : "°C";
};

$(function () {
    $(".js-data-example-ajax").select2({
        placeholder: "City, country code",
        minimumInputLength: 3,
        ajax: {
            delay: 250,
            url: " https://secure.geonames.org/searchJSON",
            dataType: "json",
            data: function (params) {
                return {
                    q: params.term,
                    username: "dajmigrad",
                };
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

    // Change units
    // slusanje 'click' dogadjaja je prebaceno u Jquery
    // -----
    // nije bilo potrebe da u 'unitChanger' funkciji definises 'click' dogadjaj
    // jer ce se on non stop bind-ovati na dugme
    // sto znaci ako 10 puta pozoves ovu funkciju on ce 10 puta da bind-uje 'click' dogadjaj
    // i onda ce 10 puta pozvati ono sto je definisano u dogadjaju
    // sto znaci 10 puta pozvati 'displayData' funkciju
    // zbog toga ti brzo ispucas limit na API-u :D
    // dovoljno je ovako napraviti jedan dogadjaj
    //
    // pretpostavljam da tako jednostavno slusanje dogadjaja nije radilo ali nije radilo zato sto
    // u trenutku ucitavnja strana nemas taj element na strani jer on stize tek kasnije
    // zato ovde postoji fora da kazes da ako se desi klik na dokument i ako se taj klik desio
    // na '#units' onda ce izvrsiti ono sto je definisano
    $(document).on('click', '#units', () => {
        units === "metric" ? (units = "imperial") : (units = "metric");
        let cords = getCord();
        displayData(cords.lat, cords.lon, units);
        updateButtonLabel();
    });
});

// Caputre location form submit
locationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMsg.classList.add("hidden");
    let cords = getCord();
    displayData(cords.lat, cords.lon, units);
});

function getCord() {
    var result = $(".js-data-example-ajax").find(":selected").val();

    // ovo je skracena verzija if-a
    // posle ? ide ako je uslov tacan
    // a posle : je ako je uslov netacan (tj. ono sto bi islo u else deo)
    var cords = result !== undefined ? result.split(",") : [settings.lat, settings.lon];

    // kasnije mi palo na pamet da je bolje da se vrati objekat jer onda
    // mozes lakse da pristupis promenljivama
    return {
        lat: cords[0],
        lon: cords[1]
    };
}

// iskoristicemo ovu funkciju da u njoj definisemo sve sto je vezano za vreme
// i vratiti objekat kojem cemo kasnije moci da pristupamo
// ovim cemo smanjiti broj poziva api-a
// 'getSunset'-u trebaju koordinate (sto ova funkcija vec ima) i treba joj vreme
// a to vreme se dobija u ovoj funkciji
// 'getUtc'-u treba vreme koje se takodje dobija u ovoj funkciji
async function getTime(lat, lon) {
    // definisacemo ovde jednu funkciju za fetch jer imamo vise poziva
    // pa da bi skratili kod
    var fetchData = async function (url) {
        return await fetch(url).then(function (response) {
            return response.json();
        });
    };

    var dateObject = await fetchData(`https://api.ipgeolocation.io/timezone?apiKey=${settings.apiTime}&lat=${lat}&long=${lon}`),
        // API ima mogucnost da mu prosledis vremensku zonu u kojoj hoces da ti vrati datume
        // ako ne prosledis onda vraca UTC po default-u (to je ovaj 'tzid' parametar)
        // i setujemo 'formatted=0' jer ce u tom slucaju vratiti kompletno vreme (datum i vreme) sto nam kasnije olaksava dosta stvari
        sunsetInfo = await fetchData(`https://api.sunrise-sunset.org/json?formatted=0&lat=${lat}&lng=${lon}&tzid=${dateObject.timezone}`);

    // UTC nam vise ne treba ali ti ostavljam primer kako lako mozes da dobijes to vreme
    // ------------
    // iz response-a koristimo 'date_time_ymd' zato sto tu stoje sve informacije koje su nam potrebne
    // vreme u vremenskoj zoni i na kraju koliko to vreme odstupa od UTC-a
    // to je dovoljno da 'Date' zna sta mu je ciniti i kad pozovemo 'toUTCString' on ce sam sracunati vreme u UTC-u
    var UTC_date = new Date(dateObject.date_time_ymd).toUTCString();

    // 2024-01-20T06:02:40+11:00
    // ovakvo vreme sadrzi sve u sebi
    // '2024-01-20T06:02:40' oznacava tacno vreme '+11:00' a ovo u kojoj se vremenskoj zoni to vreme nalazi

    return {
        // koristimo moment() da formatiramo datum
        // posto je sada datum kompleta, moment() moze bez problema da ga preformatira
        // samo da bi zadrzali vreme u vremenskoj zoni moramo koristiti 'parseZone' funkciju
        // jer ce u drugom slucaju uzeti tvoju lokalnu zonu i onda formatirati datum
        sunrise: moment.parseZone(sunsetInfo.results.sunrise).format('HH:mm:ss'),
        sunset: moment.parseZone(sunsetInfo.results.sunset).format('HH:mm:ss'),

        // definisacemo funkciju koja ce da koristi prethodno dobijene podatke
        // i da uporedi datume i na kraju vrati true ili false
        isDaytime: () => {
            // sada su sva vremena u istom formatu (ovo i nije toliko bitno) i istoj vremenskoj zoni (ali ovo jeste)
            // u promenljivama ispod se sada nalaze objekti
            var sunrise = new Date(sunsetInfo.results.sunrise),
                sunset  = new Date(sunsetInfo.results.sunset),
                current = new Date(dateObject.date_time_ymd);

            // dobra stvar je sto direktno mozes da poredis objekte bez da ih konvertujes
            // u int ili nesto drugo
            return current >= sunrise && current < sunset
        }

        // ovde moze kasnije da se prosiri da vraca sta god da treba a da je vezano za vreme
        // i podatke koje imas dostupne
    }
}

async function displayData(lat, lon, units) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&APPID=${settings.apiWeather}`
        );
        const data = await response.json();
        const time = await getTime(lat, lon);

        // za detaljnija objasnjenja, pogledaj weathercard_copy.js fajl
        // ovde namerno necu proslediti sve sto 'props' trazi da vidis kako ce merge da radi
        weatherCard(data, {
            unit: units
        }).render();


        /** ---- ovaj deo nisam dirao ali bi i on takodje mogao da se unapredi ---- */
        const cardSunset = document.querySelector(".card-sunset");
        const cardIcon = document.querySelector(".temp-icon");
        const desc = data.weather[0].main;

        cardSunset.innerHTML = `<div>
           <span><img src="./img/sunrise.png" alt=""></span>
          <span class="temp card"> ${time.sunrise} </span><br>
            </div>
            <div>
            <span><img src="./img/sunset.png" alt=""></span>
           <span class="temp card"> ${time.sunset} </span>
            </div>`;

        // Menja pozadinu samo u slucaju da je Clear, za ostale vremenske uslove odgovaraju dnevne slike
        if (data.weather[0].main == "Clear" && !time.isDaytime()) {
            container.style.background = `url('./img/night-Clear.jpg')`;
        } else {
            container.style.background = `url('./img/${desc}.jpg')`;
            cardIcon.innerHTML = `<img src="./img/icon_${desc}.png" alt="">`;
        }
        // Menja ikonice  nocu
        if (data.weather[0].main == desc && !time.isDaytime()) {
            cardIcon.innerHTML = `<img src="./img/night-${desc}.png" alt="">`;
        }

        container.style.opacity = "0.8";
        container.style.backgroundSize = "cover";
        container.style.backgroundRepeat = "no-repeat";
        container.style.backgroundPosition = "center";
        /** ----------------------------------------------------- */

        // if (time.isDaytime()) {
        //   container.style.background = `url('./img/${data.weather[0].main}.jpg')`;
        // } else {
        //   container.style.background = `url('./img/night-${data.weather[0].main}.jpg')`;
        // }

        updateButtonLabel();
        // ovde nije bilo potrebe za pozivanje onih funkcije
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

displayData(settings.lat, settings.lon, units);
