// Константы
const MTOW = 45880; // Максимальная взлётная масса (кг)
const V1_MTOW = 136, VR_MTOW = 136, V2_MTOW = 143; // Скорости для MTOW (узлы)
const FLAPS_COEF = {"1": 1.8, "2": 1.5, "3": 1.2};
const THS_COEF = 0.2;
const ISA_TEMP = 15; // Стандартная температура ISA на уровне моря
const ISA_LAPSE_RATE = 1.98; // Градиент температуры ISA (°C/1000ft)
const MAX_FLEX_DELTA = 50; // Максимальная разница FLEX (обычно 50°C для Airbus)
const MIN_FLEX_DELTA = 5; // Минимальная разница FLEX

let translations = {};
let currentLanguage = 'ru';
let airportCache = {};

document.addEventListener('DOMContentLoaded', function() {
    loadTranslations();
    initializeTheme();
    setupEventListeners();
    updateYear();
});

// ... (функции loadTranslations, applyTranslations, setupEventListeners остаются без изменений) ...

// Правильный расчёт FLEX температуры
function calculateFlexTemp(oat, elevation) {
    // 1. Коррекция ISA для высоты аэропорта
    const isaCorrection = (elevation / 1000) * ISA_LAPSE_RATE;
    const isaTemp = ISA_TEMP - isaCorrection;
    
    // 2. Расчёт FLEX температуры
    let flexTemp = oat + isaTemp;
    
    // 3. Ограничения и округление
    flexTemp = Math.min(oat + MAX_FLEX_DELTA, flexTemp); // Не выше OAT+50
    flexTemp = Math.max(oat + MIN_FLEX_DELTA, flexTemp); // Минимум OAT+5
    flexTemp = Math.floor(flexTemp); // Округление вниз
    
    return flexTemp;
}

// Определение режима тяги (TOGA или FLEX)
function determineThrustMode(flexTemp, oat, runwayLength, tow, elevation) {
    // Условия, когда нельзя использовать FLEX (нужен TOGA)
    const isCriticalCondition = 
        (flexTemp >= oat + MAX_FLEX_DELTA - 5) || // FLEX близок к максимуму
        (tow > MTOW * 0.95) || // Высокая масса
        (runwayLength < 2000) || // Короткая ВПП
        (elevation > 5000); // Высокогорный аэропорт
    
    return isCriticalCondition ? 'TOGA' : 'FLEX';
}

// Расчёт взлётных скоростей
function calculateSpeeds() {
    const formData = getFormData();
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
    
    try {
        validateInputData(formData);
        
        // Расчёт эффективного ветра
        const windAngle = Math.abs(formData.wind_direction - formData.runway_heading) % 360;
        const effectiveWindAngle = windAngle > 180 ? 360 - windAngle : windAngle;
        const headwind = formData.wind_speed * Math.cos(effectiveWindAngle * Math.PI / 180);

        // Расчёт FLEX температуры
        const flexTemp = calculateFlexTemp(formData.temperature, formData.airport_elevation);
        const thrustMode = determineThrustMode(
            flexTemp,
            formData.temperature,
            formData.runway_length,
            formData.tow,
            formData.airport_elevation
        );

        // Отображение FLEX и режима тяги
        document.getElementById('flex_temp_display').textContent = `${flexTemp} °C`;
        document.getElementById('thrust_mode_display').textContent = thrustMode;

        // Коррекция скоростей в зависимости от режима тяги
        const flexCorrection = thrustMode === 'FLEX' ? 
            (flexTemp - formData.temperature) * 0.2 : 0;

        // Основной расчёт скоростей
        const coef = FLAPS_COEF[formData.flaps_config];
        const massCorrection = (MTOW - formData.tow) * coef / 1000;
        
        let V1 = V1_MTOW - massCorrection + flexCorrection;
        let VR = VR_MTOW - massCorrection + flexCorrection;
        let V2 = V2_MTOW - massCorrection + flexCorrection;

        // Коррекция на ветер
        const windCorrection = headwind * 0.3;
        V1 -= windCorrection;
        VR -= windCorrection;
        V2 -= windCorrection;

        // Коррекция на состояние ВПП
        if (formData.runway_condition === "wet" || formData.runway_condition === "мокрая") {
            V1 += 3; VR += 3; V2 += 3;
        } else if (formData.runway_condition === "snowy" || formData.runway_condition === "заснеженная") {
            V1 += 5; VR += 5; V2 += 5;
        }

        // Ограничение минимальных скоростей
        V1 = Math.max(Math.round(V1), 110);
        VR = Math.max(Math.round(VR), 115);
        V2 = Math.max(Math.round(V2), 120);

        // Проверка длины ВПП
        const requiredLength = (V2 * 1.5) * 0.5144; // Примерная формула

        // Отображение результатов
        displayResults(formData, {V1, VR, V2}, headwind, requiredLength, flexTemp, thrustMode);
        
    } catch (error) {
        showError(error.message);
        document.getElementById('results').style.display = 'none';
    }
}

// В функции displayResults добавить:
function displayResults(data, speeds, headwind, requiredLength, flexTemp, thrustMode) {
    const isRussian = currentLanguage === 'ru';
    const flexDelta = flexTemp - data.temperature;
    
    let resultsHTML = `
        <h2>${isRussian ? 'Результаты расчёта' : 'Calculation Results'}</h2>
        <div class="speeds">
            <!-- Блоки скоростей -->
        </div>
        <h3>${isRussian ? 'Параметры взлёта' : 'Takeoff Parameters'}</h3>
        <table>
            <!-- Основные параметры -->
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
            <!-- Остальные параметры -->
        </table>
    `;
    
    document.getElementById('results').innerHTML = resultsHTML;
    document.getElementById('results').style.display = 'block';
}
