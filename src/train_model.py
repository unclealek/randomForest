import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# Load your dataset
data = pd.read_csv('moisture_data (7).csv')

# Verify the columns
print("Columns in the data:", data.columns)

# Convert 'Time' column to minutes since midnight
def time_to_minutes(time_str):
    h, m = map(int, time_str.split(':'))
    return h * 60 + m

data['timestamp'] = data['timestamp'].apply(time_to_minutes)

# Ensure both Value and Time are included
X = data[['timestamp', 'value']]  # Features
y = data['value']  # Target variable

# Train the model
model = RandomForestRegressor()
model.fit(X, y)

# Save the trained model
joblib.dump(model, 'random_forest_regressor.pkl')
print("Model saved as random_forest_regressor.pkl")

# Make predictions
predictions = model.predict(X)

# Add predictions to the dataframe
data['Predictions'] = predictions

# Save the predictions to a new CSV file
data.to_csv('Predictions.csv', index=False)

print("Predictions saved to Predictions.csv")