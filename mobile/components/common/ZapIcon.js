import React from "react";
import Svg, { Polygon } from "react-native-svg";

export default function ZapIcon({ size = 24, color = "#111827", strokeWidth = 2, fill = "none" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Polygon
        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
