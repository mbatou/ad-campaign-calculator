let jsonData = null;
let metrics_by_objective;

// Load the Excel file when the page loads
window.addEventListener('load', loadExcelFile);

document.addEventListener('DOMContentLoaded', function() {
    loadObjectives();
    document.getElementById('campaignForm').addEventListener('submit', calculateAndDisplayResults);

    // Add event listeners for real-time updates
    const inputFields = ['objective', 'budget', 'duration', 'cpc', 'cpm', 'ctr', 'conversionRate'];
    inputFields.forEach(field => {
        document.getElementById(field).addEventListener('input', calculateAndDisplayResults);
    });

    const form = document.getElementById('prediction-form');
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

function calculateAndDisplayResults(event) {
    event.preventDefault(); // Prevent form submission

    const objectiveElement = document.getElementById('objective');
    const budgetElement = document.getElementById('budget');

    if (!objectiveElement || !budgetElement) {
        console.error('Required form elements not found');
        displayError('An error occurred: Form elements not found.');
        return;
    }

    const objective = objectiveElement.value;
    const budget = parseFloat(budgetElement.value);

    if (objective === "") {
        displayError('Please select an objective.');
        return;
    }

    if (isNaN(budget) || budget <= 0) {
        displayError('Please enter a valid budget amount.');
        return;
    }

    // Collect other input values
    const duration = parseFloat(document.getElementById('duration').value) || 0;
    const cpc = parseFloat(document.getElementById('cpc').value) || 0;
    const cpm = parseFloat(document.getElementById('cpm').value) || 0;
    const ctr = parseFloat(document.getElementById('ctr').value) || 0;
    const conversionRate = parseFloat(document.getElementById('conversionRate').value) || 0;

    try {
        // Perform calculations
        const results = calculateResults(objective, budget, duration, cpc, cpm, ctr, conversionRate);

        // Display results
        displayResults(results);
    } catch (error) {
        console.error('Error in calculation:', error);
        displayError('An error occurred during calculation. Please check your inputs and try again.');
    }
}

function displayError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<p class="text-red-500">${message}</p>`;
}

function calculateResults(objective, budget, duration, cpc, cpm, ctr, conversionRate) {
    // Implement your calculation logic here
    // This is a placeholder implementation
    const estimatedImpressions = budget / (cpm / 1000);
    const estimatedClicks = estimatedImpressions * (ctr / 100);
    const estimatedConversions = estimatedClicks * (conversionRate / 100);

    return {
        estimatedReach: Math.round(estimatedImpressions * 0.8), // Assuming 80% of impressions are unique
        estimatedImpressions: Math.round(estimatedImpressions),
        estimatedClicks: Math.round(estimatedClicks),
        estimatedConversions: Math.round(estimatedConversions),
        costPerClick: budget / estimatedClicks,
        costPerConversion: estimatedConversions > 0 ? budget / estimatedConversions : 0,
        clickThroughRate: ctr,
        conversionRate: conversionRate
    };
}

function displayResults(results) {
    const updateElement = (id, value, formatter = (v) => v) => {
        const element = document.querySelector(`#results p[id="${id}"]`);
        if (element) {
            element.textContent = formatter(value);
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    };

    updateElement('estimatedReach', results.estimatedReach, (v) => v.toLocaleString());
    updateElement('estimatedImpressions', results.estimatedImpressions, (v) => v.toLocaleString());
    updateElement('estimatedClicks', results.estimatedClicks, (v) => v.toLocaleString());
    updateElement('estimatedConversions', results.estimatedConversions, (v) => v.toLocaleString());
    updateElement('costPerClick', results.costPerClick, (v) => `$${v.toFixed(2)}`);
    updateElement('costPerConversion', results.costPerConversion, (v) => `$${v.toFixed(2)}`);
    updateElement('ctr', results.clickThroughRate, (v) => `${v.toFixed(2)}%`);
    updateElement('conversionRate', results.conversionRate, (v) => `${v.toFixed(2)}%`);
}

function loadObjectives() {
    fetch('http://127.0.0.1:5000/objectives')
        .then(response => response.json())
        .then(objectives => {
            const selectElement = document.getElementById('objective');
            objectives.forEach(objective => {
                const option = document.createElement('option');
                option.value = objective;
                option.textContent = objective.charAt(0).toUpperCase() + objective.slice(1).replace(/_/g, ' ');
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading objectives:', error));
}

function loadExcelFile() {
    fetch('data.xlsx') // Assuming the file is named 'data.xlsx' and is in the same directory as the HTML file
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
            calculateAndDisplayResults(); // Initial calculation
        })
        .catch(error => console.error('Error loading Excel file:', error));
}

function displayResult(result) {
    const budgetResult = document.getElementById('budgetResult');
    const estimatedResult = document.getElementById('estimatedResult');

    budgetResult.textContent = `$${result.budget}`;
    
    let metric;
    switch(result.goal) {
        case 'awareness':
            metric = 'Impressions';
            break;
        case 'engagement':
            metric = 'Engagements';
            break;
        case 'traffic':
            metric = 'Clicks';
            break;
        case 'lead_generation':
            metric = 'Leads';
            break;
    }
    
    estimatedResult.textContent = `${result.estimatedResult} ${metric}`;
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
