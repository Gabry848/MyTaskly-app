import { Dimensions } from 'react-native';

// Canvas constants - must match NotesCanvas (GRID_POINTS=50, GRID_SIZE=60)
export const CANVAS_SIZE = 50 * 60; // 3000px

const { width, height } = Dimensions.get('window');
const initCenterOffset = (CANVAS_SIZE - width) / 2;

/**
 * Mutable object tracking the current canvas viewport state.
 * Updated by NotesCanvas on pan/zoom release.
 * Read by useNotes to position new notes at the viewport center.
 */
export const canvasViewport = {
  translateX: -initCenterOffset,
  translateY: -initCenterOffset,
  scale: 1,
  screenWidth: width,
  screenHeight: height,
};
