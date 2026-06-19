// Default values
const defaults = {
    host: 'http://localhost:8000',
    transcribePath: '/v1/chat/completions',
    healthPath: '/health'
};

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(defaults, (settings) => {
        document.getElementById('host').value = settings.host;
        document.getElementById('transcribePath').value = settings.transcribePath;
        document.getElementById('healthPath').value = settings.healthPath;
    });
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
    const settings = {
        host: document.getElementById('host').value.replace(/\/$/, ""), // Remove trailing slash
        transcribePath: document.getElementById('transcribePath').value,
        healthPath: document.getElementById('healthPath').value
    };

    chrome.storage.local.set(settings, () => {
        alert('Settings saved!');
    });
});