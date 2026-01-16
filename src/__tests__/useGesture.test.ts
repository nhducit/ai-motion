import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGesture } from '../hooks/useGesture';
import { LandmarkList } from '../types';

// Mock gestureClassifier
vi.mock('../utils/gestureClassifier', () => ({
  classifyGesture: vi.fn(() => ({ gesture: 'open_hand', confidence: 0.9 })),
  createGestureDebouncer: vi.fn(() => (gesture: string) => gesture),
}));

// Create mock landmarks
function createMockLandmarks(): LandmarkList {
  const landmarks: LandmarkList = [];
  for (let i = 0; i <= 20; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0 });
  }
  return landmarks;
}

describe('useGesture', () => {
  it('initializes with none gesture', () => {
    const { result } = renderHook(() => useGesture());

    expect(result.current.currentGesture).toBe('none');
    expect(result.current.confidence).toBe(0);
    expect(result.current.gestureState.hand).toBeNull();
  });

  it('updates gesture when landmarks are provided', () => {
    const { result } = renderHook(() => useGesture());
    const landmarks = createMockLandmarks();

    act(() => {
      result.current.updateGesture(landmarks, 'Right');
    });

    expect(result.current.gestureState.hand).not.toBeNull();
    expect(result.current.gestureState.hand?.handedness).toBe('Right');
  });

  it('resets to none when null landmarks are provided', () => {
    const { result } = renderHook(() => useGesture());
    const landmarks = createMockLandmarks();

    act(() => {
      result.current.updateGesture(landmarks, 'Right');
    });

    act(() => {
      result.current.updateGesture(null, 'Right');
    });

    expect(result.current.currentGesture).toBe('none');
    expect(result.current.confidence).toBe(0);
    expect(result.current.gestureState.hand).toBeNull();
  });

  it('resetGesture clears all state', () => {
    const { result } = renderHook(() => useGesture());
    const landmarks = createMockLandmarks();

    act(() => {
      result.current.updateGesture(landmarks, 'Left');
    });

    act(() => {
      result.current.resetGesture();
    });

    expect(result.current.currentGesture).toBe('none');
    expect(result.current.confidence).toBe(0);
    expect(result.current.gestureState.hand).toBeNull();
  });

  it('handles Left handedness correctly', () => {
    const { result } = renderHook(() => useGesture());
    const landmarks = createMockLandmarks();

    act(() => {
      result.current.updateGesture(landmarks, 'Left');
    });

    expect(result.current.gestureState.hand?.handedness).toBe('Left');
  });
});
