import React from "react";
import Svg, { Circle, Path, Line } from "react-native-svg";

export default function GlobeIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
