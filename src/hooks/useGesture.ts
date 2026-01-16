import { useState, useCallback, useRef } from 'react';
import { GestureState, LandmarkList } from '../types';
import { classifyGesture, createGestureDebouncer } from '../utils/gestureClassifier';

export function useGesture() {
  const [gestureState, setGestureState] = useState<GestureState>({
    gesture: 'none',
    confidence: 0,
    hand: null,
  });

  const debouncerRef = useRef(createGestureDebouncer(3));

  const updateGesture = useCallback(
    (landmarks: LandmarkList | null, handedness: 'Left' | 'Right' = 'Right') => {
      if (!landmarks || landmarks.length === 0) {
        setGestureState({
          gesture: 'none',
          confidence: 0,
          hand: null,
        });
        return;
      }

      const { gesture, confidence } = classifyGesture(landmarks);
      const stableGesture = debouncerRef.current(gesture);

      setGestureState({
        gesture: stableGesture,
        confidence: stableGesture === 'none' ? 0 : confidence,
        hand: {
          landmarks,
          handedness,
        },
      });
    },
    []
  );

  const resetGesture = useCallback(() => {
    debouncerRef.current = createGestureDebouncer(3);
    setGestureState({
      gesture: 'none',
      confidence: 0,
      hand: null,
    });
  }, []);

  return {
    gestureState,
    updateGesture,
    resetGesture,
    currentGesture: gestureState.gesture,
    confidence: gestureState.confidence,
  };
}
