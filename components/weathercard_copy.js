const tempTranslator = (unit) => {
    const allTemps = {
        k: {
            value: (temp) => temp,
            unit: "°k",
        },
        metric: {
            value: (temp) => temp - 273,
            unit: "°C",
        },
        imperial: {
            value: (temp) => 1.8 * (temp - 273) + 32,
            unit: "°F",
        },
    };

    // na osnovu prosledjenog unit-a odmah cemo uzeti objekat iz allTemps
    // allTemps.value sadrzi funkciju zato sto cemo nju kasnije pozivati
    // ovo je provera ukoliko prosledjeni unit nije definisan u allTems
    // u tom slucaju cemo uzeti default-u vrednost allTemps.k
    var current = allTemps[unit] ? allTemps[unit] : allTemps.k

    // sve to je definisano u 'return'-u je dostupno nakon pozivanja 'tempTranslator' metode
    // kako se koristi, videces u 'weatherCard'
    return {
        // na ovaj nacin zovemo prethodnu izabranu funkciju za racunje
        // temperature na osnovu izabranog unit-a
        calculate:  (temp) => Math.round(current.value(temp)),

        // prisput prethodnog izabranog unita iz allTemps
        unit: current.unit
    }
};

// ova funkcija primenjuje potpuno ista pravila kao prethodna
const speedTranslator = (unit) => {
    const allSpeeds = {
        metric: {
            value: (speed) => speed,
            unit: "m/s",
        },
        imperial: {
            value: (speed) => speed * 3.281,
            unit: "ft/s",
        },
    };

    var current = allSpeeds[unit] ? allSpeeds[unit] : allSpeeds.metric

    return {
        calculate: (speed) => Math.round(current.value(speed)),
        unit: current.unit
    }
};

// definisanje funkcije koja vraca objekat funkcija/propertija kojima se moze pristupati
// data - je objekat kao i stari, koji drzi informacije o vremenskoj prognozi
// props - objekat sa properijima za konfiguraciju
//         ovo je zgodnije jer bi u drugom slucaju morali da dodajemo dodatne varijable koje funkcija prima
var weatherCard = function (data, props) {
    // sve ono sto se definise ovde (pre 'return'-a) ce se izvrsiti kada se pozove weatherCard(), nesto kao konstruktor klase

    // definisanje default-nih properija ukoliko ih korisnik ne prosledi
    let defaultProps = {
        // ovde mi moglo da se uvede citanje iz settings-a, da se na jednom mestu definise
        // i to cita gde god je potrebno
        unit: 'metric',
        // ime templejta koje je definisano u 'data-template' atributu na 'script' tagu
        template: 'weatherTemplate',
        // wrapper u koji ce se smestiti izrenderovani templejt
        wrapper: '.weathercard'
    };

    // na ovaj nacin se radi merge 'props'-a koji su prosledjeni funkciji i ovih defaultnih definisanih
    // to znaci da korisnik moze da prosledi samo props.unit
    // ovaj merge nam obezbedjuje da uvek imamo sve definisano sto nam je potreno
    // da nam kasnije ne bi pravilo problem u kodu
    props = $.extend({}, defaultProps, props || {});

    // definisanje tempTranslator gde se odmah na pocetku setuje unit koji koristimo
    // kasnije cemo samo da pozivamo 'calculate' metodu i njoj da prosledino ono sto zelimo da sracunamo
    var temp  = tempTranslator(props.unit),
        speed = speedTranslator(props.unit);

    // ovde smestamo sve promenljive koje cemo koristiti u samom templejtu
    // ideja je da se ovde odrade sva preracunavanja a onda vec izracunate vrednosti
    // samo prosledimo u templejt i tamo ih samo stampamo
    var templateData = {
        // promenljiva moze biti i ugnjezdena i njoj cemo pristupati kao 'temp.value'
        temp: {
            // vrlo lagano racunanje temperature
            // cak je i Math.round() izmestena odavde i ne moramo da je pisemo 100 puta
            value: temp.calculate(data.main.temp),

            // i sad caskom pristupimo alias-u za prethodno setovan unit
            // na ovaj nacin kod je cistiji i ne moramo non stop da pozivamo funkciju
            // i da joj prosledjujemo temperaturu koju za ovu potrebu uopste necemo ni koristiti
            // a morali smo da je prosledimo jer je to prvi i obavezni parametar
            unit: temp.unit
        },

        // a mozemo temp_unit da definisemo i ovde posto se nece menjati
        // i nju kasnije da koristimo u templejtu gde god nam treba
        temp_unit: temp.unit,
        name: data.name,
        country: data.sys.country,
        description: data.weather[0].description,
        wind_speed: {
            // ovo 'toFixed' smo mogli da prebacimo i u 'calculate' metodu
            // ali moze i ovde da ostane kao primer kako sve moze da se koristi
            value: speed.calculate(data.wind.speed).toFixed(1),
            unit: speed.unit
        },
        wind_deg: data.wind.deg,
        // i kasnije vrlo lako preracunamo sve ostale temperature
        feels_like: temp.calculate(data.main.feels_like),
        temp_min: temp.calculate(data.main.temp_min),
        temp_max: temp.calculate(data.main.temp_max),
        humidity: temp.calculate(data.main.humidity),
        pressure: temp.calculate(data.main.pressure)
    };

    // sve funkcije definisane u 'return'-u ce biti dostupne da se pozovu kao 'weatherCard.function_name()'
    // takodje se mogu definisati i property-ji
    // ovo je nesto poput public funkcija i property-ja u php-u
    return {
        // funkcija koja ce da renderuje templejt koji je definisan u 'props.template'
        render: () => {
            // funkcija 'RenderTemplate' ce izrenderovati remplate i smestiti ga u definisani props.wrapper
            // ovde nije neophodno da se radi return
            // return znaci da ceh na kraju imati izrenderovan html (koji je vec prethodno ubacen u wrapper)
            return RenderTemplate({
                // jquery-em dohvatamo template koji je definisan u 'this.props.template'
                // na ovaj nacin dohvatamo element koji ima 'data-template' atribut koji ima odredjenu vrednost
                //
                // RenderTemplate moze i da se prepravi da ne upisuje izrenderovani templejt u html automatski
                template: $(`[data-template="${props.template}"]`),
                wrapper: props.wrapper,
                props: templateData
            });
        }
    };
};

// funkcija je preuzeta sa neta i vrlo malo prepravljena
// a postoje i vec gotova resenja (https://github.com/janl/mustache.js)
// class for render html templates. Put template into a <script type="text/template"> tag.
// use variable in template like this (replacement placeholders): ${valuableName}
var RenderTemplate = function (options) {
    let template = $(options.template).text().split(/\$\{(.+?)\}/g),
        wrapper = options.wrapper,
        props = options.props;

    // replace variables instead of placeholders
    let render = function (props) {
        return function (tok, i) {
            return (i % 2) // ? props[tok] : tok;
                ? tok.split('.').reduce((a, b) => {return (a !== undefined) ? a[b] : a;}, props)
                : tok;
        };
    }

    // render actual template and return it
    return function () {
        let rendered = $(template.map(render(props)).join(''));

        // ovde radi ubacivanje renderovanog templejta u html
        // ovo moze da se obrise pa da ostane samo da vraca ono sto je izrenderovao
        // a negde kasnije da odradi ubacivanje u html
        $(wrapper).html(rendered);

        return rendered;
    }();
}

export default weatherCard;
 
