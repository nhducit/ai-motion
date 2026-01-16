import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './FaceLandmarkDemo.css';

interface FaceLandmarkDemoProps {
  onBack: () => void;
}

export function FaceLandmarkDemo({ onBack }: FaceLandmarkDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [facesDetected, setFacesDetected] = useState(0);
  const [showMesh, setShowMesh] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [showIrises, setShowIrises] = useState(true);

  const drawResults = useCallback((results: FaceLandmarkerResult) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFacesDetected(results.faceLandmarks.length);

    if (results.faceLandmarks.length === 0) return;

    const drawingUtils = new DrawingUtils(ctx);

    for (const landmarks of results.faceLandmarks) {
      if (showMesh) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: '#C0C0C070', lineWidth: 1 }
        );
      }

      if (showContours) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: '#E0E0E0', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          { color: '#FF3030', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          { color: '#30FF30', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          { color: '#30FF30', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          { color: '#FF3030', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
          { color: '#FF3030', lineWidth: 2 }
        );
      }

      if (showIrises) {
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          { color: '#00d4ff', lineWidth: 2 }
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          { color: '#00d4ff', lineWidth: 2 }
        );
      }
    }
  }, [showMesh, showContours, showIrises]);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });

        landmarkerRef.current = landmarker;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            outputFaceBlendshapes: true,
          });

          landmarkerRef.current = landmarker;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize face landmarker:', fallbackErr);
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
          console.error('Error during face landmark detection:', err);
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
      title="Face Landmark Detection"
      description="Detect 478 facial landmarks with mesh, contours, and iris tracking"
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
                checked={showMesh}
                onChange={(e) => setShowMesh(e.target.checked)}
              />
              <span>Face Mesh</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => setShowContours(e.target.checked)}
              />
              <span>Face Contours</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={showIrises}
                onChange={(e) => setShowIrises(e.target.checked)}
              />
              <span>Iris Tracking</span>
            </label>
          </div>
        </>
      }
      info={
        <>
          <h3>Detection Info</h3>
          <div className="landmark-stats">
            <div className="landmark-stat">
              <span className="landmark-stat__value">{facesDetected}</span>
              <span className="landmark-stat__label">Faces</span>
            </div>
            <div className="landmark-stat">
              <span className="landmark-stat__value">478</span>
              <span className="landmark-stat__label">Landmarks</span>
            </div>
          </div>
          <div className="landmark-features">
            <h4>Features</h4>
            <ul>
              <li>Face mesh (468 points)</li>
              <li>Iris tracking (10 points)</li>
              <li>Face blendshapes</li>
              <li>3D transformation matrix</li>
            </ul>
          </div>
          <div className="model-info">
            <p>Model: Face Landmarker</p>
            <p>Up to 2 faces simultaneously</p>
          </div>
        </>
      }
    >
      <div className="face-landmark-demo">
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
