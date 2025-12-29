import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface MyTasklyLogoProps {
  width?: number;
  height?: number;
  darkMode?: boolean;
}

export const MyTasklyLogo: React.FC<MyTasklyLogoProps> = ({
  width = 120,
  height = 120,
  darkMode = false
}) => {
  const fillColor = darkMode ? '#FFFFFF' : '#000000';
  const strokeColor = darkMode ? '#000000' : '#FFFFFF';

  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <Rect x={10} y={10} width={100} height={100} rx={24} fill={fillColor} />
      <Path
        d="M35,60 L50,75 L85,40"
        stroke={strokeColor}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
