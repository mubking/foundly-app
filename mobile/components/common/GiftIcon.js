import React from "react";
import Svg, { Rect, Path } from "react-native-svg";

export default function GiftIcon({ size = 24, color = "#111827", strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="4" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 8v13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path
        d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
