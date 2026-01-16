import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FaceDetector,
  FilesetResolver,
  Detection,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './FaceDetectionDemo.css';

interface FaceDetectionDemoProps {
  onBack: () => void;
}

export function FaceDetectionDemo({ onBack }: FaceDetectionDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<FaceDetector | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);

  const drawDetections = useCallback((results: Detection[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !video) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    for (const detection of results) {
      if (!detection.boundingBox) continue;

      const { originX, originY, width, height } = detection.boundingBox;
      const x = originX * scaleX;
      const y = originY * scaleY;
      const w = width * scaleX;
      const h = height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Draw confidence
      const score = detection.categories?.[0]?.score || 0;
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${Math.round(score * 100)}%`, x + 4, y - 8);

      // Draw keypoints
      if (detection.keypoints) {
        ctx.fillStyle = '#ff6b6b';
        for (const keypoint of detection.keypoints) {
          ctx.beginPath();
          ctx.arc(
            keypoint.x * canvas.width,
            keypoint.y * canvas.height,
            4,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }
  }, [videoRef]);

  useEffect(() => {
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        });

        detectorRef.current = detector;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.5,
          });

          detectorRef.current = detector;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize face detector:', fallbackErr);
        }
      }
    };

    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !modelReady || !detectorRef.current) return;

    const detectFrame = () => {
      if (!detectorRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const results = detectorRef.current.detectForVideo(video, performance.now());
          setDetections(results.detections);
          drawDetections(results.detections);
        } catch (err) {
          console.error('Error during face detection:', err);
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
  }, [isActive, modelReady, videoRef, drawDetections]);

  const handleStart = async () => {
    setIsLoading(true);
    await startWebcam();
    setIsLoading(false);
  };

  return (
    <DemoLayout
      title="Face Detection"
      description="Detect faces and facial keypoints in real-time using BlazeFace"
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
        </>
      }
      info={
        <>
          <h3>Detection Results</h3>
          <div className="face-stats">
            <div className="face-stat">
              <span className="face-stat__value">{detections.length}</span>
              <span className="face-stat__label">Faces Detected</span>
            </div>
          </div>
          {detections.map((detection, idx) => (
            <div key={idx} className="face-info">
              <h4>Face {idx + 1}</h4>
              <p>Confidence: {Math.round((detection.categories?.[0]?.score || 0) * 100)}%</p>
              <p>Keypoints: {detection.keypoints?.length || 0}</p>
            </div>
          ))}
          <div className="keypoint-legend">
            <h4>Keypoints</h4>
            <ul>
              <li>Right Eye</li>
              <li>Left Eye</li>
              <li>Nose Tip</li>
              <li>Mouth Center</li>
              <li>Right Ear Tragion</li>
              <li>Left Ear Tragion</li>
            </ul>
          </div>
          <div className="model-info">
            <p>Model: BlazeFace Short Range</p>
            <p>6 facial keypoints</p>
          </div>
        </>
      }
    >
      <div className="face-detection-demo">
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
