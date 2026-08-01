import React from "react";
import Svg, { Circle, Line } from "react-native-svg";

export default function SunIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="2" y1="12" x2="4" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="20" y1="12" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="6.34" y1="17.66" x2="4.93" y2="19.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="19.07" y1="4.93" x2="17.66" y2="6.34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
