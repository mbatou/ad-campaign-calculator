import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import traceback
from data_analysis import analyze_data, predict_results

# Create the Flask application instance
app = Flask(__name__, static_folder='static')
CORS(app)

# Load and analyze data
analysis_results = analyze_data('data.xlsx')

def calculate_metrics(user_input):
    objective = user_input['objective']
    budget = float(user_input['budget'])
    duration = int(user_input['duration'])
    
    # Get metrics for the selected objective
    obj_metrics = analysis_results['metrics_by_objective'].get(objective, {})
    obj_trends = analysis_results['trends'].get(objective, {})
    
    # Use historical data or user input
    cpc = float(user_input['cpc']) or obj_metrics.get('cpc', analysis_results['overall_metrics']['average_cpc'])
    cpm = float(user_input['cpm']) or obj_metrics.get('cpm', analysis_results['overall_metrics']['average_cpm'])
    ctr = float(user_input['ctr']) or obj_metrics.get('ctr', analysis_results['overall_metrics']['average_ctr'])
    conversion_rate = float(user_input['conversionRate']) or obj_metrics.get('conversion_rate', analysis_results['overall_metrics']['average_conversion_rate'])

    # Apply trends
    cpc += obj_trends.get('cpc_trend', 0) * duration
    cpm += obj_trends.get('cpm_trend', 0) * duration
    ctr += obj_trends.get('ctr_trend', 0) * duration
    conversion_rate += obj_trends.get('conversion_rate_trend', 0) * duration

    # Calculate metrics
    impressions = (budget / cpm) * 1000 if cpm > 0 else 0
    clicks = impressions * (ctr / 100) if ctr > 0 else (budget / cpc if cpc > 0 else 0)
    conversions = clicks * (conversion_rate / 100)
    reach = impressions * 0.7  # Assuming 70% of impressions are unique
    
    metrics = {
        'estimated_reach': round(reach),
        'estimated_impressions': round(impressions),
        'estimated_clicks': round(clicks),
        'estimated_conversions': round(conversions),
        'cost_per_click': round(budget / clicks if clicks > 0 else 0, 2),
        'cost_per_conversion': round(budget / conversions if conversions > 0 else 0, 2),
        'ctr': round(ctr, 2),
        'conversion_rate': round(conversion_rate, 2)
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
    global analysis_results
    if 'metrics_by_objective' in analysis_results:
        objectives = list(analysis_results['metrics_by_objective'].keys())
    else:
        # If 'metrics_by_objective' is not in analysis_results, use a default list or generate from data
        objectives = ['post_engagement', 'link_clicks', 'video_views', 'page_likes']  # Add default objectives
    return jsonify(objectives)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/predict', methods=['GET'])
def predict():
    objective = request.args.get('objective')
    spend = float(request.args.get('spend'))

    if objective not in analysis_results.get('metrics_by_objective', {}):
        return jsonify({'error': f'No data available for objective: {objective}'})

    try:
        prediction = predict_results(objective, spend, analysis_results)
        return jsonify({'metrics': prediction})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
