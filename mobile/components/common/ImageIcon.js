import React from "react";
import Svg, { Rect, Circle, Path } from "react-native-svg";

export default function ImageIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="9" cy="9" r="2" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
