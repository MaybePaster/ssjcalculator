const MTOW = 45880;
const V1_MTOW = 136, VR_MTOW = 136, V2_MTOW = 143; 
const FLAPS_COEF = {"1": 1.8, "2": 1.5, "3": 1.2};
const THS_COEF = 0.2;
const ISA_TEMP = 15; 
const ISA_LAPSE_RATE = 1.98;
const MAX_FLEX_DELTA = 50; 
const MIN_FLEX_DELTA = 5; 

const AVIATIONSTACK_API_KEY = '058b895d683b4bef5819cd0f46e13b68';
const CHECKWX_API_KEY = '0959c4a55b0b435492fd2b09db59cffb';

let translations = {};
let currentLanguage = 'ru';
let airportCache = {};

document.addEventListener('DOMContentLoaded', function() {
    loadTranslations();
    initializeTheme();
    setupEventListeners();
    updateYear();
});

async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
        showError(currentLanguage === 'ru' ? 
            'Ошибка загрузки переводов' : 
            'Failed to load translations');
    }
}

function applyTranslations() {
    const lang = translations[currentLanguage];
    if (!lang) return;

    const elements = {
        'title': lang.title,
        'aircraft-params': lang.aircraftParams,
        'tow-label': lang.tow,
        'cg-label': lang.cg,
        'flaps-config-label': lang.flapsConfig,
        'flaps1': lang.flaps1,
        'flaps2': lang.flaps2,
        'flaps3': lang.flaps3,
        'flex-temp-label': lang.flexTemp,
        'flex-note': lang.flexNote,
        'airport-params': lang.airportParams,
        'icao-label': lang.icao,
        'runway-label': lang.runway,
        'runway-length-label': lang.runwayLength,
        'runway-heading-label': lang.runwayHeading,
        'runway-condition-label': lang.runwayCondition,
        'dry': lang.dry,
        'wet': lang.wet,
        'snowy': lang.snowy,
        'elevation-label': lang.elevation,
        'weather-params': lang.weather,
        'qnh-label': lang.qnh,
        'temp-label': lang.temp,
        'wind-dir-label': lang.windDir,
        'wind-speed-label': lang.windSpeed,
        'ths-setting-label': lang.thsSetting,
        'ths-auto': lang.thsAuto,
        'ths-manual': lang.thsManual,
        'ths-value-label': lang.thsValue,
        'calculate-btn': lang.calculate,
        'sync-text': currentLanguage === 'ru' ? 'Синхронизировать' : 'Sync'
    };

    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('language-select').addEventListener('change', changeLanguage);
    document.getElementById('ths_setting').addEventListener('change', toggleTHSInput);
    document.getElementById('calculator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSpeeds();
    });
    document.getElementById('sync-airport').addEventListener('click', syncAirportData);
}

// Переключение темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Инициализация темы
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Смена языка
function changeLanguage() {
    currentLanguage = this.value;
    applyTranslations();
    updateYear();
}

// Переключение поля THS
function toggleTHSInput() {
    const thsValueGroup = document.getElementById('ths-value-group');
    thsValueGroup.style.display = this.value === 'manual' ? 'block' : 'none';
}

// Обновление года в подвале
function updateYear() {
    const year = new Date().getFullYear();
    document.getElementById('footer-text').textContent = 
        (translations[currentLanguage]?.footer || '') + ` | ${year}`;
}

function calculateFlexTemp(oat, elevation) {
    const isaCorrection = (elevation / 1000) * ISA_LAPSE_RATE;
    const isaTemp = ISA_TEMP - isaCorrection;
    
    let flexTemp = oat + (isaTemp - oat) / 2;
    flexTemp = Math.min(oat + MAX_FLEX_DELTA, flexTemp);
    flexTemp = Math.max(oat + MIN_FLEX_DELTA, flexTemp);
    flexTemp = Math.floor(flexTemp);
    
    return flexTemp;
}

function determineThrustMode(flexTemp, oat, runwayLength, tow, elevation) {
    const isCriticalCondition = 
        (flexTemp >= oat + MAX_FLEX_DELTA - 5) ||
        (tow > MTOW * 0.95) ||
        (runwayLength < 2000) ||
        (elevation > 5000);
    
    return isCriticalCondition ? 'TOGA' : 'FLEX';
}

async function syncAirportData() {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    const syncButton = document.getElementById('sync-airport');
    
    if (!icao || icao.length !== 4) {
        showError(currentLanguage === 'ru' ? 
            'Введите корректный ICAO код (4 буквы)' : 
            'Enter valid ICAO code (4 letters)');
        return;
    }
    
    if (airportCache[icao]) {
        fillAirportData(airportCache[icao]);
        showSuccess(currentLanguage === 'ru' ? 
            'Данные загружены из кэша' : 
            'Data loaded from cache');
        return;
    }
    
    syncButton.disabled = true;
    syncButton.innerHTML = `<span class="loading"></span> ${currentLanguage === 'ru' ? 'Загрузка...' : 'Loading...'}`;
    
    try {
        const [airportData, metarData] = await Promise.all([
            fetchAirportData(icao),
            fetchMETAR(icao)
        ]);
        
        if (!airportData && !metarData) {
            throw new Error(currentLanguage === 'ru' ? 
                'Данные аэропорта не найдены' : 
                'Airport data not found');
        }
        
        const combinedData = {
            ...airportData,
            ...metarData
        };
        
        airportCache[icao] = combinedData;
        fillAirportData(combinedData);
        
        showSuccess(currentLanguage === 'ru' ? 
            'Данные аэропорта успешно загружены' : 
            'Airport data loaded successfully');
    } catch (error) {
        console.error('Sync error:', error);
        showError(error.message);
    } finally {
        syncButton.disabled = false;
        syncButton.innerHTML = `<span class="sync-icon">🔄</span><span id="sync-text">${currentLanguage === 'ru' ? 'Синхронизировать' : 'Sync'}</span>`;
    }
}

async function fetchAirportData(icao) {
    try {
        const response = await fetch(`https://api.aviationstack.com/v1/airports?access_key=${AVIATIONSTACK_API_KEY}&icao=${icao}`);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        if (!data.data?.length) throw new Error('Airport not found');
        
        const airport = data.data[0];
        const runway = airport.runways?.[0] || {};
        
        return {
            icao: airport.icao,
            elevation_ft: airport.elevation_ft || 0,
            runway: runway.le_ident || '',
            runway_length: runway.length_ft ? Math.round(runway.length_ft * 0.3048) : 0,
            runway_heading: runway.le_heading_degT || 0
        };
    } catch (error) {
        console.error('Error fetching airport data:', error);
        return null;
    }
}

async function fetchMETAR(icao) {
    try {
        const response = await fetch(`https://api.checkwx.com/metar/${icao}/decoded`, {
            headers: {'X-API-Key': CHECKWX_API_KEY}
        });
        if (!response.ok) throw new Error('METAR API request failed');
        
        const data = await response.json();
        if (!data.data?.length) throw new Error('METAR not found');
        
        const metar = data.data[0];
        const conditions = metar.conditions || [];
        const isRain = conditions.some(c => c.code.includes('RA') || c.code.includes('DZ'));
        const isSnow = conditions.some(c => c.code.includes('SN') || c.code.includes('SG'));
        
        return {
            temperature: metar.temperature?.celsius || 15,
            qnh: metar.barometer?.hpa || 1013,
            wind_degrees: metar.wind?.degrees || 0,
            wind_speed_kts: metar.wind?.speed_kts || 0,
            condition: isSnow ? 'snowy' : isRain ? 'wet' : 'dry'
        };
    } catch (error) {
        console.error('Error fetching METAR:', error);
        return null;
    }
}

function fillAirportData(data) {
    const fields = {
        'runway': data.runway,
        'runway_length': data.runway_length,
        'runway_heading': data.runway_heading,
        'airport_elevation': data.elevation_ft,
        'temperature': data.temperature,
        'qnh': data.qnh,
        'wind_direction': data.wind_degrees,
        'wind_speed': data.wind_speed_kts,
        'runway_condition': data.condition
    };
    
    for (const [id, value] of Object.entries(fields)) {
        if (value !== undefined) {
            const element = document.getElementById(id);
            if (element) element.value = value;
        }
    }
}

function calculateSpeeds() {
    const formData = getFormData();
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
    
    try {
        validateInputData(formData);
        
        const windAngle = Math.abs(formData.wind_direction - formData.runway_heading) % 360;
        const effectiveWindAngle = windAngle > 180 ? 360 - windAngle : windAngle;
        const headwind = formData.wind_speed * Math.cos(effectiveWindAngle * Math.PI / 180);
        
        const flexTemp = calculateFlexTemp(formData.temperature, formData.airport_elevation);
        const thrustMode = determineThrustMode(
            flexTemp,
            formData.temperature,
            formData.runway_length,
            formData.tow,
            formData.airport_elevation
        );
        
        const speeds = calculateFinalSpeeds(formData, headwind, flexTemp);
        const requiredLength = (speeds.V2 * 1.5) * 0.5144;
        
        displayResults(formData, speeds, headwind, requiredLength, flexTemp, thrustMode);
    } catch (error) {
        showError(error.message);
        document.getElementById('results').style.display = 'none';
    }
}

function getFormData() {
    return {
        tow: parseFloat(document.getElementById('tow').value),
        cg: parseFloat(document.getElementById('cg').value),
        flaps_config: document.getElementById('flaps_config').value,
        icao: document.getElementById('icao').value.trim().toUpperCase(),
        runway: document.getElementById('runway').value.trim().toUpperCase(),
        runway_length: parseFloat(document.getElementById('runway_length').value),
        runway_heading: parseInt(document.getElementById('runway_heading').value),
        runway_condition: document.getElementById('runway_condition').value,
        airport_elevation: parseFloat(document.getElementById('airport_elevation').value),
        qnh: parseFloat(document.getElementById('qnh').value),
        temperature: parseInt(document.getElementById('temperature').value),
        wind_direction: parseInt(document.getElementById('wind_direction').value),
        wind_speed: parseFloat(document.getElementById('wind_speed').value),
        ths_setting: document.getElementById('ths_setting').value,
        ths_value: parseFloat(document.getElementById('ths_value').value) || 0
    };
}

function validateInputData(data) {
    if (isNaN(data.tow) || data.tow <= 0) {
        throw new Error(currentLanguage === 'ru' ? 
            'Взлётная масса должна быть положительным числом' : 
            'Takeoff weight must be positive');
    }
    
    if (data.tow > MTOW) {
        throw new Error(currentLanguage === 'ru' ? 
            'Взлётная масса превышает максимальную' : 
            'Takeoff weight exceeds maximum');
    }
    
    if (data.ths_setting === 'manual' && (isNaN(data.ths_value) || data.ths_value < -4 || data.ths_value > 4)) {
        throw new Error(currentLanguage === 'ru' ? 
            'Значение THS должно быть между -4 и +4' : 
            'THS value must be between -4 and +4');
    }
}

function calculateFinalSpeeds(data, headwind, flexTemp) {
    const coef = FLAPS_COEF[data.flaps_config];
    const massCorrection = (MTOW - data.tow) * coef / 1000;
    
    let V1 = V1_MTOW - massCorrection;
    let VR = VR_MTOW - massCorrection;
    let V2 = V2_MTOW - massCorrection;
    
    // Коррекции
    const tempCorrection = (data.temperature - 15) / 10 * 1.5;
    const windCorrection = headwind * 0.3;
    const flexCorrection = (flexTemp - data.temperature) * THS_COEF;
    
    V1 += tempCorrection - windCorrection + flexCorrection;
    VR += tempCorrection - windCorrection + flexCorrection;
    V2 += tempCorrection - windCorrection + flexCorrection;
    
    // Состояние ВПП
    if (data.runway_condition === "wet") {
        V1 += 3; VR += 3; V2 += 3;
    } else if (data.runway_condition === "snowy") {
        V1 += 5; VR += 5; V2 += 5;
    }
    
    // THS
    if (data.ths_setting === 'manual') {
        const thsCorrection = data.ths_value * THS_COEF;
        V1 += thsCorrection; VR += thsCorrection; V2 += thsCorrection;
    }
    
    return {
        V1: Math.max(Math.round(V1), 110),
        VR: Math.max(Math.round(VR), 115),
        V2: Math.max(Math.round(V2), 120)
    };
}

function displayResults(data, speeds, headwind, requiredLength, flexTemp, thrustMode) {
    const resultsDiv = document.getElementById('results');
    const lang = translations[currentLanguage] || {};
    const isRussian = currentLanguage === 'ru';
    
    const runwayWarning = requiredLength > data.runway_length ? 
        `<span class="warning">${lang.notEnough || 'Not enough runway'}</span>` : '';
    
    const thsRow = data.ths_setting === 'manual' ? `
        <tr>
            <th>${isRussian ? 'Значение THS' : 'THS Value'}</th>
            <td>${data.ths_value}</td>
        </tr>
    ` : '';
    
    const flexDelta = flexTemp - data.temperature;
    
    resultsDiv.innerHTML = `
        <h2>${lang.results || 'Results'}</h2>
        <div class="speeds">
            <div class="speed-box">
                <div>${lang.v1 || 'V1'}</div>
                <div class="speed-value">${speeds.V1}</div>
                <div>${lang.knots || 'kts'}</div>
            </div>
            <div class="speed-box">
                <div>${lang.vr || 'VR'}</div>
                <div class="speed-value">${speeds.VR}</div>
                <div>${lang.knots || 'kts'}</div>
            </div>
            <div class="speed-box">
                <div>${lang.v2 || 'V2'}</div>
                <div class="speed-value">${speeds.V2}</div>
                <div>${lang.knots || 'kts'}</div>
            </div>
        </div>
        <h3>${lang.takeoffInfo || 'Takeoff Information'}</h3>
        <table>
            <tr>
                <th>${lang.airport || 'Airport'}</th>
                <td>${data.icao}, ${isRussian ? 'ВПП' : 'Runway'} ${data.runway}</td>
            </tr>
            <tr>
                <th>${lang.length || 'Length'}</th>
                <td>${data.runway_length} m ${runwayWarning}</td>
            </tr>
            <tr>
                <th>${isRussian ? 'Требуемая длина' : 'Required length'}</th>
                <td>${Math.round(requiredLength)} m</td>
            </tr>
            <tr>
                <th>${lang.heading || 'Heading'}</th>
                <td>${data.runway_heading}°</td>
            </tr>
            <tr>
                <th>${lang.condition || 'Condition'}</th>
                <td>${data.runway_condition}</td>
            </tr>
            <tr>
                <th>${lang.elev || 'Elevation'}</th>
                <td>${data.airport_elevation} ft</td>
            </tr>
            <tr>
                <th>${lang.headwind || 'Headwind'}</th>
                <td>${headwind.toFixed(1)} ${lang.knots || 'kts'}</td>
            </tr>
            <tr>
                <th>FLEX TO TEMP</th>
                <td>${flexTemp} °C (${flexDelta}° ${isRussian ? 'над OAT' : 'above OAT'})</td>
            </tr>
            <tr>
                <th>${isRussian ? 'Режим тяги' : 'Thrust mode'}</th>
                <td>${thrustMode} ${thrustMode === 'FLEX' ? 
                    isRussian ? '(пониженная тяга)' : '(reduced thrust)' : 
                    isRussian ? '(полная тяга)' : '(full thrust)'}</td>
            </tr>
            ${thsRow}
        </table>
    `;
    
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
        <div class="message error-message">
            ${message}
        </div>
    `;
    messagesDiv.style.display = 'block';
    setTimeout(() => messagesDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
        <div class="message success-message">
            ${message}
        </div>
    `;
    messagesDiv.style.display = 'block';
    setTimeout(() => messagesDiv.style.display = 'none', 5000);
}
