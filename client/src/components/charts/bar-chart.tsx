import { useEffect, useRef } from "react";

interface Dataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
}

interface BarChartProps {
  data: {
    labels: string[];
    datasets: Dataset[];
  };
}

export default function BarChart({ data }: BarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    const loadChart = async () => {
      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);

      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current!.getContext("2d");
      if (!ctx) return;

      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((dataset) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor,
            borderColor: Array.isArray(dataset.backgroundColor) 
              ? dataset.backgroundColor.map(color => color.replace('/0.1)', ')'))
              : dataset.backgroundColor,
            borderWidth: 2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
            x: {
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
            },
          },
        },
      });
    };

    loadChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={chartRef} data-testid="bar-chart" />
    </div>
  );
}
