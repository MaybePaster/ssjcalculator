// Константы
const MTOW = 45880;  // Максимальная взлётная масса (кг)
const V1_MTOW = 136, VR_MTOW = 136, V2_MTOW = 143;  // Скорости для MTOW (узлы)
const FLAPS_COEF = {"1": 1.8, "2": 1.5};  // Коэффициенты для Flaps 1+F и Flaps 2

// Загрузка переводов
let translations = {};
let currentLanguage = 'ru';

async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

function applyTranslations() {
    const lang = translations[currentLanguage];
    if (!lang) return;

    // Обновляем все элементы с переводами
    document.getElementById('title').textContent = lang.title;
    document.getElementById('aircraft-params').textContent = lang.aircraftParams;
    document.getElementById('tow-label').textContent = lang.tow;
    document.getElementById('cg-label').textContent = lang.cg;
    document.getElementById('flaps-config-label').textContent = lang.flapsConfig;
    document.getElementById('flaps1').textContent = lang.flaps1;
    document.getElementById('flaps2').textContent = lang.flaps2;
    document.getElementById('airport-params').textContent = lang.airportParams;
    document.getElementById('icao-label').textContent = lang.icao;
    document.getElementById('runway-label').textContent = lang.runway;
    document.getElementById('runway-length-label').textContent = lang.runwayLength;
    document.getElementById('runway-heading-label').textContent = lang.runwayHeading;
    document.getElementById('runway-condition-label').textContent = lang.runwayCondition;
    document.getElementById('dry').textContent = lang.dry;
    document.getElementById('wet').textContent = lang.wet;
    document.getElementById('snowy').textContent = lang.snowy;
    document.getElementById('elevation-label').textContent = lang.elevation;
    document.getElementById('weather-params').textContent = lang.weather;
    document.getElementById('qnh-label').textContent = lang.qnh;
    document.getElementById('temp-label').textContent = lang.temp;
    document.getElementById('wind-dir-label').textContent = lang.windDir;
    document.getElementById('wind-speed-label').textContent = lang.windSpeed;
    document.getElementById('calculate-btn').textContent = lang.calculate;
    document.getElementById('footer-text').textContent = lang.footer;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function calculateSpeeds() {
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
    
    try {
        // Получаем данные из формы
        const formData = {
            tow: parseFloat(document.getElementById('tow').value),
            cg: parseFloat(document.getElementById('cg').value),
            flaps_config: document.getElementById('flaps_config').value,
            icao: document.getElementById('icao').value.trim().toUpperCase(),
            runway: document.getElementById('runway').value.trim().toUpperCase(),
            runway_length: parseFloat(document.getElementById('runway_length').value),
            runway_heading: parseInt(document.getElementById('runway_heading').value),
            runway_condition: document.getElementById('runway_condition').value.toLowerCase(),
            airport_elevation: parseFloat(document.getElementById('airport_elevation').value),
            qnh: parseFloat(document.getElementById('qnh').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            wind_direction: parseInt(document.getElementById('wind_direction').value),
            wind_speed: parseFloat(document.getElementById('wind_speed').value)
        };

        // Валидация данных
        if (isNaN(formData.tow) || formData.tow <= 0) {
            throw new Error(translations[currentLanguage].error + ' ' + (currentLanguage === 'ru' ? 
                          'Взлётная масса должна быть положительным числом' : 
                          'Takeoff weight must be a positive number'));
        }
        
        if (formData.tow > MTOW) {
            throw new Error(translations[currentLanguage].error + ' ' + translations[currentLanguage].towError);
        }

        // Расчёт эффективного ветра на ВПП
        let wind_angle = Math.abs(formData.wind_direction - formData.runway_heading) % 360;
        if (wind_angle > 180) {
            wind_angle = 360 - wind_angle;
        }
        const headwind = formData.wind_speed * Math.cos(wind_angle * Math.PI / 180);

        // Основная коррекция по массе
        const coef = FLAPS_COEF[formData.flaps_config];
        const weight_diff = MTOW - formData.tow;
        const correction = weight_diff * coef / 1000;

        // Базовая коррекция скоростей
        let V1 = V1_MTOW - correction;
        let VR = VR_MTOW - correction;
        let V2 = V2_MTOW - correction;

        // Дополнительные корректировки
        // 1. Высота аэропорта
        const altitude_correction = formData.airport_elevation / 1000 * 0.5;
        V1 += altitude_correction;
        VR += altitude_correction;
        V2 += altitude_correction;
        
        // 2. Температура
        const temp_correction = (formData.temperature - 15) / 10 * 1.5;
        V1 += temp_correction;
        VR += temp_correction;
        V2 += temp_correction;
        
        // 3. Ветер
        const wind_correction = headwind * 0.3;
        V1 -= wind_correction;
        VR -= wind_correction;
        
        // 4. Состояние ВПП
        if (formData.runway_condition === "мокрая" || formData.runway_condition === "заснеженная" ||
            formData.runway_condition === "wet" || formData.runway_condition === "snowy") {
            const condition_correction = formData.runway_condition === "мокрая" || formData.runway_condition === "wet" ? 3 : 5;
            V1 += condition_correction;
            VR += condition_correction;
            V2 += condition_correction;
        }

        // Округление и проверка минимальных значений
        V1 = Math.max(Math.round(V1), 0);
        VR = Math.max(Math.round(VR), 0);
        V2 = Math.max(Math.round(V2), 0);

        // Проверка длины ВПП
        const required_length = (V2 * 1.5) * 0.5144;  // Примерная формула

        // Показываем результаты
        displayResults(formData, {V1, VR, V2}, headwind, required_length);
        
    } catch (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
        document.getElementById('results').style.display = 'none';
    }
}

function displayResults(data, speeds, headwind, required_length) {
    const resultsDiv = document.getElementById('results');
    const lang = translations[currentLanguage];
    const runwayWarning = required_length > data.runway_length ? 
        `<span class="warning">${lang.notEnough}</span>` : '';
    
    // Генерация HTML с результатами
    resultsDiv.innerHTML = `
        <h2>${lang.results}</h2>
        
        <div class="speeds">
            <div class="speed-box">
                <div>${lang.v1}</div>
                <div class="speed-value">${speeds.V1}</div>
                <div>${lang.knots}</div>
            </div>
            <div class="speed-box">
                <div>${lang.vr}</div>
                <div class="speed-value">${speeds.VR}</div>
                <div>${lang.knots}</div>
            </div>
            <div class="speed-box">
                <div>${lang.v2}</div>
                <div class="speed-value">${speeds.V2}</div>
                <div>${lang.knots}</div>
            </div>
        </div>
        
        <h3>${lang.takeoffInfo}</h3>
        <table>
            <tr>
                <th>${lang.airport}</th>
                <td>${data.icao}, ${currentLanguage === 'ru' ? 'ВПП' : 'Runway'} ${data.runway}</td>
            </tr>
            <tr>
                <th>${lang.length}</th>
                <td>${data.runway_length} m</td>
            </tr>
            <tr>
                <th>${lang.heading}</th>
                <td>${data.runway_heading}°</td>
            </tr>
            <tr>
                <th>${lang.condition}</th>
                <td>${data.runway_condition}</td>
            </tr>
            <tr>
                <th>${lang.elev}</th>
                <td>${data.airport_elevation} ft</td>
            </tr>
            <tr>
                <th>${lang.headwind}</th>
                <td>${headwind.toFixed(1)} ${lang.knots}</td>
            </tr>
            <tr>
                <th>${lang.reqLength}</th>
                <td>${required_length.toFixed(0)} m ${runwayWarning}</td>
            </tr>
        </table>
    `;
    
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка переводов
    loadTranslations();
    
    // Инициализация темы
    initializeTheme();
    
    // Обработчики событий
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    document.getElementById('language-select').addEventListener('change', function() {
        currentLanguage = this.value;
        applyTranslations();
    });
    
    document.getElementById('calculator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSpeeds();
    });
    
    // Установка текущего года в подвале
    const year = new Date().getFullYear();
    document.getElementById('footer-text').textContent += ` | ${year}`;
});
