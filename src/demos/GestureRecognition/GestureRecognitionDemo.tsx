import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  GestureRecognizer,
  FilesetResolver,
  GestureRecognizerResult,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import { useGesture } from '../../hooks/useGesture';
import { GestureType } from '../../types';
import {
  OpenHandAnimation,
  FistAnimation,
  PointAnimation,
  PeaceAnimation,
  ThumbsUpAnimation,
} from '../../animations';
import './GestureRecognitionDemo.css';

function GestureAnimation({ gesture }: { gesture: GestureType }) {
  switch (gesture) {
    case 'open_hand':
      return <OpenHandAnimation intensity={1} />;
    case 'fist':
      return <FistAnimation intensity={1} />;
    case 'point':
      return <PointAnimation intensity={1} />;
    case 'peace':
      return <PeaceAnimation intensity={1} />;
    case 'thumbs_up':
      return <ThumbsUpAnimation intensity={1} />;
    default:
      return null;
  }
}

interface GestureRecognitionDemoProps {
  onBack: () => void;
}

export function GestureRecognitionDemo({ onBack }: GestureRecognitionDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const { currentGesture, confidence, updateGesture } = useGesture();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [handsReady, setHandsReady] = useState(false);

  const drawLandmarks = useCallback((results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      for (const landmarks of results.landmarks) {
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17],
        ];

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;

        for (const [start, end] of connections) {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        }

        ctx.fillStyle = '#FF0000';
        for (const landmark of landmarks) {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }
  }, []);

  useEffect(() => {
    const initGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        gestureRecognizerRef.current = gestureRecognizer;
        setHandsReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
          });

          gestureRecognizerRef.current = gestureRecognizer;
          setHandsReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize gesture recognizer:', fallbackErr);
        }
      }
    };

    initGestureRecognizer();

    return () => {
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !handsReady || !gestureRecognizerRef.current) return;

    const detectFrame = () => {
      if (!gestureRecognizerRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const results = gestureRecognizerRef.current.recognizeForVideo(
            video,
            performance.now()
          );

          drawLandmarks(results);

          if (results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0) {
            if (results.landmarks && results.landmarks.length > 0) {
              updateGesture(results.landmarks[0], 'Right');
            }
          } else {
            updateGesture(null, 'Right');
          }
        } catch (err) {
          console.error('Error during gesture recognition:', err);
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
  }, [isActive, handsReady, videoRef, drawLandmarks, updateGesture]);

  const handleStart = async () => {
    setIsLoading(true);
    await startWebcam();
    setIsLoading(false);
  };

  const gestureLabels: Record<GestureType, string> = {
    none: 'No gesture detected',
    open_hand: 'Open Hand - Particle Explosion',
    fist: 'Fist - Pulsing Sphere',
    point: 'Point - Laser Beam',
    peace: 'Peace - Rainbow Wave',
    thumbs_up: 'Thumbs Up - Fireworks',
  };

  return (
    <DemoLayout
      title="Gesture Recognition"
      description="Recognize hand gestures and trigger 3D animations"
      onBack={onBack}
      controls={
        <>
          <h3>Controls</h3>
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={isLoading || !handsReady}
              className="btn btn-primary btn-full"
            >
              {isLoading ? 'Starting...' : handsReady ? 'Start Camera' : 'Loading AI...'}
            </button>
          ) : (
            <button onClick={stopWebcam} className="btn btn-secondary btn-full">
              Stop Camera
            </button>
          )}
          {error && <div className="error">{error}</div>}
        </>
      }
      info={
        <>
          <h3>Detected Gesture</h3>
          <div className="gesture-result">
            <div className="gesture-result__label">{gestureLabels[currentGesture]}</div>
            {confidence > 0 && (
              <div className="gesture-result__confidence">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>
          <div className="gesture-guide">
            <p>Supported gestures:</p>
            <ul>
              <li>Open Hand</li>
              <li>Fist</li>
              <li>Point</li>
              <li>Peace</li>
              <li>Thumbs Up</li>
            </ul>
          </div>
        </>
      }
    >
      <div className="gesture-demo">
        <div className="gesture-demo__video">
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
        <div className="gesture-demo__animation">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <GestureAnimation gesture={currentGesture} />
            <OrbitControls enableZoom={false} />
          </Canvas>
        </div>
      </div>
    </DemoLayout>
  );
}
