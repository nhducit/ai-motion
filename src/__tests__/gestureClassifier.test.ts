import { describe, it, expect } from 'vitest';
import {
  isFingerExtended,
  isThumbExtended,
  getFingerStates,
  countExtendedFingers,
  classifyGesture,
  createGestureDebouncer,
} from '../utils/gestureClassifier';
import { LANDMARK, LandmarkList } from '../types';

// Helper to create mock landmarks
function createMockLandmarks(overrides: Partial<Record<number, { x: number; y: number; z: number }>> = {}): LandmarkList {
  const defaultLandmark = { x: 0.5, y: 0.5, z: 0 };
  const landmarks: LandmarkList = [];

  for (let i = 0; i <= 20; i++) {
    landmarks.push(overrides[i] || { ...defaultLandmark });
  }

  return landmarks;
}

// Create landmarks for open hand (all fingers extended - tips above PIPs above MCPs)
function createOpenHandLandmarks(): LandmarkList {
  return createMockLandmarks({
    // Wrist at bottom
    [LANDMARK.WRIST]: { x: 0.5, y: 0.9, z: 0 },

    // Thumb extended to the side
    [LANDMARK.THUMB_CMC]: { x: 0.45, y: 0.8, z: 0 },
    [LANDMARK.THUMB_MCP]: { x: 0.35, y: 0.7, z: 0 },
    [LANDMARK.THUMB_IP]: { x: 0.25, y: 0.6, z: 0 },
    [LANDMARK.THUMB_TIP]: { x: 0.15, y: 0.5, z: 0 },

    // Index finger extended (tip above pip above mcp)
    [LANDMARK.INDEX_MCP]: { x: 0.4, y: 0.6, z: 0 },
    [LANDMARK.INDEX_PIP]: { x: 0.4, y: 0.4, z: 0 },
    [LANDMARK.INDEX_DIP]: { x: 0.4, y: 0.3, z: 0 },
    [LANDMARK.INDEX_TIP]: { x: 0.4, y: 0.2, z: 0 },

    // Middle finger extended
    [LANDMARK.MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
    [LANDMARK.MIDDLE_PIP]: { x: 0.5, y: 0.4, z: 0 },
    [LANDMARK.MIDDLE_DIP]: { x: 0.5, y: 0.3, z: 0 },
    [LANDMARK.MIDDLE_TIP]: { x: 0.5, y: 0.2, z: 0 },

    // Ring finger extended
    [LANDMARK.RING_MCP]: { x: 0.6, y: 0.6, z: 0 },
    [LANDMARK.RING_PIP]: { x: 0.6, y: 0.4, z: 0 },
    [LANDMARK.RING_DIP]: { x: 0.6, y: 0.3, z: 0 },
    [LANDMARK.RING_TIP]: { x: 0.6, y: 0.2, z: 0 },

    // Pinky extended
    [LANDMARK.PINKY_MCP]: { x: 0.7, y: 0.65, z: 0 },
    [LANDMARK.PINKY_PIP]: { x: 0.7, y: 0.45, z: 0 },
    [LANDMARK.PINKY_DIP]: { x: 0.7, y: 0.35, z: 0 },
    [LANDMARK.PINKY_TIP]: { x: 0.7, y: 0.25, z: 0 },
  });
}

// Create landmarks for fist (all fingers closed - tips below PIPs)
function createFistLandmarks(): LandmarkList {
  return createMockLandmarks({
    [LANDMARK.WRIST]: { x: 0.5, y: 0.9, z: 0 },

    // Thumb closed (close to index MCP)
    [LANDMARK.THUMB_CMC]: { x: 0.45, y: 0.8, z: 0 },
    [LANDMARK.THUMB_MCP]: { x: 0.42, y: 0.75, z: 0 },
    [LANDMARK.THUMB_IP]: { x: 0.40, y: 0.72, z: 0 },
    [LANDMARK.THUMB_TIP]: { x: 0.38, y: 0.7, z: 0 },

    // Index finger curled (tip below pip)
    [LANDMARK.INDEX_MCP]: { x: 0.4, y: 0.6, z: 0 },
    [LANDMARK.INDEX_PIP]: { x: 0.4, y: 0.55, z: 0 },
    [LANDMARK.INDEX_DIP]: { x: 0.4, y: 0.6, z: 0 },
    [LANDMARK.INDEX_TIP]: { x: 0.4, y: 0.65, z: 0 },

    // Middle finger curled
    [LANDMARK.MIDDLE_MCP]: { x: 0.5, y: 0.6, z: 0 },
    [LANDMARK.MIDDLE_PIP]: { x: 0.5, y: 0.55, z: 0 },
    [LANDMARK.MIDDLE_DIP]: { x: 0.5, y: 0.6, z: 0 },
    [LANDMARK.MIDDLE_TIP]: { x: 0.5, y: 0.65, z: 0 },

    // Ring finger curled
    [LANDMARK.RING_MCP]: { x: 0.6, y: 0.6, z: 0 },
    [LANDMARK.RING_PIP]: { x: 0.6, y: 0.55, z: 0 },
    [LANDMARK.RING_DIP]: { x: 0.6, y: 0.6, z: 0 },
    [LANDMARK.RING_TIP]: { x: 0.6, y: 0.65, z: 0 },

    // Pinky curled
    [LANDMARK.PINKY_MCP]: { x: 0.7, y: 0.65, z: 0 },
    [LANDMARK.PINKY_PIP]: { x: 0.7, y: 0.6, z: 0 },
    [LANDMARK.PINKY_DIP]: { x: 0.7, y: 0.65, z: 0 },
    [LANDMARK.PINKY_TIP]: { x: 0.7, y: 0.7, z: 0 },
  });
}

// Create landmarks for pointing (only index extended)
function createPointLandmarks(): LandmarkList {
  const fist = createFistLandmarks();
  // Extend only the index finger
  fist[LANDMARK.INDEX_PIP] = { x: 0.4, y: 0.4, z: 0 };
  fist[LANDMARK.INDEX_DIP] = { x: 0.4, y: 0.3, z: 0 };
  fist[LANDMARK.INDEX_TIP] = { x: 0.4, y: 0.2, z: 0 };
  return fist;
}

// Create landmarks for peace sign (index and middle extended)
function createPeaceLandmarks(): LandmarkList {
  const point = createPointLandmarks();
  // Also extend middle finger
  point[LANDMARK.MIDDLE_MCP] = { x: 0.5, y: 0.6, z: 0 };
  point[LANDMARK.MIDDLE_PIP] = { x: 0.5, y: 0.4, z: 0 };
  point[LANDMARK.MIDDLE_DIP] = { x: 0.5, y: 0.3, z: 0 };
  point[LANDMARK.MIDDLE_TIP] = { x: 0.5, y: 0.2, z: 0 };
  return point;
}

// Create landmarks for thumbs up (only thumb extended)
function createThumbsUpLandmarks(): LandmarkList {
  const fist = createFistLandmarks();
  // Extend thumb far from index MCP
  fist[LANDMARK.THUMB_TIP] = { x: 0.1, y: 0.4, z: 0 };
  fist[LANDMARK.THUMB_IP] = { x: 0.2, y: 0.5, z: 0 };
  return fist;
}

describe('gestureClassifier', () => {
  describe('isFingerExtended', () => {
    it('returns true when finger tip is above PIP and MCP', () => {
      const landmarks = createOpenHandLandmarks();
      expect(isFingerExtended(
        landmarks,
        LANDMARK.INDEX_TIP,
        LANDMARK.INDEX_PIP,
        LANDMARK.INDEX_MCP
      )).toBe(true);
    });

    it('returns false when finger is curled', () => {
      const landmarks = createFistLandmarks();
      expect(isFingerExtended(
        landmarks,
        LANDMARK.INDEX_TIP,
        LANDMARK.INDEX_PIP,
        LANDMARK.INDEX_MCP
      )).toBe(false);
    });
  });

  describe('isThumbExtended', () => {
    it('returns true when thumb is extended far from index MCP', () => {
      const landmarks = createThumbsUpLandmarks();
      expect(isThumbExtended(landmarks)).toBe(true);
    });

    it('returns false when thumb is closed', () => {
      const landmarks = createFistLandmarks();
      expect(isThumbExtended(landmarks)).toBe(false);
    });
  });

  describe('getFingerStates', () => {
    it('returns all fingers extended for open hand', () => {
      const landmarks = createOpenHandLandmarks();
      const states = getFingerStates(landmarks);

      expect(states.thumb).toBe(true);
      expect(states.index).toBe(true);
      expect(states.middle).toBe(true);
      expect(states.ring).toBe(true);
      expect(states.pinky).toBe(true);
    });

    it('returns all fingers closed for fist', () => {
      const landmarks = createFistLandmarks();
      const states = getFingerStates(landmarks);

      expect(states.thumb).toBe(false);
      expect(states.index).toBe(false);
      expect(states.middle).toBe(false);
      expect(states.ring).toBe(false);
      expect(states.pinky).toBe(false);
    });
  });

  describe('countExtendedFingers', () => {
    it('returns 5 for open hand', () => {
      expect(countExtendedFingers({
        thumb: true,
        index: true,
        middle: true,
        ring: true,
        pinky: true,
      })).toBe(5);
    });

    it('returns 0 for fist', () => {
      expect(countExtendedFingers({
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      })).toBe(0);
    });

    it('returns 2 for peace sign', () => {
      expect(countExtendedFingers({
        thumb: false,
        index: true,
        middle: true,
        ring: false,
        pinky: false,
      })).toBe(2);
    });
  });

  describe('classifyGesture', () => {
    it('classifies open hand correctly', () => {
      const landmarks = createOpenHandLandmarks();
      const result = classifyGesture(landmarks);

      expect(result.gesture).toBe('open_hand');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies fist correctly', () => {
      const landmarks = createFistLandmarks();
      const result = classifyGesture(landmarks);

      expect(result.gesture).toBe('fist');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('classifies point correctly', () => {
      const landmarks = createPointLandmarks();
      const result = classifyGesture(landmarks);

      expect(result.gesture).toBe('point');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('classifies peace correctly', () => {
      const landmarks = createPeaceLandmarks();
      const result = classifyGesture(landmarks);

      expect(result.gesture).toBe('peace');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('classifies thumbs up correctly', () => {
      const landmarks = createThumbsUpLandmarks();
      const result = classifyGesture(landmarks);

      expect(result.gesture).toBe('thumbs_up');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('createGestureDebouncer', () => {
    it('returns none until threshold is met', () => {
      const debouncer = createGestureDebouncer(3);

      expect(debouncer('open_hand')).toBe('none');
      expect(debouncer('open_hand')).toBe('none');
      expect(debouncer('open_hand')).toBe('open_hand');
    });

    it('resets count when gesture changes', () => {
      const debouncer = createGestureDebouncer(3);

      debouncer('open_hand');
      debouncer('open_hand');
      expect(debouncer('fist')).toBe('none'); // Reset on change
      debouncer('fist');
      expect(debouncer('fist')).toBe('fist');
    });

    it('uses custom threshold', () => {
      const debouncer = createGestureDebouncer(2);

      expect(debouncer('point')).toBe('none');
      expect(debouncer('point')).toBe('point');
    });
  });
});
