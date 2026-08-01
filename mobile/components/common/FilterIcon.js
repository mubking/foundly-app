import React from "react";
import Svg, { Polygon } from "react-native-svg";

export default function FilterIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
