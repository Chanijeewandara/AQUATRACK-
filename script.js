// AquaTrack - Water Management System JavaScript

// Configuration
const CONFIG = {
    THINGSPEAK: {
        CHANNEL_ID: '2981979',
        READ_API_KEY: '7RMX1WDAP41K4HC5',
        WRITE_API_KEY: 'J3IJ6N2QHVLEM391',
        BASE_URL: 'https://api.thingspeak.com'
    },
    WIFI: {
        SSID: "peshalaWifi",
        PASSWORD: "12345678"
    },
    LOGIN: {
        USERNAME: 'admin',
        PASSWORD: 'aquatrack123'
    },
    UPDATE_INTERVAL: 15000 // 15 seconds
};

// Global variables
let flowRateChart;
let consumptionChart;
let updateInterval;
let consumptionData = [];
let flowRateData = [];
let timeLabels = [];

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Exit button click
    document.getElementById('exitBtn').addEventListener('click', handleExit);
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (username === CONFIG.LOGIN.USERNAME && password === CONFIG.LOGIN.PASSWORD) {
        // Hide login page and show dashboard
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.remove('hidden');
        
        // Clear login form
        document.getElementById('loginForm').reset();
        errorMessage.classList.add('hidden');
        
        // Initialize dashboard
        initializeDashboard();
    } else {
        // Show error message
        errorMessage.classList.remove('hidden');
        
        // Clear password field
        document.getElementById('password').value = '';
    }
}

// Handle Exit
function handleExit() {
    // Clear update interval
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    // Hide dashboard and show login page
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    
    // Reset dashboard data
    resetDashboardData();
}

// Initialize Dashboard
function initializeDashboard() {
    console.log('Initializing AquaTrack Dashboard...');
    
    // Initialize charts
    initializeCharts();
    
    // Fetch initial data
    fetchThingSpeakData();
    
    // Set up periodic updates
    updateInterval = setInterval(fetchThingSpeakData, CONFIG.UPDATE_INTERVAL);
    
    console.log('Dashboard initialized successfully');
}

// Initialize Charts using Chart.js
function initializeCharts() {
    // Initialize Flow Rate Chart
    const flowRateCtx = document.getElementById('flowRateChart').getContext('2d');
    flowRateChart = new Chart(flowRateCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Flow Rate (L/min)',
                data: flowRateData,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 50,
                    title: { 
                        display: true, 
                        text: 'L/min',
                        color: '#333',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Time',
                        color: '#333',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // Initialize Water Consumption Chart
    const consumptionCtx = document.getElementById('consumptionChart').getContext('2d');
    consumptionChart = new Chart(consumptionCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Water Consumption (L)',
                data: consumptionData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1000,
                    title: { 
                        display: true, 
                        text: 'Liters',
                        color: '#333',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Time',
                        color: '#333',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    console.log('Charts initialized successfully');
}

// Fetch ThingSpeak Data
async function fetchThingSpeakData() {
    try {
        console.log('Fetching ThingSpeak data...');
        
        const url = `${CONFIG.THINGSPEAK.BASE_URL}/channels/${CONFIG.THINGSPEAK.CHANNEL_ID}/feeds.json?api_key=${CONFIG.THINGSPEAK.READ_API_KEY}&results=20`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            processThingSpeakData(data.feeds);
            updateLastUpdateTime();
            console.log('ThingSpeak data updated successfully');
        } else {
            console.warn('No data feeds received from ThingSpeak');
        }
        
    } catch (error) {
        console.error('Error fetching ThingSpeak data:', error);
        handleDataFetchError(error);
    }
}

// Process ThingSpeak Data
function processThingSpeakData(feeds) {
    // Clear existing data arrays
    flowRateData.length = 0;
    consumptionData.length = 0;
    timeLabels.length = 0;

    // Process each feed entry
    feeds.forEach(feed => {
        const time = new Date(feed.created_at);
        const timeLabel = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        timeLabels.push(timeLabel);
        
        // Field 1: Flow Rate (L/min)
        const flowRate = parseFloat(feed.field1) || 0;
        flowRateData.push(flowRate);
        
        // Field 3: Water Consumption (L)
        const consumption = parseFloat(feed.field3) || 0;
        consumptionData.push(consumption);
    });

    // Update charts with new data
    updateCharts();
    
    // Update leakage detection status using Field 2 (Solenoid Status)
    const latestFeed = feeds[feeds.length - 1];
    updateLeakageDetectionStatus(latestFeed.field2);
    
    console.log(`Processed ${feeds.length} data points`);
}

// Update Charts
function updateCharts() {
    // Update Flow Rate Chart
    if (flowRateChart) {
        flowRateChart.data.labels = [...timeLabels];
        flowRateChart.data.datasets[0].data = [...flowRateData];
        flowRateChart.update('none'); // Use 'none' mode for better performance
    }

    // Update Consumption Chart
    if (consumptionChart) {
        consumptionChart.data.labels = [...timeLabels];
        consumptionChart.data.datasets[0].data = [...consumptionData];
        consumptionChart.update('none'); // Use 'none' mode for better performance
    }
}

// Update Leakage Detection Status
function updateLeakageDetectionStatus(solenoidValue) {
    const indicator = document.getElementById('solenoidIndicator');
    const text = document.getElementById('solenoidText');
    const warning = document.getElementById('leakageWarning');
    
    // Convert value to boolean (1 = leakage detected, 0 = normal)
    const isLeakageDetected = (solenoidValue === '1' || solenoidValue === 1);
    
    // Update status indicator
    indicator.className = `status-indicator ${isLeakageDetected ? 'status-on' : 'status-off'}`;
    
    // Update status text
    text.textContent = isLeakageDetected ? 'LEAKAGE DETECTED' : 'NORMAL';
    text.style.color = isLeakageDetected ? '#ff4757' : '#2ed573';
    
    // Show/hide warning message
    warning.classList.toggle('hidden', !isLeakageDetected);
    
    // Log status change
    console.log(`Leakage detection status: ${isLeakageDetected ? 'DETECTED' : 'NORMAL'}`);
}

// Update Last Update Time
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    const currentTime = new Date().toLocaleString();
    lastUpdateElement.textContent = `Last updated: ${currentTime}`;
}

// Handle Data Fetch Error
function handleDataFetchError(error) {
    console.error('Data fetch error:', error);
    
    // You could implement error handling UI here
    // For example, show a temporary error message to the user
    const lastUpdateElement = document.getElementById('lastUpdate');
    lastUpdateElement.textContent = 'Error: Unable to fetch data';
    lastUpdateElement.style.color = '#ff4757';
    
    // Reset color after 5 seconds
    setTimeout(() => {
        lastUpdateElement.style.color = '#666';
    }, 5000);
}

// Reset Dashboard Data
function resetDashboardData() {
    // Clear data arrays
    consumptionData.length = 0;
    flowRateData.length = 0;
    timeLabels.length = 0;
    
    // Destroy existing charts
    if (flowRateChart) {
        flowRateChart.destroy();
        flowRateChart = null;
    }
    
    if (consumptionChart) {
        consumptionChart.destroy();
        consumptionChart = null;
    }
    
    console.log('Dashboard data reset');
}

// Utility Functions
function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
});

console.log('AquaTrack JavaScript loaded successfully');