let jsonData = null;
let metrics_by_objective;
let analysisResults = null;

// Load the Excel file when the page loads
window.addEventListener('load', loadExcelFile);

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    const form = document.getElementById('campaignForm');
    if (form) {
        console.log('Form found, adding event listener');
        form.onsubmit = function(event) {
            event.preventDefault();
            calculateAndDisplayResults();
        };
    } else {
        console.error('Form with ID "campaignForm" not found.');
    }

    loadObjectives();

    // Add event listeners for real-time updates
    const inputFields = ['objective', 'budget', 'duration', 'cpc', 'cpm', 'ctr'];
    inputFields.forEach(field => {
        document.getElementById(field).addEventListener('input', calculateAndDisplayResults);
    });

    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const objective = document.getElementById('objective').value;
        const spend = document.getElementById('spend').value;

        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                objective: objective,
                spend: spend
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
            } else {
                resultDiv.innerHTML = `
                    <p>Predicted Results: ${data.predictedResults}</p>
                    <p>Predicted Impressions: ${data.predictedImpressions}</p>
                    <p>Predicted Coverage: ${data.predictedCoverage}</p>
                `;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            resultDiv.innerHTML = '<p class="error">An error occurred. Please try again.</p>';
        });
    });
});

function calculateAndDisplayResults() {
    const formData = {
        objective: document.getElementById('objective').value,
        budget: parseFloat(document.getElementById('budget').value),
        duration: parseInt(document.getElementById('duration').value),
        cpc: parseFloat(document.getElementById('cpc').value) || 0,
        cpm: parseFloat(document.getElementById('cpm').value) || 0,
        ctr: parseFloat(document.getElementById('ctr').value) || 0,
    };

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response data
        console.log(data);
        // Display results in the UI
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p class="text-red-500">${message}</p>`;
}

function displayResult(result) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Estimated Reach</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">${result.estimated_reach.toLocaleString()}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Estimated Impressions</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">${result.estimated_impressions.toLocaleString()}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Estimated Clicks</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">${result.estimated_clicks.toLocaleString()}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Estimated Results</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">${result.estimated_results.toLocaleString()}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Cost Per Click</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">$${result.cost_per_click.toFixed(2)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Cost Per Result</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">$${result.cost_per_result.toFixed(2)}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Click-Through Rate (CTR)</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">${result.ctr.toFixed(2)}%</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
            <span class="text-sm font-medium text-gray-500">Cost Per Mille (CPM)</span>
            <p class="mt-1 text-2xl font-semibold text-gray-900">$${result.cpm.toFixed(2)}</p>
        </div>
    `;
}

function loadObjectives() {
    console.log('Loading objectives...');
    fetch('http://127.0.0.1:5500/objectives')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(objectives => {
            console.log('Objectives received:', objectives);
            const selectElement = document.getElementById('objective');
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Select an objective</option>';
                objectives.forEach(objective => {
                    const option = document.createElement('option');
                    option.value = objective;
                    option.textContent = objective.charAt(0).toUpperCase() + objective.slice(1).replace(/_/g, ' ');
                    selectElement.appendChild(option);
                });
                console.log('Dropdown populated with objectives');
            } else {
                console.error('Select element with ID "objective" not found.');
            }
        })
        .catch(error => {
            console.error('Error loading objectives:', error);
        });
}

function loadExcelFile() {
    fetch('data.xlsx')  // Adjust the path if necessary
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();  // Use blob for binary files
        })
        .then(blob => {
            // Process the Excel file here
            const url = window.URL.createObjectURL(blob);
            // Use the URL to read the Excel file
        })
        .catch(error => {
            console.error('Error loading Excel file:', error);
        });
}

// Add event listener to the Calculate button
document.getElementById('calculateButton').addEventListener('click', calculateAndDisplayResults);

// Fetch the metrics data from the server
fetch('http://127.0.0.1:5000/objectives')
    .then(response => response.json())
    .then(data => {
        metrics_by_objective = data;
    })
    .catch(error => console.error('Error fetching objectives:', error));

console.log(document.getElementById('estimatedReach')); // Should not be null
