import { useState, useCallback, useRef, useEffect } from 'react';
import { WebcamState } from '../types';

export function useWebcam() {
  const [state, setState] = useState<WebcamState>({
    stream: null,
    isActive: false,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      setState({
        stream,
        isActive: true,
        error: null,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access webcam';
      setState({
        stream: null,
        isActive: false,
        error: errorMessage,
      });
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }
    setState({
      stream: null,
      isActive: false,
      error: null,
    });
  }, [state.stream]);

  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.stream]);

  return {
    ...state,
    videoRef,
    startWebcam,
    stopWebcam,
  };
}
