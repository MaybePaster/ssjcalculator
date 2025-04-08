document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация API
    const METAR_API_URL = 'https://metartaf.ru/';
    
    // Language toggle
    const languageToggle = document.getElementById('languageToggle');
    const languageLabel = document.getElementById('languageLabel');
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');
    const body = document.body;
    
    // Form elements
    const calculateBtn = document.getElementById('calculateBtn');
    const fetchMetarBtn = document.getElementById('fetchMetarBtn');
    const icaoCode = document.getElementById('icaoCode');
    const flapSetting = document.getElementById('flapSetting');
    const towInput = document.getElementById('tow');
    const oatInput = document.getElementById('oat');
    const runwayLength = document.getElementById('runwayLength');
    const runwayHeading = document.getElementById('runwayHeading');
    const runwayCondition = document.getElementById('runwayCondition');
    const elevation = document.getElementById('elevation');
    
    // Result fields
    const flexTemp = document.getElementById('flexTemp');
    const thsSetting = document.getElementById('thsSetting');
    const v1 = document.getElementById('v1');
    const vr = document.getElementById('vr');
    const v2 = document.getElementById('v2');
    
    // METAR fields
    const metarRaw = document.getElementById('metarRaw');
    const metarWind = document.getElementById('metarWind');
    const metarVisibility = document.getElementById('metarVisibility');
    const metarWeather = document.getElementById('metarWeather');
    const metarClouds = document.getElementById('metarClouds');
    const metarTemp = document.getElementById('metarTemp');
    const metarQnh = document.getElementById('metarQnh');
    
    // Translations
    const translations = {
        en: {
            title: "SuperJet Takeoff Calculator",
            themeLabel: "Dark Theme",
            languageLabel: "Русский",
            inputHeader: "Input Parameters",
            resultsHeader: "Results",
            metarHeader: "METAR Data",
            icaoLabel: "ICAO Code",
            rwyLengthLabel: "Runway Length (m)",
            rwyHeadingLabel: "Runway Heading (°)",
            rwyConditionLabel: "Runway Condition",
            elevationLabel: "Elevation (m)",
            flapLabel: "Flap Setting",
            mtowLabel: "MTOW (tons)",
            towLabel: "Takeoff Weight (tons)",
            oatLabel: "OAT (°C)",
            flexLabel: "Flex Temperature (°F)",
            thsLabel: "THS Setting",
            metarLabel: "Raw METAR",
            windLabel: "Wind (kts)",
            visibilityLabel: "Visibility (m)",
            weatherLabel: "Weather",
            cloudsLabel: "Clouds",
            metarTempLabel: "Temperature (°C)",
            qnhLabel: "QNH (hPa)",
            calcButton: "Calculate",
            fetchMetarButton: "Fetch METAR",
            runwayConditions: {
                dry: "Dry",
                wet: "Wet",
                contaminated: "Contaminated"
            },
            errors: {
                invalidIcao: "Please enter a valid 4-letter ICAO code",
                noData: "No METAR data available for this airport",
                apiError: "Error fetching METAR data"
            }
        },
        ru: {
            title: "Калькулятор взлета SuperJet",
            themeLabel: "Темная тема",
            languageLabel: "English",
            inputHeader: "Входные параметры",
            resultsHeader: "Результаты",
            metarHeader: "Данные METAR",
            icaoLabel: "Код ICAO",
            rwyLengthLabel: "Длина ВПП (м)",
            rwyHeadingLabel: "Курс ВПП (°)",
            rwyConditionLabel: "Состояние ВПП",
            elevationLabel: "Высота над уровнем моря (м)",
            flapLabel: "Положение закрылков",
            mtowLabel: "MTOW (тонны)",
            towLabel: "Взлетный вес (тонны)",
            oatLabel: "Температура воздуха (°C)",
            flexLabel: "Flex температура (°F)",
            thsLabel: "Установка THS",
            metarLabel: "Сырой METAR",
            windLabel: "Ветер (узлы)",
            visibilityLabel: "Видимость (м)",
            weatherLabel: "Погода",
            cloudsLabel: "Облачность",
            metarTempLabel: "Температура (°C)",
            qnhLabel: "QNH (гПа)",
            calcButton: "Рассчитать",
            fetchMetarButton: "Получить METAR",
            runwayConditions: {
                dry: "Сухая",
                wet: "Мокрая",
                contaminated: "Загрязненная"
            },
            errors: {
                invalidIcao: "Пожалуйста, введите корректный 4-буквенный код ICAO",
                noData: "Нет данных METAR для этого аэропорта",
                apiError: "Ошибка получения данных METAR"
            }
        }
    };
    
    // Current language (default English)
    let currentLang = 'en';
    
    // Toggle language
    languageToggle.addEventListener('change', function() {
        currentLang = this.checked ? 'ru' : 'en';
        updateLanguage();
    });
    
    function updateLanguage() {
        const lang = translations[currentLang];
        document.getElementById('title').textContent = lang.title;
        themeLabel.textContent = lang.themeLabel;
        languageLabel.textContent = lang.languageLabel;
        document.getElementById('inputHeader').textContent = lang.inputHeader;
        document.getElementById('resultsHeader').textContent = lang.resultsHeader;
        document.getElementById('metarHeader').textContent = lang.metarHeader;
        document.getElementById('icaoLabel').textContent = lang.icaoLabel;
        document.getElementById('rwyLengthLabel').textContent = lang.rwyLengthLabel;
        document.getElementById('rwyHeadingLabel').textContent = lang.rwyHeadingLabel;
        document.getElementById('rwyConditionLabel').textContent = lang.rwyConditionLabel;
        document.getElementById('elevationLabel').textContent = lang.elevationLabel;
        document.getElementById('flapLabel').textContent = lang.flapLabel;
        document.getElementById('mtowLabel').textContent = lang.mtowLabel;
        document.getElementById('towLabel').textContent = lang.towLabel;
        document.getElementById('oatLabel').textContent = lang.oatLabel;
        document.getElementById('flexLabel').textContent = lang.flexLabel;
        document.getElementById('thsLabel').textContent = lang.thsLabel;
        document.getElementById('metarLabel').textContent = lang.metarLabel;
        document.getElementById('windLabel').textContent = lang.windLabel;
        document.getElementById('visibilityLabel').textContent = lang.visibilityLabel;
        document.getElementById('weatherLabel').textContent = lang.weatherLabel;
        document.getElementById('cloudsLabel').textContent = lang.cloudsLabel;
        document.getElementById('metarTempLabel').textContent = lang.metarTempLabel;
        document.getElementById('qnhLabel').textContent = lang.qnhLabel;
        document.getElementById('calculateBtn').textContent = lang.calcButton;
        document.getElementById('fetchMetarBtn').textContent = lang.fetchMetarButton;
        
        // Update runway condition options
        const options = runwayCondition.options;
        options[0].text = lang.runwayConditions.dry;
        options[1].text = lang.runwayConditions.wet;
        options[2].text = lang.runwayConditions.contaminated;
    }
    
    // Toggle theme
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
    });
    
    // Calculate button click handler
    calculateBtn.addEventListener('click', function() {
        calculateSpeeds();
    });
    
    // Fetch METAR button click handler
    fetchMetarBtn.addEventListener('click', function() {
        const icao = icaoCode.value.trim().toUpperCase();
        if (icao.length !== 4) {
            alert(translations[currentLang].errors.invalidIcao);
            return;
        }
        
        fetchMetar(icao);
    });
    
    // Form submit handler
    document.getElementById('calcForm').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateSpeeds();
    });
    
    // Fetch METAR from metartaf.ru API
    async function fetchMetar(icao) {
        try {
            // Show loading state
            fetchMetarBtn.disabled = true;
            fetchMetarBtn.textContent = currentLang === 'en' ? "Loading..." : "Загрузка...";
            
            const response = await fetch(`${METAR_API_URL}${icao}.json`);
            
            if (!response.ok) {
                throw new Error(translations[currentLang].errors.noData);
            }
            
            const data = await response.json();
            
            if (!data || !data.metar) {
                throw new Error(translations[currentLang].errors.noData);
            }
            
            processMetarData(data);
            
        } catch (error) {
            console.error("Error fetching METAR:", error);
            metarRaw.value = `${translations[currentLang].errors.apiError}: ${error.message}`;
            clearMetarFields();
        } finally {
            // Reset button state
            fetchMetarBtn.disabled = false;
            fetchMetarBtn.textContent = translations[currentLang].fetchMetarButton;
        }
    }
    
    // Process METAR data from API response
    function processMetarData(metarData) {
        // Reset fields
        clearMetarFields();
        
        // Set raw METAR
        if (metarData.metar) {
            metarRaw.value = metarData.metar;
        } else {
            metarRaw.value = translations[currentLang].errors.noData;
            return;
        }
        
        // Parse wind information
        const windMatch = metarData.metar.match(/(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT/);
        if (windMatch) {
            const windDir = windMatch[1];
            const windSpeed = windMatch[2];
            const windGust = windMatch[4] ? `G${windMatch[4]}` : '';
            metarWind.value = `${windDir}°/${windSpeed}${windGust}`;
        }
        
        // Parse visibility
        const visMatch = metarData.metar.match(/(\d{4})(?=\s)/);
        if (visMatch) {
            metarVisibility.value = visMatch[1];
        } else {
            const visKmMatch = metarData.metar.match(/(\d+)KM/);
            if (visKmMatch) {
                metarVisibility.value = (visKmMatch[1] * 1000).toString();
            }
        }
        
        // Parse weather phenomena
        const weatherCodes = ['RA', 'SN', 'DZ', 'SG', 'PL', 'GS', 'GR', 'IC', 'TS', 'FG', 'BR', 'HZ', 'DU', 'SA', 'PY', 'VA', 'PO', 'SQ', 'FC', 'SS', 'DS'];
        const weatherMatch = metarData.metar.match(new RegExp(`(${weatherCodes.join('|')})`, 'g'));
        if (weatherMatch) {
            metarWeather.value = weatherMatch.join(', ');
        }
        
        // Parse clouds
        const cloudsMatch = metarData.metar.match(/(FEW|SCT|BKN|OVC)(\d{3})/g);
        if (cloudsMatch) {
            metarClouds.value = cloudsMatch.map(c => {
                const type = c.substring(0, 3);
                const height = parseInt(c.substring(3)) * 100;
                return `${type}@${height}ft`;
            }).join(', ');
        }
        
        // Parse temperature
        const tempMatch = metarData.metar.match(/(M?\d{2})\/(M?\d{2})/);
        if (tempMatch) {
            const temp = tempMatch[1].replace('M', '-');
            metarTemp.value = temp;
            // Update OAT field if temperature is found
            oatInput.value = temp;
        }
        
        // Parse QNH
        const qnhMatch = metarData.metar.match(/Q(\d{4})/);
        if (qnhMatch) {
            metarQnh.value = qnhMatch[1];
        }
        
        // Update runway condition based on weather
        updateRunwayCondition(metarData.metar);
    }
    
    // Update runway condition based on METAR data
    function updateRunwayCondition(metarText) {
        if (!metarText) return;
        
        const runwaySelect = document.getElementById('runwayCondition');
        
        if (metarText.includes('SN') || metarText.includes('SG') || 
            metarText.includes('PL') || metarText.includes('IC')) {
            runwaySelect.value = 'contaminated';
        } else if (metarText.includes('RA') || metarText.includes('DZ') || 
                   metarText.includes('SH') || metarText.includes('TS')) {
            runwaySelect.value = 'wet';
        } else {
            runwaySelect.value = 'dry';
        }
        
        // Update language if changed
        const lang = translations[currentLang];
        runwaySelect.options[0].text = lang.runwayConditions.dry;
        runwaySelect.options[1].text = lang.runwayConditions.wet;
        runwaySelect.options[2].text = lang.runwayConditions.contaminated;
    }
    
    function clearMetarFields() {
        metarWind.value = '';
        metarVisibility.value = '';
        metarWeather.value = '';
        metarClouds.value = '';
        metarTemp.value = '';
        metarQnh.value = '';
    }
    
    // Main calculation function
    function calculateSpeeds() {
        // Get input values
        const flap = flapSetting.value;
        const mtow = parseFloat(document.getElementById('mtow').value);
        const mtowV1 = parseFloat(document.getElementById('mtowV1').value);
        const mtowVr = parseFloat(document.getElementById('mtowVr').value);
        const mtowV2 = parseFloat(document.getElementById('mtowV2').value);
        const tow = parseFloat(towInput.value);
        const oat = parseFloat(oatInput.value);
        const rwyLength = parseFloat(runwayLength.value);
        const rwyCondition = runwayCondition.value;
        const elevationVal = parseFloat(elevation.value);
        
        // Validate inputs
        if (isNaN(tow) || isNaN(oat) || isNaN(rwyLength) || isNaN(elevationVal)) {
            alert(currentLang === 'en' 
                ? "Please enter valid numbers for all fields" 
                : "Пожалуйста, введите корректные значения во все поля");
            return;
        }
        
        if (tow > mtow) {
            alert(currentLang === 'en' 
                ? "Takeoff weight cannot exceed MTOW" 
                : "Взлетный вес не может превышать MTOW");
            return;
        }
        
        // Calculate speed corrections
        const weightDiff = mtow - tow;
        let coef;
        
        if (flap === "2") {
            coef = 1.5;
        } else if (flap === "1F") {
            coef = 1.8;
        }
        
        const correction = weightDiff * coef;
        
        // Calculate base speeds
        let calcV1 = (mtowV1 - correction);
        let calcVr = (mtowVr - correction);
        let calcV2 = (mtowV2 - correction);
        
        // Apply runway condition adjustments
        if (rwyCondition === "wet") {
            calcV1 = Math.min(calcV1 * 1.05, calcV1 + 5); // Increase by 5% or 5 kts
            calcVr = Math.min(calcVr * 1.03, calcVr + 3); // Smaller increase for VR
        } else if (rwyCondition === "contaminated") {
            calcV1 = Math.min(calcV1 * 1.1, calcV1 + 10); // Increase by 10% or 10 kts
            calcVr = Math.min(calcVr * 1.05, calcVr + 5); // Smaller increase for VR
        }
        
        // Apply runway length adjustment
        const lengthAdjustment = (3200 - rwyLength) / 1000; // 1kt per 1000m difference from 3200m
        calcV1 = Math.max(calcV1 + lengthAdjustment, calcV1 * 1.02);
        
        // Apply elevation adjustment
        const elevationAdjustment = elevationVal / 500; // 1kt per 500m elevation
        calcV1 += elevationAdjustment;
        calcVr += elevationAdjustment;
        calcV2 += elevationAdjustment;
        
        // Round to 1 decimal place
        calcV1 = calcV1.toFixed(1);
        calcVr = calcVr.toFixed(1);
        calcV2 = calcV2.toFixed(1);
        
        // Calculate Flex temperature (more accurate formula)
        const flexTempF = (50 - (0.33 * (mtow - tow)) + (0.11 * oat) + (elevationVal / 300)).toFixed(1);
        
        // Determine THS setting based on flap, weight, and condition
        let ths;
        if (flap === "2") {
            ths = tow > 40 ? "5" : "4";
        } else {
            ths = tow > 40 ? "6" : "5";
        }
        
        // Adjust THS for wet/contaminated runway
        if (rwyCondition !== "dry") {
            ths += " (+" + (flap === "2" ? "1" : "0.5") + ")";
        }
        
        // Update results
        flexTemp.value = flexTempF;
        thsSetting.value = ths;
        v1.value = calcV1;
        vr.value = calcVr;
        v2.value = calcV2;
    }
    
    // Initialize
    updateLanguage();
});
