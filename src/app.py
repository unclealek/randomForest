from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import traceback
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the expected feature names
with open('features.txt', 'r') as f:
    expected_features = [line.strip() for line in f]

@app.route('/train', methods=['POST'])
def train_model():
    try:
        if 'csvfile' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['csvfile']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file:
            df = pd.read_csv(file)
            # Ensure the input data has the correct feature names and order
            df = df[expected_features]
            
            # Convert 'Time' column to minutes since midnight
            def time_to_minutes(time_str):
                h, m = map(int, time_str.split(':'))
                return h * 60 + m

            df['Time'] = df['Time'].apply(time_to_minutes)

            # Ensure both Value and Time are included
            X = df[['Value', 'Time']]  # Features
            y = df['Value']  # Target variable

            # Train the model
            model = RandomForestRegressor()
            model.fit(X, y)

            # Save the trained model
            model_path = 'random_forest_regressor.pkl'
            joblib.dump(model, model_path)

            # Get the size of the model file
            model_size = os.path.getsize(model_path)
            model_size_kb = model_size / 1024
            model_size_mb = model_size_kb / 1024

            return jsonify({
                'message': 'Model trained successfully',
                'model_size_bytes': model_size,
                'model_size_kb': model_size_kb,
                'model_size_mb': model_size_mb
            })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'csvfile' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['csvfile']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file:
            df = pd.read_csv(file)
            # Ensure the input data has the correct feature names and order
            df = df[expected_features]
            
            # Load the pre-trained model
            model = joblib.load('random_forest_regressor.pkl')
            
            # Convert 'Time' column to minutes since midnight
            def time_to_minutes(time_str):
                h, m = map(int, time_str.split(':'))
                return h * 60 + m

            df['Time'] = df['Time'].apply(time_to_minutes)

            # Ensure both Value and Time are included
            X = df[['Value', 'Time']]  # Features

            # Make predictions
            predictions = model.predict(X)
            return jsonify({'prediction': predictions.tolist()})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001) 