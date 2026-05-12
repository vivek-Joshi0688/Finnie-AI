import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";


// ✅ REGISTER ALL REQUIRED COMPONENTS
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);


export default function StockChart({ symbol  }) {
  const [chartData, setChartData] = useState(null);

 useEffect(() => {
  if (!symbol) return;

  const fetchData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/stock/${symbol}`);
      const data = await res.json();

      if (data.error) return;

      setChartData({
        labels: data.labels,
        datasets: [
          {
            label: symbol,
            data: data.prices,
            borderColor: "green"
          }
        ]
      });
    } catch (err) {
      console.error(err);
    }
  };

  fetchData();
}, [symbol]); // ✅ correct

  if (!symbol) return <p>Enter stock symbol</p>;
  if (!chartData) return <p>Loading chart...</p>;

  return <Line data={chartData} />;
}