export type GestureType =
  | 'none'
  | 'open_hand'
  | 'fist'
  | 'point'
  | 'peace'
  | 'thumbs_up';

// Landmark type compatible with MediaPipe Tasks Vision
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type LandmarkList = Landmark[];

export interface HandLandmarks {
  landmarks: LandmarkList;
  handedness: 'Left' | 'Right';
}

export interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface GestureState {
  gesture: GestureType;
  confidence: number;
  hand: HandLandmarks | null;
}

export interface WebcamState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
}

export interface AnimationProps {
  intensity?: number;
  color?: string;
}

// MediaPipe landmark indices
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;
