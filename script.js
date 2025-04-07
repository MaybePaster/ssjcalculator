// Константы
const MTOW = 45880;  // Максимальная взлётная масса (кг)
const V1_MTOW = 136, VR_MTOW = 136, V2_MTOW = 143;  // Скорости для MTOW (узлы)
const FLAPS_COEF = {"1": 1.8, "2": 1.5};  // Коэффициенты для Flaps 1+F и Flaps 2

document.addEventListener('DOMContentLoaded', function() {
    // Установка текущей даты в подвале
    document.querySelector('footer p').textContent += ` | ${new Date().getFullYear()}`;
    
    // Обработка формы
    document.getElementById('calculator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSpeeds();
    });
});

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
            throw new Error('Взлётная масса должна быть положительным числом');
        }
        
        if (formData.tow > MTOW) {
            throw new Error(`TOW не может превышать MTOW (${MTOW} кг)!`);
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
        if (formData.runway_condition === "мокрая" || formData.runway_condition === "заснеженная") {
            const condition_correction = formData.runway_condition === "мокрая" ? 3 : 5;
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
        errorElement.textContent = `Ошибка: ${error.message}`;
        errorElement.style.display = 'block';
        document.getElementById('results').style.display = 'none';
    }
}

function displayResults(data, speeds, headwind, required_length) {
    const resultsDiv = document.getElementById('results');
    const runwayWarning = required_length > data.runway_length ? 
        `<span class="warning">(Недостаточно!)</span>` : '';
    
    // Генерация HTML с результатами
    resultsDiv.innerHTML = `
        <h2>Результаты расчёта</h2>
        
        <div class="speeds">
            <div class="speed-box">
                <div>V1</div>
                <div class="speed-value">${speeds.V1}</div>
                <div>узлов</div>
            </div>
            <div class="speed-box">
                <div>VR</div>
                <div class="speed-value">${speeds.VR}</div>
                <div>узлов</div>
            </div>
            <div class="speed-box">
                <div>V2</div>
                <div class="speed-value">${speeds.V2}</div>
                <div>узлов</div>
            </div>
        </div>
        
        <h3>Информация о взлёте</h3>
        <table>
            <tr>
                <th>Параметр</th>
                <th>Значение</th>
            </tr>
            <tr>
                <td>Аэропорт</td>
                <td>${data.icao}, ВПП ${data.runway}</td>
            </tr>
            <tr>
                <td>Длина ВПП</td>
                <td>${data.runway_length} м</td>
            </tr>
            <tr>
                <td>Курс ВПП</td>
                <td>${data.runway_heading}°</td>
            </tr>
            <tr>
                <td>Состояние ВПП</td>
                <td>${data.runway_condition}</td>
            </tr>
            <tr>
                <td>Высота аэропорта</td>
                <td>${data.airport_elevation} футов</td>
            </tr>
            <tr>
                <td>Встречный ветер</td>
                <td>${headwind.toFixed(1)} узлов</td>
            </tr>
            <tr>
                <td>Требуемая длина ВПП</td>
                <td>${required_length.toFixed(0)} м ${runwayWarning}</td>
            </tr>
        </table>
    `;
    
    resultsDiv.style.display = 'block';
    
    // Прокрутка к результатам
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}
