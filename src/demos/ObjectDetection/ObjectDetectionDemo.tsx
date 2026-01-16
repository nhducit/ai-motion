import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ObjectDetector,
  FilesetResolver,
  Detection,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './ObjectDetectionDemo.css';

interface ObjectDetectionDemoProps {
  onBack: () => void;
}

export function ObjectDetectionDemo({ onBack }: ObjectDetectionDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<ObjectDetector | null>(null);
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
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      const category = detection.categories?.[0];
      if (category) {
        const label = `${category.categoryName} ${Math.round(category.score * 100)}%`;
        ctx.font = '14px sans-serif';
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(x, y - 22, textWidth + 8, 20);

        ctx.fillStyle = '#000';
        ctx.fillText(label, x + 4, y - 7);
      }
    }
  }, [videoRef]);

  useEffect(() => {
    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          scoreThreshold: 0.5,
          maxResults: 10,
        });

        detectorRef.current = detector;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const detector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            scoreThreshold: 0.5,
            maxResults: 10,
          });

          detectorRef.current = detector;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize object detector:', fallbackErr);
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
          console.error('Error during object detection:', err);
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
      title="Object Detection"
      description="Detect and locate objects in real-time using EfficientDet"
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
          <h3>Detected Objects</h3>
          <div className="detection-list">
            {detections.length === 0 ? (
              <p className="no-detections">No objects detected</p>
            ) : (
              detections.map((detection, idx) => (
                <div key={idx} className="detection-item">
                  <span className="detection-item__name">
                    {detection.categories?.[0]?.categoryName || 'Unknown'}
                  </span>
                  <span className="detection-item__score">
                    {Math.round((detection.categories?.[0]?.score || 0) * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="model-info">
            <p>Model: EfficientDet Lite0</p>
            <p>80 COCO classes supported</p>
          </div>
        </>
      }
    >
      <div className="object-detection-demo">
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
