import React, { useState, useEffect, useRef } from "react";
import Chart from 'chart.js/auto';
import './App.css';

function App() {
  const [stocks, setStocks] = useState([]);
  const [overview_data, setOverview] = useState(null);
  const [daily_data, setDaily] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const [useDemo, setUseDemo] = useState(true);
  const [apiKey, setApiKey] = useState('demo');
  


  const real_apiKey = '0ZLM8VU33M5P6J7E';
  
  async function fetchStock(symbol) {
    try {
      const overview_url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
      const daily_url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
    
        console.log(overview_url);
        const overview_response = await fetch(overview_url);
        if (overview_response.Information) {
          console.log("sad")
          alert("Sorry API limit has been reached. Please try again tomorrow :(");
          return;
        }
        console.log(daily_url);
        const daily_response = await fetch(daily_url);

        if (!overview_response.ok || !daily_response.ok) {
            throw new Error(`HTTP error!`);
        }

        const overview_data = await overview_response.json();
        setOverview(overview_data);
        const daily_data = await daily_response.json();
        setDaily(daily_data);
        setError(null);
    } catch (error) {
        setError(`Error fetching Stock`);

    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock('IBM');
  }, []);

  function getStats(data){
    const series = data["Time Series (Daily)"];
    if (!series) {
      console.error("Daily time series data is missing.");
      return;
    }
    const dates = Object.keys(series).sort().reverse();
    const latestClose = parseFloat(series[dates[0]]["4. close"]);
    const previousClose = parseFloat(series[dates[1]]["4. close"]);

    const percentChange = ((latestClose - previousClose) / previousClose) * 100;

    const stats = {"price": latestClose,
      "change": percentChange
    }
    setStats(stats)

    setStocks(prev => [
      ...prev.filter(stock => stock.symbol !== overview_data.Symbol),
      {
        symbol: overview_data.Symbol,
        name: overview_data.Name,
        price: latestClose,
        change: percentChange
      }
    ])
  }

  useEffect(() => {
    if (daily_data) {
      getStats(daily_data);
    }
  }, [daily_data]);

  async function handleSearch() {
    try {
      const search_url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`;
      console.log(search_url)
      const response = await fetch(search_url);
      const data = await response.json();
      
      if (data.bestMatches && data.bestMatches.length > 0) {
        const matchedSymbol = data.bestMatches[0]["1. symbol"];
        console.log(matchedSymbol)
        await fetchStock(matchedSymbol);
      } else {
        alert("No matching stock found!");
      }
    } catch (err) {
      setError("Error during search");
    }
  }


  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!stocks.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy(); 
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: stocks.map(s => s.symbol),
        datasets: [{
          label: `Stock Price (${overview_data.Currency})`,
          data: stocks.map(stock => stock.price),
          backgroundColor: stocks.map(stock => stock.change > 0 ? "green" : "red")
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }, [stocks]);



  if (loading) return <p>Loading stock data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="App">
      <h1 className="text-3xl font-bold">
        Stock Data
      </h1>
      <p>Disclaimer: Limited API calls, so use demo for brief sample</p>
      <div>

      <div className="mb-4 flex items-center gap-4">
        <div className="search-bar mt-2 text-left">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name..."
            className="border p-2"
          />
          <button onClick={handleSearch} className="ml-2 p-2 rounded">
            Search
          </button>
        </div>

        <button
          onClick={() => {
            const newUseDemo = !useDemo;
            setUseDemo(newUseDemo);
            setApiKey(newUseDemo ? 'demo' : real_apiKey);
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded text-right"
        >
          Switch API Key
        </button>

        <span className="text-sm text-gray-600">
          Currently using: <strong>{useDemo ? 'demo' : 'my API key'}</strong>
        </span>
      </div>


      <div className="table relative overflow-x-auto w-full mt-2">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                      <th scope="col" className="px-6 py-3">
                          Symbol - Company
                      </th>
                      <th scope="col" className="px-6 py-3">
                          Price ({overview_data.Currency})
                      </th>
                      <th scope="col" className="px-6 py-3">
                          % Change
                      </th>
                  </tr>
              </thead>
              <tbody>
                  <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                          {overview_data.Symbol} - {overview_data.Name}
                      </th>
                      <td className="px-6 py-4">
                          {stats && stats.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                          {stats && stats.change.toFixed(2)}
                      </td>
                  </tr>
              </tbody>
          </table>
        </div>
        <div className="chart mt-2">
          <canvas ref={chartRef}></canvas>
        </div>

      </div>
    </div>
  );
}

export default App;
