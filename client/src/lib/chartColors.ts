// Define vibrant color palettes for charts
export const chartColors = {
  // Primary color scheme - vibrant and modern
  primary: {
    blue: '#3b82f6',      // Bright blue
    green: '#10b981',     // Emerald green
    purple: '#8b5cf6',    // Violet
    orange: '#f97316',    // Orange
    pink: '#ec4899',      // Pink
    cyan: '#06b6d4',      // Cyan
    amber: '#f59e0b',     // Amber
    red: '#ef4444',       // Red
    indigo: '#6366f1',    // Indigo
    teal: '#14b8a6',      // Teal
  },
  
  // Gradient colors for area charts
  gradients: {
    blueGradient: 'rgba(59, 130, 246, 0.1)',
    greenGradient: 'rgba(16, 185, 129, 0.1)',
    purpleGradient: 'rgba(139, 92, 246, 0.1)',
    orangeGradient: 'rgba(249, 115, 22, 0.1)',
    pinkGradient: 'rgba(236, 72, 153, 0.1)',
    cyanGradient: 'rgba(6, 182, 212, 0.1)',
    amberGradient: 'rgba(245, 158, 11, 0.1)',
    redGradient: 'rgba(239, 68, 68, 0.1)',
  },
  
  // Chart-specific color sets
  finance: {
    income: '#10b981',     // Green for income
    expense: '#ef4444',    // Red for expenses
    profit: '#3b82f6',     // Blue for profit
  },
  
  market: {
    primary: '#3b82f6',    // Blue
    secondary: '#10b981',  // Green
    tertiary: '#f59e0b',   // Amber
    quaternary: '#8b5cf6', // Purple
  },
  
  // Get a color palette for pie/doughnut charts
  getPieColors: (count: number = 4) => {
    const colors = [
      '#3b82f6',  // Blue
      '#10b981',  // Green
      '#f59e0b',  // Amber
      '#8b5cf6',  // Purple
      '#ec4899',  // Pink
      '#06b6d4',  // Cyan
      '#ef4444',  // Red
      '#14b8a6',  // Teal
    ];
    return colors.slice(0, count);
  },
  
  // Get gradient colors for line/area charts
  getGradientPair: (color: string) => {
    return {
      borderColor: color,
      backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
    };
  },
};

// Helper function to create Chart.js gradient
export const createLinearGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  opacity: number = 0.1
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
  return gradient;
};