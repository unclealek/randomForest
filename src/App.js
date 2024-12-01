import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = (event) => {
    event.preventDefault();
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const csvData = text.split('\n').map(row => row.split(','));
        setData(csvData);
        setCountdown(5); 
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTrain = () => {
    if (file) {
      const formData = new FormData();
      formData.append('csvfile', file);

      fetch('http://127.0.0.1:5001/train', {  
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Model trained successfully:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    }
  };

  const handlePredict = () => {
    if (file) {
      const formData = new FormData();
      formData.append('csvfile', file);

      fetch('http://127.0.0.1:5001/predict', {  
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Received predictions:', data);
        setPredictions(data.prediction);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    }
  };

  const handleDownload = () => {
    if (predictions) {
      const csvContent = "data:text/csv;charset=utf-8," 
        + data.map((row, index) => row.join(",") + "," + (predictions[index] || "")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "Predictions.csv");
      document.body.appendChild(link); // Required for FF
      link.click();
      document.body.removeChild(link);
    }
  };

  const chartData = {
    labels: data ? data.map((row, index) => index) : [],
    datasets: [
      {
        label: 'Original Data',
        data: data ? data.map(row => parseFloat(row[0])) : [],
        borderColor: 'blue',
        fill: false,
      },
      {
        label: 'Predicted Data',
        data: predictions ? predictions : [],
        borderColor: 'green',
        fill: false,
      },
    ],
  };

  return (
    <div className="App">
      <h1>Upload CSV File</h1>
      <form onSubmit={handleUpload}>
        <input type="file" name="csvfile" accept=".csv" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
      <button onClick={handleTrain} disabled={!data}>Train Model</button>
      <button onClick={handlePredict} disabled={!data || countdown > 0}>
        {countdown > 0 ? `Run Regression Model (${countdown})` : 'Run Regression Model'}
      </button>
      <button onClick={handleDownload} disabled={!predictions}>Download Predictions</button>
      {data && predictions && (
        <div>
          <h2>Chart</h2>
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
}

export default App;