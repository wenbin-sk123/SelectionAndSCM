import { useEffect, useRef } from "react";

interface Dataset {
  data: number[];
  backgroundColor: string[];
}

interface PieChartProps {
  data: {
    labels: string[];
    datasets: Dataset[];
  };
}

export default function PieChart({ data }: PieChartProps) {
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
        type: "pie",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((dataset) => ({
            data: dataset.data,
            backgroundColor: dataset.backgroundColor,
            borderWidth: 2,
            borderColor: "#ffffff",
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                usePointStyle: true,
                padding: 20,
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || "";
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${percentage}%`;
                },
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
      <canvas ref={chartRef} data-testid="pie-chart" />
    </div>
  );
}
