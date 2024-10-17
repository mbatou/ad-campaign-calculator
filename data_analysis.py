import pandas as pd
import numpy as np

def analyze_data(file_path):
    try:
        # Load the Excel file
        df = pd.read_excel(file_path)
        
        # Print column names for debugging
        print("Column names:", df.columns.tolist())

        # Find the correct column names
        impressions_col = [col for col in df.columns if 'Impressions' in col][0]
        clicks_col = [col for col in df.columns if 'Clics (tous)' in col][0]
        spend_col = [col for col in df.columns if 'Montant dépensé' in col][0]
        results_col = [col for col in df.columns if 'Résultats' in col][0]
        objective_col = 'Indicateur de résultats'

        # Convert numeric columns to float
        numeric_columns = [impressions_col, clicks_col, spend_col, results_col]
        df[numeric_columns] = df[numeric_columns].astype(float)

        # Calculate overall metrics
        total_spend = df[spend_col].sum()
        total_impressions = df[impressions_col].sum()
        total_clicks = df[clicks_col].sum()

        analysis_results = {
            'total_spend': total_spend,
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'overall_cpm': (total_spend / total_impressions) * 1000 if total_impressions > 0 else 0,
            'overall_cpc': total_spend / total_clicks if total_clicks > 0 else 0,
            'overall_ctr': (total_clicks / total_impressions) * 100 if total_impressions > 0 else 0,
            'metrics_by_objective': {}
        }

        # Calculate metrics for each objective
        for objective in df[objective_col].unique():
            objective_df = df[df[objective_col] == objective]
            obj_spend = objective_df[spend_col].sum()
            obj_impressions = objective_df[impressions_col].sum()
            obj_clicks = objective_df[clicks_col].sum()
            obj_results = objective_df[results_col].sum()

            analysis_results['metrics_by_objective'][objective] = {
                'total_spend': obj_spend,
                'total_impressions': obj_impressions,
                'total_clicks': obj_clicks,
                'total_results': obj_results,
                'avg_cpm': (obj_spend / obj_impressions) * 1000 if obj_impressions > 0 else 0,
                'avg_cpc': obj_spend / obj_clicks if obj_clicks > 0 else 0,
                'avg_ctr': (obj_clicks / obj_impressions) * 100 if obj_impressions > 0 else 0,
                'avg_cost_per_result': obj_spend / obj_results if obj_results > 0 else 0
            }

        return analysis_results
    except FileNotFoundError:
        raise FileNotFoundError(f"The file '{file_path}' was not found. Please check the path.")

# Function to get analysis results
def get_analysis_results():
    return analyze_data('static/data.xlsx')  # Update the path here

# Example usage
if __name__ == "__main__":
    results = get_analysis_results()
    print("\nAnalysis Results:")
    for key, value in results.items():
        if key != 'metrics_by_objective':
            print(f"{key}: {value}")
    
    print("\nMetrics by Objective:")
    for objective, metrics in results['metrics_by_objective'].items():
        print(f"\n{objective}:")
        for metric, value in metrics.items():
            print(f"  {metric}: {value}")
