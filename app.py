from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import traceback
from data_analysis import get_analysis_results

# Create the Flask application instance
app = Flask(__name__, static_folder='static')
CORS(app)

# Load and analyze data
analysis_results = get_analysis_results()

def calculate_metrics(user_input):
    objective = user_input['objective']
    budget = float(user_input['budget'])
    duration = int(user_input['duration'])
    
    # Get metrics for the selected objective
    obj_metrics = analysis_results['metrics_by_objective'].get(objective, {})
    
    # Use historical data or user input
    cpc = float(user_input['cpc']) or obj_metrics.get('avg_cpc', analysis_results['overall_cpc'])
    cpm = float(user_input['cpm']) or obj_metrics.get('avg_cpm', analysis_results['overall_cpm'])
    ctr = float(user_input['ctr']) or obj_metrics.get('avg_ctr', analysis_results['overall_ctr'])
    cost_per_result = obj_metrics.get('avg_cost_per_result', 0)

    # Calculate metrics
    impressions = (budget / cpm) * 1000 if cpm > 0 else 0
    clicks = impressions * (ctr / 100) if ctr > 0 else (budget / cpc if cpc > 0 else 0)
    results = budget / cost_per_result if cost_per_result > 0 else 0
    reach = impressions * 0.7  # Assuming 70% of impressions are unique
    
    metrics = {
        'estimated_reach': round(reach),
        'estimated_impressions': round(impressions),
        'estimated_clicks': round(clicks),
        'estimated_results': round(results),
        'cost_per_click': round(budget / clicks if clicks > 0 else 0, 2),
        'cost_per_result': round(budget / results if results > 0 else 0, 2),
        'ctr': round(ctr, 2),
        'cpm': round(cpm, 2)
    }
    
    return metrics

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        user_input = request.json
        if not user_input or 'budget' not in user_input or 'duration' not in user_input or 'objective' not in user_input:
            return jsonify({'error': 'Missing required fields'}), 400
        
        metrics = calculate_metrics(user_input)
        return jsonify(metrics)
    except Exception as e:
        return jsonify({
            'error': f"An error occurred: {str(e)}",
            'traceback': traceback.format_exc()
        }), 400

@app.route('/objectives', methods=['GET'])
def get_objectives():
    objectives = list(analysis_results['metrics_by_objective'].keys())
    return jsonify(objectives)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True)
