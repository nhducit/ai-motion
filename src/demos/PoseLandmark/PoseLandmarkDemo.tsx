import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  PoseLandmarkerResult,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './PoseLandmarkDemo.css';

interface PoseLandmarkDemoProps {
  onBack: () => void;
}

const LANDMARK_NAMES = [
  'Nose', 'Left Eye Inner', 'Left Eye', 'Left Eye Outer',
  'Right Eye Inner', 'Right Eye', 'Right Eye Outer',
  'Left Ear', 'Right Ear', 'Mouth Left', 'Mouth Right',
  'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
  'Left Wrist', 'Right Wrist', 'Left Pinky', 'Right Pinky',
  'Left Index', 'Right Index', 'Left Thumb', 'Right Thumb',
  'Left Hip', 'Right Hip', 'Left Knee', 'Right Knee',
  'Left Ankle', 'Right Ankle', 'Left Heel', 'Right Heel',
  'Left Foot Index', 'Right Foot Index',
];

export function PoseLandmarkDemo({ onBack }: PoseLandmarkDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [posesDetected, setPosesDetected] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showPoints, setShowPoints] = useState(true);

  const drawResults = useCallback((results: PoseLandmarkerResult) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPosesDetected(results.landmarks.length);

    if (results.landmarks.length === 0) return;

    const drawingUtils = new DrawingUtils(ctx);

    for (const landmarks of results.landmarks) {
      if (showSkeleton) {
        drawingUtils.drawConnectors(
          landmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          { color: '#00d4ff', lineWidth: 3 }
        );
      }

      if (showPoints) {
        drawingUtils.drawLandmarks(landmarks, {
          radius: 4,
          color: '#ff6b6b',
          fillColor: '#ff6b6b',
        });
      }
    }
  }, [showSkeleton, showPoints]);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 2,
        });

        landmarkerRef.current = landmarker;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numPoses: 2,
          });

          landmarkerRef.current = landmarker;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize pose landmarker:', fallbackErr);
        }
      }
    };

    initLandmarker();

    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !modelReady || !landmarkerRef.current) return;

    const detectFrame = () => {
      if (!landmarkerRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const results = landmarkerRef.current.detectForVideo(video, performance.now());
          drawResults(results);
        } catch (err) {
          console.error('Error during pose landmark detection:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelReady, videoRef, drawResults]);

  const handleStart = async () => {
    setIsLoading(true);
    await startWebcam();
    setIsLoading(false);
  };

  return (
    <DemoLayout
      title="Pose Landmark Detection"
      description="Full body pose estimation with 33 keypoints"
      onBack={onBack}
      controls={
        <>
          <h3>Controls</h3>
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={isLoading || !modelReady}
              className="btn btn-primary btn-full"
            >
              {isLoading ? 'Starting...' : modelReady ? 'Start Camera' : 'Loading AI...'}
            </button>
          ) : (
            <button onClick={stopWebcam} className="btn btn-secondary btn-full">
              Stop Camera
            </button>
          )}
          {error && <div className="error">{error}</div>}

          <div className="visualization-options">
            <h4>Visualization</h4>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showSkeleton}
                onChange={(e) => setShowSkeleton(e.target.checked)}
              />
              <span>Skeleton Lines</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
              />
              <span>Landmark Points</span>
            </label>
          </div>
        </>
      }
      info={
        <>
          <h3>Detection Info</h3>
          <div className="pose-stats">
            <div className="pose-stat">
              <span className="pose-stat__value">{posesDetected}</span>
              <span className="pose-stat__label">Poses</span>
            </div>
            <div className="pose-stat">
              <span className="pose-stat__value">33</span>
              <span className="pose-stat__label">Landmarks</span>
            </div>
          </div>
          <div className="landmark-list">
            <h4>Body Landmarks</h4>
            <div className="landmark-scroll">
              {LANDMARK_NAMES.map((name, idx) => (
                <div key={idx} className="landmark-item">
                  <span className="landmark-item__index">{idx}</span>
                  <span className="landmark-item__name">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="model-info">
            <p>Model: Pose Landmarker Lite</p>
            <p>Up to 2 poses simultaneously</p>
          </div>
        </>
      }
    >
      <div className="pose-landmark-demo">
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video"
          />
          <canvas
            ref={canvasRef}
            className="overlay"
            width={640}
            height={480}
          />
          {!isActive && (
            <div className="video-placeholder">
              <p>Camera not active</p>
            </div>
          )}
        </div>
      </div>
    </DemoLayout>
  );
}
