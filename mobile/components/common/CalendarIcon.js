import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export default function CalendarIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16 2v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
