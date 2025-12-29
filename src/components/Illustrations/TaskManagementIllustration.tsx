import React from 'react';
import Svg, { Rect, Circle, Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const TaskManagementIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <Svg width="300" height="300" viewBox="0 0 300 300">
        {/* Category Card 1 - Purple (Top Left) */}
        <G>
          <Rect
            x={30}
            y={50}
            width={120}
            height={100}
            rx={16}
            fill="#8B5CF6"
            opacity={0.9}
          />
          <Rect x={45} y={65} width={60} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={52} cy={90} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={65} y={86} width={50} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
          <Circle cx={52} cy={105} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={65} y={101} width={40} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* Category Card 2 - Orange (Top Right) */}
        <G>
          <Rect
            x={165}
            y={50}
            width={120}
            height={100}
            rx={16}
            fill="#FB923C"
            opacity={0.9}
          />
          <Rect x={180} y={65} width={70} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={187} cy={90} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={200} y={86} width={60} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* Category Card 3 - Green (Bottom Left) */}
        <G>
          <Rect
            x={30}
            y={165}
            width={120}
            height={100}
            rx={16}
            fill="#10B981"
            opacity={0.9}
          />
          <Rect x={45} y={180} width={50} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={52} cy={205} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={65} y={201} width={55} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
          <Circle cx={52} cy={220} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={65} y={216} width={45} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* Category Card 4 - Blue (Bottom Right) */}
        <G>
          <Rect
            x={165}
            y={165}
            width={120}
            height={100}
            rx={16}
            fill="#007AFF"
            opacity={0.9}
          />
          <Rect x={180} y={180} width={65} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
          <Circle cx={187} cy={205} r={6} fill="#FFFFFF" opacity={0.7} />
          <Rect x={200} y={201} width={50} height={4} rx={2} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* Floating Checkmarks */}
        <Circle cx={150} cy={35} r={18} fill="#4CAF50" opacity={0.3} />
        <Path
          d="M 142 35 L 148 41 L 158 31"
          stroke="#4CAF50"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Sync Icon (top right) */}
        <Circle cx={280} cy={30} r={15} fill="#F8F9FA" />
        <Path
          d="M 275 25 Q 280 20 285 25 L 285 30 M 285 35 Q 280 40 275 35 L 275 30"
          stroke="#666666"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
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
