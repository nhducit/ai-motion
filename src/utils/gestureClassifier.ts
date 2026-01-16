import { GestureType, FingerState, LANDMARK, LandmarkList } from '../types';

/**
 * Calculate if a finger is extended based on landmark positions
 * A finger is extended if the tip is further from the palm than the PIP joint
 */
export function isFingerExtended(
  landmarks: LandmarkList,
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number
): boolean {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];

  // For fingers, check if tip is above (lower y) than PIP joint
  // In screen coordinates, lower y means higher position
  return tip.y < pip.y && pip.y < mcp.y;
}

/**
 * Check if thumb is extended
 * Thumb has different geometry, so we check horizontal distance
 */
export function isThumbExtended(landmarks: LandmarkList): boolean {
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const thumbMcp = landmarks[LANDMARK.THUMB_MCP];
  const indexMcp = landmarks[LANDMARK.INDEX_MCP];

  // Thumb is extended if tip is far from index finger MCP
  const thumbDistance = Math.abs(thumbTip.x - indexMcp.x);
  const closedDistance = Math.abs(thumbMcp.x - indexMcp.x);

  return thumbDistance > closedDistance * 1.2;
}

/**
 * Get the extension state of all fingers
 */
export function getFingerStates(landmarks: LandmarkList): FingerState {
  return {
    thumb: isThumbExtended(landmarks),
    index: isFingerExtended(
      landmarks,
      LANDMARK.INDEX_TIP,
      LANDMARK.INDEX_PIP,
      LANDMARK.INDEX_MCP
    ),
    middle: isFingerExtended(
      landmarks,
      LANDMARK.MIDDLE_TIP,
      LANDMARK.MIDDLE_PIP,
      LANDMARK.MIDDLE_MCP
    ),
    ring: isFingerExtended(
      landmarks,
      LANDMARK.RING_TIP,
      LANDMARK.RING_PIP,
      LANDMARK.RING_MCP
    ),
    pinky: isFingerExtended(
      landmarks,
      LANDMARK.PINKY_TIP,
      LANDMARK.PINKY_PIP,
      LANDMARK.PINKY_MCP
    ),
  };
}

/**
 * Count extended fingers
 */
export function countExtendedFingers(fingerState: FingerState): number {
  return Object.values(fingerState).filter(Boolean).length;
}

/**
 * Classify gesture based on finger states
 */
export function classifyGesture(landmarks: LandmarkList): { gesture: GestureType; confidence: number } {
  const fingers = getFingerStates(landmarks);
  const extendedCount = countExtendedFingers(fingers);

  // Open hand: all fingers extended
  if (fingers.thumb && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    return { gesture: 'open_hand', confidence: 0.9 };
  }

  // Fist: no fingers extended
  if (extendedCount === 0) {
    return { gesture: 'fist', confidence: 0.9 };
  }

  // Thumbs up: only thumb extended
  if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'thumbs_up', confidence: 0.85 };
  }

  // Point: only index extended
  if (!fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'point', confidence: 0.85 };
  }

  // Peace: index and middle extended
  if (!fingers.thumb && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'peace', confidence: 0.85 };
  }

  // With thumb
  if (fingers.thumb && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'peace', confidence: 0.7 };
  }

  return { gesture: 'none', confidence: 0.5 };
}

/**
 * Debounce gesture changes to prevent flickering
 */
export function createGestureDebouncer(stabilityThreshold: number = 3) {
  let lastGesture: GestureType = 'none';
  let gestureCount = 0;

  return (newGesture: GestureType): GestureType => {
    if (newGesture === lastGesture) {
      gestureCount++;
    } else {
      lastGesture = newGesture;
      gestureCount = 1;
    }

    return gestureCount >= stabilityThreshold ? lastGesture : 'none';
  };
}
