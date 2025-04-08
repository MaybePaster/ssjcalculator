document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация API
    const METAR_API_URL = 'https://metartaf.ru/';
    const SAMPLE_DATA = {
        'UUEE': 'UUEE 141030Z 24008MPS 9999 -SHRA BKN020 OVC050 12/09 Q1013 R24/290050 NOSIG',
        'USRR': 'USRR 141030Z 23005MPS 9999 SCT030 BKN100 15/10 Q1012 R23/290050 NOSIG',
        'UUWW': 'UUWW 141030Z 23007MPS 9999 SCT020 BKN040 11/08 Q1015 R32L/290050 NOSIG',
        'UUDD': 'UUDD 141030Z 25009MPS 9999 FEW020 SCT040 13/07 Q1014 R14R/290050 NOSIG',
        'ULLI': 'ULLI 141030Z 24010G15MPS 9999 -RA BKN015 OVC025 10/08 Q1016 R10L/290050 NOSIG',
        'URSS': 'URSS 141030Z 22004MPS 9999 FEW030 BKN100 17/12 Q1011 R23/290050 NOSIG'
    };

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
    
    // Fetch METAR from metartaf.ru with fallback
    async function fetchMetar(icao) {
        try {
            fetchMetarBtn.disabled = true;
            fetchMetarBtn.textContent = currentLang === 'en' ? "Loading..." : "Загрузка...";
            
            // Try direct fetch first
            let response = await fetchWithRetry(`${METAR_API_URL}${icao}.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let data = await response.json();
            
            if (!data || !data.metar) {
                // Fallback to sample data if available
                if (SAMPLE_DATA[icao]) {
                    data = { metar: SAMPLE_DATA[icao] };
                } else {
                    throw new Error(translations[currentLang].errors.noData);
                }
            }
            
            processMetarData(data);
            
        } catch (error) {
            console.error("METAR fetch error:", error);
            metarRaw.value = `${translations[currentLang].errors.apiError}: ${error.message}`;
            
            // Show sample data if available
            if (SAMPLE_DATA[icao]) {
                metarRaw.value = SAMPLE_DATA[icao];
                processMetarData({ metar: SAMPLE_DATA[icao] });
            }
        } finally {
            fetchMetarBtn.disabled = false;
            fetchMetarBtn.textContent = translations[currentLang].fetchMetarButton;
        }
    }

    // Improved fetch with retry and CORS proxy fallback
    async function fetchWithRetry(url, retries = 3) {
        const proxyUrl = 'https://corsproxy.io/?';
        
        for (let i = 0; i < retries; i++) {
            try {
                // Try direct connection first
                const directResponse = await fetch(url);
                if (directResponse.ok) return directResponse;
                
                // Fallback to CORS proxy
                const proxiedResponse = await fetch(proxyUrl + encodeURIComponent(url), {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                
                if (proxiedResponse.ok) return proxiedResponse;
                
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        
        throw new Error(`Failed after ${retries} retries`);
    }
    
    // Process METAR data
    function processMetarData(metarData) {
        clearMetarFields();
        
        if (!metarData.metar) {
            metarRaw.value = translations[currentLang].errors.noData;
            return;
        }
        
        const metarText = metarData.metar;
        metarRaw.value = metarText;
        
        try {
            // Parse wind
            const windMatch = metarText.match(/(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?(KT|MPS)/);
            if (windMatch) {
                let windDir = windMatch[1];
                let windSpeed = windMatch[2];
                const windGust = windMatch[4] ? `G${windMatch[4]}` : '';
                
                // Convert MPS to KT if needed
                if (windMatch[5] === 'MPS') {
                    windSpeed = Math.round(windSpeed * 1.94384);
                }
                
                metarWind.value = `${windDir}°/${windSpeed}${windGust} KT`;
            }
            
            // Parse visibility
            const visMatch = metarText.match(/(\d{4})(?=\s|$)/) || 
                            metarText.match(/(\d+)SM/) || 
                            metarText.match(/(\d+)KM/);
            if (visMatch) {
                let visibility = visMatch[1];
                if (visMatch[2]) visibility = Math.round(visMatch[2] * 1609.34);
                if (visMatch[3]) visibility = visMatch[3] * 1000;
                metarVisibility.value = visibility;
            }
            
            // Parse weather phenomena
            const weatherCodes = ['RA','SN','DZ','SG','PL','GS','GR','IC','TS','FG','BR','HZ','DU','SA','PY','VA','PO','SQ','FC','SS','DS'];
            const weatherMatch = metarText.match(new RegExp(`(\\+|-|VC)?(${weatherCodes.join('|')})`, 'g'));
            if (weatherMatch) {
                metarWeather.value = weatherMatch.join(' ');
            }
            
            // Parse clouds
            const cloudsMatch = metarText.match(/(FEW|SCT|BKN|OVC)(\d{3})/g);
            if (cloudsMatch) {
                metarClouds.value = cloudsMatch.map(c => {
                    const type = c.substring(0,3);
                    const height = parseInt(c.substring(3)) * 100;
                    return `${type}@${height}ft`;
                }).join(', ');
            }
            
            // Parse temperature
            const tempMatch = metarText.match(/(M?\d{2})\/(M?\d{2})/);
            if (tempMatch) {
                const temp = tempMatch[1].replace('M', '-');
                metarTemp.value = temp;
                oatInput.value = temp;
            }
            
            // Parse QNH
            const qnhMatch = metarText.match(/Q(\d{4})/) || 
                             metarText.match(/A(\d{4})/);
            if (qnhMatch) {
                metarQnh.value = qnhMatch[1];
            }
            
            // Update runway condition
            updateRunwayCondition(metarText);
            
        } catch (parseError) {
            console.error("METAR parse error:", parseError);
        }
    }
    
    // Update runway condition based on METAR
    function updateRunwayCondition(metarText) {
        if (!metarText) return;
        
        const runwaySelect = document.getElementById('runwayCondition');
        
        if (/(SN|SG|PL|IC|GR|GS)/.test(metarText)) {
            runwaySelect.value = 'contaminated';
        } else if (/(RA|DZ|SH|TS)/.test(metarText)) {
            runwaySelect.value = 'wet';
        } else {
            runwaySelect.value = 'dry';
        }
        
        // Update language
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
        let coef = flap === "2" ? 1.5 : 1.8;
        const correction = weightDiff * coef;
        
        // Calculate base speeds
        let calcV1 = (mtowV1 - correction);
        let calcVr = (mtowVr - correction);
        let calcV2 = (mtowV2 - correction);
        
        // Apply runway condition adjustments
        if (rwyCondition === "wet") {
            calcV1 = Math.min(calcV1 * 1.05, calcV1 + 5);
            calcVr = Math.min(calcVr * 1.03, calcVr + 3);
        } else if (rwyCondition === "contaminated") {
            calcV1 = Math.min(calcV1 * 1.1, calcV1 + 10);
            calcVr = Math.min(calcVr * 1.05, calcVr + 5);
        }
        
        // Apply runway length adjustment
        const lengthAdjustment = (3200 - rwyLength) / 1000;
        calcV1 = Math.max(calcV1 + lengthAdjustment, calcV1 * 1.02);
        
        // Apply elevation adjustment
        const elevationAdjustment = elevationVal / 500;
        calcV1 += elevationAdjustment;
        calcVr += elevationAdjustment;
        calcV2 += elevationAdjustment;
        
        // Calculate Flex temperature
        const flexTempF = (50 - (0.33 * (mtow - tow)) + (0.11 * oat) + (elevationVal / 300)).toFixed(1);
        
        // Determine THS setting
        let ths = flap === "2" 
            ? (tow > 40 ? "5" : "4") 
            : (tow > 40 ? "6" : "5");
        
        if (rwyCondition !== "dry") {
            ths += " (+" + (flap === "2" ? "1" : "0.5") + ")";
        }
        
        // Update results
        flexTemp.value = flexTempF;
        thsSetting.value = ths;
        v1.value = calcV1.toFixed(1);
        vr.value = calcVr.toFixed(1);
        v2.value = calcV2.toFixed(1);
    }
    
    // Initialize
    updateLanguage();
});
