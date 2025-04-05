import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Predefined color pairs for light and dark mode (bg and text colors)
const colorPairs = [
  { light: { bg: "bg-blue-100", text: "text-blue-800" }, dark: { bg: "dark:bg-blue-900", text: "dark:text-blue-300" } },
  { light: { bg: "bg-purple-100", text: "text-purple-800" }, dark: { bg: "dark:bg-purple-900", text: "dark:text-purple-300" } },
  { light: { bg: "bg-green-100", text: "text-green-800" }, dark: { bg: "dark:bg-green-900", text: "dark:text-green-300" } },
  { light: { bg: "bg-red-100", text: "text-red-800" }, dark: { bg: "dark:bg-red-900", text: "dark:text-red-300" } },
  { light: { bg: "bg-pink-100", text: "text-pink-800" }, dark: { bg: "dark:bg-pink-900", text: "dark:text-pink-300" } },
  { light: { bg: "bg-indigo-100", text: "text-indigo-800" }, dark: { bg: "dark:bg-indigo-900", text: "dark:text-indigo-300" } },
  { light: { bg: "bg-cyan-100", text: "text-cyan-800" }, dark: { bg: "dark:bg-cyan-900", text: "dark:text-cyan-300" } },
  { light: { bg: "bg-teal-100", text: "text-teal-800" }, dark: { bg: "dark:bg-teal-900", text: "dark:text-teal-300" } },
  { light: { bg: "bg-orange-100", text: "text-orange-800" }, dark: { bg: "dark:bg-orange-900", text: "dark:text-orange-300" } },
  { light: { bg: "bg-amber-100", text: "text-amber-800" }, dark: { bg: "dark:bg-amber-900", text: "dark:text-amber-300" } },
];

// Get a consistent color for a string by hashing it
export function getColorForString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPairs.length;
  const colors = colorPairs[index];
  return `${colors.light.bg} ${colors.light.text} ${colors.dark.bg} ${colors.dark.text}`;
}
