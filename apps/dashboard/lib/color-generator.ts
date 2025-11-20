/**
 * Color Generator for Territory Visualization
 *
 * Generates unique colors for each agent's territories on the map
 */

// Predefined color palette (20 distinct colors optimized for map visibility)
const COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Light Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
  '#E76F51', // Burnt Orange
  '#2A9D8F', // Dark Teal
  '#E9C46A', // Gold
  '#F4A261', // Sandy Brown
  '#8338EC', // Violet
  '#06FFA5', // Bright Mint
  '#FB5607', // Bright Orange
  '#3A86FF', // Bright Blue
  '#FF006E', // Hot Pink
  '#8AC926', // Lime Green
];

/**
 * Get a unique color for an agent based on their index or ID
 * Uses consistent hashing to always return the same color for the same agent
 */
export function getAgentColor(agentId: string, index?: number): string {
  // If index provided, use it directly
  if (index !== undefined) {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  }

  // Hash the agent ID to get a consistent color
  const hash = hashString(agentId);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

/**
 * Simple string hash function
 * Returns a number that's consistent for the same string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get all colors for a list of agents
 * Ensures each agent gets a unique color
 */
export function assignAgentColors(agents: Array<{ id: string }>): Map<string, string> {
  const colorMap = new Map<string, string>();

  agents.forEach((agent, index) => {
    colorMap.set(agent.id, getAgentColor(agent.id, index));
  });

  return colorMap;
}

/**
 * Generate random color (fallback for when palette is exhausted)
 * Only used if you have more than 20 agents with territories
 */
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20); // 65-85%
  const lightness = 50 + Math.floor(Math.random() * 15); // 50-65%

  return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to Hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Adjust color brightness
 * Useful for hover states or overlapping territories
 */
export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Get contrasting text color (black or white) for a background color
 * Ensures text is readable on colored backgrounds
 */
export function getContrastColor(hexColor: string): '#000000' | '#FFFFFF' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Color palette for territory legend
 */
export function getColorPalette(): string[] {
  return [...COLOR_PALETTE];
}
