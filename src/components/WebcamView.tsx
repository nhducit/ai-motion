import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './WebcamView.css';

interface WebcamViewProps {
  isActive: boolean;
  onFrame?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  width?: number;
  height?: number;
  mirrored?: boolean;
}

export interface WebcamViewHandle {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  getContext: () => CanvasRenderingContext2D | null;
}

export const WebcamView = forwardRef<WebcamViewHandle, WebcamViewProps>(
  ({ isActive, onFrame, width = 640, height = 480, mirrored = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useImperativeHandle(ref, () => ({
      video: videoRef.current,
      canvas: canvasRef.current,
      getContext: () => canvasRef.current?.getContext('2d') ?? null,
    }));

    useEffect(() => {
      if (!isActive || !onFrame) return;

      const processFrame = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
          onFrame(videoRef.current, canvasRef.current);
        }
        animationRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [isActive, onFrame]);

    return (
      <div className="webcam-view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`webcam-view__video ${mirrored ? 'webcam-view__video--mirrored' : ''}`}
          width={width}
          height={height}
        />
        <canvas
          ref={canvasRef}
          className={`webcam-view__canvas ${mirrored ? 'webcam-view__canvas--mirrored' : ''}`}
          width={width}
          height={height}
        />
        {!isActive && (
          <div className="webcam-view__placeholder">
            <p>Camera not active</p>
          </div>
        )}
      </div>
    );
  }
);

WebcamView.displayName = 'WebcamView';
