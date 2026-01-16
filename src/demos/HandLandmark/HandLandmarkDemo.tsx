import { useState, useCallback, useEffect, useRef } from 'react';
import {
  HandLandmarker,
  FilesetResolver,
  HandLandmarkerResult,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './HandLandmarkDemo.css';

interface HandLandmarkDemoProps {
  onBack: () => void;
}

const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export function HandLandmarkDemo({ onBack }: HandLandmarkDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [handsDetected, setHandsDetected] = useState(0);
  const [handedness, setHandedness] = useState<string[]>([]);
  const [showConnections, setShowConnections] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);

  const drawResults = useCallback((results: HandLandmarkerResult) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHandsDetected(results.landmarks.length);
    setHandedness(results.handednesses.map(h => h[0]?.categoryName || 'Unknown'));

    if (results.landmarks.length === 0) return;

    const drawingUtils = new DrawingUtils(ctx);

    for (let i = 0; i < results.landmarks.length; i++) {
      const landmarks = results.landmarks[i];
      const isLeft = results.handednesses[i]?.[0]?.categoryName === 'Left';
      const color = isLeft ? '#ff6b6b' : '#00d4ff';

      if (showConnections) {
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          { color, lineWidth: 3 }
        );
      }

      if (showLandmarks) {
        drawingUtils.drawLandmarks(landmarks, {
          radius: 5,
          color: '#ffffff',
          fillColor: color,
        });
      }
    }
  }, [showConnections, showLandmarks]);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });

        landmarkerRef.current = landmarker;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
          });

          landmarkerRef.current = landmarker;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize hand landmarker:', fallbackErr);
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
          console.error('Error during hand landmark detection:', err);
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
      title="Hand Landmark Detection"
      description="Detect 21 hand landmarks with finger tracking"
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
                checked={showConnections}
                onChange={(e) => setShowConnections(e.target.checked)}
              />
              <span>Connections</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
              />
              <span>Landmarks</span>
            </label>
          </div>
        </>
      }
      info={
        <>
          <h3>Detection Info</h3>
          <div className="hand-stats">
            <div className="hand-stat">
              <span className="hand-stat__value">{handsDetected}</span>
              <span className="hand-stat__label">Hands</span>
            </div>
            <div className="hand-stat">
              <span className="hand-stat__value">21</span>
              <span className="hand-stat__label">Landmarks</span>
            </div>
          </div>
          {handedness.length > 0 && (
            <div className="handedness-info">
              <h4>Detected Hands</h4>
              {handedness.map((hand, idx) => (
                <div key={idx} className={`handedness-item handedness-item--${hand.toLowerCase()}`}>
                  {hand} Hand
                </div>
              ))}
            </div>
          )}
          <div className="finger-info">
            <h4>Finger Landmarks</h4>
            {FINGER_NAMES.map((name, idx) => (
              <div key={idx} className="finger-item">
                <span className="finger-item__name">{name}</span>
                <span className="finger-item__points">4 points</span>
              </div>
            ))}
            <div className="finger-item">
              <span className="finger-item__name">Wrist</span>
              <span className="finger-item__points">1 point</span>
            </div>
          </div>
          <div className="model-info">
            <p>Model: Hand Landmarker</p>
            <p>Up to 2 hands simultaneously</p>
          </div>
        </>
      }
    >
      <div className="hand-landmark-demo">
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
