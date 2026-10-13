// Chart.js draws on canvas and can't read CSS variables, so the theme
// colors from index.css (:root) are mirrored here. Keep the two in sync.

export const CHART_COLORS = {
  income: '#2F6B3F',     // --success
  fixed: '#F4700B',      // --primary
  expense: '#B3261E',    // --danger
  savings: '#2D4E80',    // --secondary / --info
  net: '#1F1A17',        // --text-main
  empty: '#E9E3DC',      // --border-color
  surface: '#ffffff'     // --bg-card (slice borders)
};

// Categorical palette for charts with many slices (e.g. spending by category)
export const CHART_PALETTE = [
  '#F4700B', '#2D4E80', '#2F6B3F', '#B3261E', '#6B4FA0',
  '#B7791F', '#1F1A17', '#5B8DB8', '#8A8077', '#D98E5F'
];

// Hex (#RRGGBB) -> rgba() string, for translucent area fills
export const withAlpha = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};
