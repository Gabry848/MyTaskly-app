import React from 'react';
import Svg, { Rect, Circle, Text as SvgText, G, Path } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const CalendarIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <Svg width="300" height="300" viewBox="0 0 300 300">
        {/* Calendar Container */}
        <Rect
          x={40}
          y={60}
          width={220}
          height={200}
          rx={16}
          fill="#FFFFFF"
          stroke="#E1E5E9"
          strokeWidth={2}
        />

        {/* Calendar Header */}
        <Rect
          x={40}
          y={60}
          width={220}
          height={45}
          rx={16}
          fill="#F8F9FA"
        />
        <Rect
          x={40}
          y={85}
          width={220}
          height={20}
          fill="#F8F9FA"
        />

        {/* Month Title */}
        <Rect x={60} y={73} width={80} height={12} rx={6} fill="#000000" opacity={0.8} />

        {/* Day Labels (Mon-Sun) */}
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <Rect
            key={`day-${day}`}
            x={52 + day * 30}
            y={115}
            width={18}
            height={6}
            rx={3}
            fill="#666666"
            opacity={0.5}
          />
        ))}

        {/* Calendar Grid - Days */}
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) => {
            const hasEvent = (row === 1 && col === 2) || (row === 2 && col === 4) || (row === 3 && col === 1);
            const isToday = row === 2 && col === 2;

            return (
              <G key={`day-${row}-${col}`}>
                {isToday && (
                  <Circle
                    cx={60 + col * 30}
                    cy={143 + row * 28}
                    r={12}
                    stroke="#007AFF"
                    strokeWidth={2}
                    fill="none"
                  />
                )}
                <Rect
                  x={54 + col * 30}
                  y={137 + row * 28}
                  width={12}
                  height={12}
                  rx={2}
                  fill={isToday ? "#007AFF" : "#000000"}
                  opacity={isToday ? 0.9 : 0.3}
                />
                {hasEvent && (
                  <Circle
                    cx={60 + col * 30}
                    cy={155 + row * 28}
                    r={3}
                    fill="#4CAF50"
                  />
                )}
              </G>
            );
          })
        )}

        {/* Google Calendar Badge */}
        <G>
          <Circle cx={240} cy={45} r={20} fill="#FFFFFF" stroke="#E1E5E9" strokeWidth={2} />
          <Rect x={232} y={37} width={16} height={16} rx={3} fill="#4285F4" />
          <Rect x={234} y={39} width={12} height={4} rx={1} fill="#FFFFFF" />
          <Rect x={234} y={45} width={7} height={2} rx={1} fill="#FFFFFF" opacity={0.7} />
          <Rect x={234} y={49} width={9} height={2} rx={1} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* "Coming Soon" badges */}
        <G opacity={0.5}>
          {/* Outlook badge */}
          <Rect x={185} y={270} width={50} height={20} rx={10} fill="#F8F9FA" stroke="#E1E5E9" strokeWidth={1} />
          <Rect x={192} y={276} width={36} height={4} rx={2} fill="#666666" opacity={0.5} />
          <Rect x={192} y={282} width={20} height={3} rx={1.5} fill="#666666" opacity={0.3} />

          {/* Apple Calendar badge */}
          <Rect x={120} y={270} width={55} height={20} rx={10} fill="#F8F9FA" stroke="#E1E5E9" strokeWidth={1} />
          <Rect x={127} y={276} width={41} height={4} rx={2} fill="#666666" opacity={0.5} />
          <Rect x={127} y={282} width={25} height={3} rx={1.5} fill="#666666" opacity={0.3} />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
