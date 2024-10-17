document.getElementById('campaignForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateAndDisplayResults();
});

// Add event listeners for real-time updates
document.getElementById('duration').addEventListener('input', calculateAndDisplayResults);
document.getElementById('goal').addEventListener('change', calculateAndDisplayResults);

function calculateAndDisplayResults() {
    const duration = parseInt(document.getElementById('duration').value) || 0;
    const goal = document.getElementById('goal').value;

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration, goal }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        displayResult(result);
    })
    .catch(error => {
        console.error('Error:', error);
        displayError(error.message);
    });
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

function displayError(message) {
    const budgetResult = document.getElementById('budgetResult');
    const estimatedResult = document.getElementById('estimatedResult');

    budgetResult.textContent = 'Error';
    estimatedResult.textContent = message;
}
