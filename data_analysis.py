import pandas as pd
import numpy as np
from scipy import stats

def analyze_data(file_path):
    # Load the Excel file
    df = pd.read_excel(file_path)
    
    # Print column names for debugging
    print("Column names:", df.columns.tolist())

    # Find the correct column names
    impressions_col = [col for col in df.columns if 'Impressions' in col][0]
    clicks_col = [col for col in df.columns if 'Clics (tous)' in col][0]
    spend_col = [col for col in df.columns if 'Montant dépensé' in col][0]
    
    # Option 1: More flexible matching
    objective_cols = [col for col in df.columns if 'objectif' in col.lower()]
    if objective_cols:
        objective_col = objective_cols[0]
    else:
        # Option 2: Provide a fallback or raise a custom error
        print("Warning: No 'Objectif' column found. Using 'Indicateur de résultats' instead.")
        objective_col = 'Indicateur de résultats'
    
    results_col = [col for col in df.columns if 'Résultats' in col][0]
    coverage_col = [col for col in df.columns if 'Couverture' in col][0]

    # Convert numeric columns to float
    numeric_columns = [impressions_col, clicks_col, spend_col, results_col, coverage_col]
    df[numeric_columns] = df[numeric_columns].astype(float)

    # Calculate overall metrics
    analysis_results = {
        'total_impressions': df[impressions_col].sum(),
        'total_clicks': df[clicks_col].sum(),
        'total_spend': df[spend_col].sum(),
        'click_through_rate': (df[clicks_col].sum() / df[impressions_col].sum()) * 100,
        'cost_per_click': df[spend_col].sum() / df[clicks_col].sum(),
        'cost_per_mille': (df[spend_col].sum() / df[impressions_col].sum()) * 1000,
        'metrics_by_objective': {}  # Initialize this even if it's empty
    }

    # Populate metrics_by_objective if possible
    if 'Indicateur de résultats' in df.columns:
        for objective in df['Indicateur de résultats'].unique():
            objective_df = df[df['Indicateur de résultats'] == objective]
            analysis_results['metrics_by_objective'][objective] = {
                'total_spend': objective_df[spend_col].sum(),
                'total_results': objective_df[results_col].sum(),
                # Add more metrics as needed
            }

    return analysis_results

def predict_results(objective, spend, analysis_results):
    avg_cost_key = f'avg_cost_{objective}'
    avg_impressions_key = f'avg_impressions_{objective}'
    avg_coverage_key = f'avg_coverage_{objective}'
    
    if avg_cost_key in analysis_results and analysis_results[avg_cost_key] > 0:
        predicted_results = spend / analysis_results[avg_cost_key]
        predicted_impressions = (spend / analysis_results[avg_cost_key]) * analysis_results[avg_impressions_key]
        predicted_coverage = (spend / analysis_results[avg_cost_key]) * analysis_results[avg_coverage_key]
        
        return {
            'predicted_results': predicted_results,
            'predicted_impressions': predicted_impressions,
            'predicted_coverage': predicted_coverage
        }
    else:
        return "Not enough data to predict results for this objective"

# Call the function and print results
analysis_results = analyze_data('data.xlsx')
print("\nAnalysis Results:")
for key, value in analysis_results.items():
    print(f"{key}: {value}")

# Example usage:
predicted_engagement = predict_results('post_engagement', 100, analysis_results)
print(f"\nPredictions for $100 spend on post engagement:")
print(f"Debug: predicted_engagement = {predicted_engagement}")
print(f"Debug: type of predicted_engagement = {type(predicted_engagement)}")
if isinstance(predicted_engagement, dict):
    print(f"Predicted engagements: {predicted_engagement.get('predicted_engagements', 'N/A')}")
    print(f"Predicted impressions: {predicted_engagement.get('predicted_impressions', 'N/A')}")
    print(f"Predicted clicks: {predicted_engagement.get('predicted_clicks', 'N/A')}")
else:
    print(f"Prediction: {predicted_engagement}")
