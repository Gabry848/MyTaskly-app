import React from 'react';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const AIChatIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <Svg width="300" height="300" viewBox="0 0 300 300">
        {/* AI Chat Bubble (Black) - Left */}
        <G>
          <Rect
            x={20}
            y={80}
            width={180}
            height={80}
            rx={20}
            fill="#000000"
          />
          <Path
            d="M 40 160 L 30 175 L 55 160 Z"
            fill="#000000"
          />
          {/* White text lines */}
          <Rect x={40} y={100} width={140} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
          <Rect x={40} y={120} width={100} height={8} rx={4} fill="#FFFFFF" opacity={0.7} />
        </G>

        {/* User Chat Bubble (White with border) - Right */}
        <G>
          <Rect
            x={100}
            y={180}
            width={180}
            height={60}
            rx={20}
            fill="#FFFFFF"
            stroke="#E1E5E9"
            strokeWidth={2}
          />
          <Path
            d="M 260 240 L 270 255 L 245 240 Z"
            fill="#FFFFFF"
            stroke="#E1E5E9"
            strokeWidth={2}
          />
          {/* Black text lines */}
          <Rect x={120} y={200} width={120} height={6} rx={3} fill="#000000" opacity={0.8} />
          <Rect x={120} y={215} width={80} height={6} rx={3} fill="#000000" opacity={0.6} />
        </G>

        {/* AI Sparkle Icon */}
        <Circle cx={250} cy={60} r={30} fill="#007AFF" opacity={0.2} />
        <Path
          d="M 250 35 L 253 48 L 265 50 L 253 52 L 250 65 L 247 52 L 235 50 L 247 48 Z"
          fill="#007AFF"
        />

        {/* Microphone Icon (bottom right hint) */}
        <Circle cx={270} cy={270} r={15} fill="#F8F9FA" />
        <Rect x={265} y={260} width={10} height={15} rx={5} fill="#666666" />
        <Rect x={263} y={275} width={14} height={3} rx={1.5} fill="#666666" />
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
