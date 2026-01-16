import { useState, useEffect, useRef } from 'react';
import {
  ImageClassifier,
  FilesetResolver,
  Classifications,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './ImageClassificationDemo.css';

interface ImageClassificationDemoProps {
  onBack: () => void;
}

export function ImageClassificationDemo({ onBack }: ImageClassificationDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const classifierRef = useRef<ImageClassifier | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [classifications, setClassifications] = useState<Classifications[]>([]);

  useEffect(() => {
    const initClassifier = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const classifier = await ImageClassifier.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          maxResults: 5,
        });

        classifierRef.current = classifier;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const classifier = await ImageClassifier.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            maxResults: 5,
          });

          classifierRef.current = classifier;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize image classifier:', fallbackErr);
        }
      }
    };

    initClassifier();

    return () => {
      if (classifierRef.current) {
        classifierRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !modelReady || !classifierRef.current) return;

    const classifyFrame = () => {
      if (!classifierRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const results = classifierRef.current.classifyForVideo(video, performance.now());
          setClassifications(results.classifications);
        } catch (err) {
          console.error('Error during image classification:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(classifyFrame);
    };

    classifyFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelReady, videoRef]);

  const handleStart = async () => {
    setIsLoading(true);
    await startWebcam();
    setIsLoading(false);
  };

  const topCategories = classifications[0]?.categories?.slice(0, 5) || [];

  return (
    <DemoLayout
      title="Image Classification"
      description="Classify images into 1000+ ImageNet categories in real-time"
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
          <h3>Top Classifications</h3>
          <div className="classification-list">
            {topCategories.length === 0 ? (
              <p className="no-classifications">No classifications yet</p>
            ) : (
              topCategories.map((category, idx) => (
                <div key={idx} className="classification-item">
                  <div className="classification-item__header">
                    <span className="classification-item__rank">#{idx + 1}</span>
                    <span className="classification-item__name">
                      {category.categoryName}
                    </span>
                  </div>
                  <div className="classification-item__bar">
                    <div
                      className="classification-item__fill"
                      style={{ width: `${category.score * 100}%` }}
                    />
                  </div>
                  <span className="classification-item__score">
                    {Math.round(category.score * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="model-info">
            <p>Model: EfficientNet Lite0</p>
            <p>1000 ImageNet classes</p>
          </div>
        </>
      }
    >
      <div className="image-classification-demo">
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video"
          />
          {!isActive && (
            <div className="video-placeholder">
              <p>Camera not active</p>
            </div>
          )}
          {isActive && topCategories[0] && (
            <div className="top-prediction">
              <span className="top-prediction__label">{topCategories[0].categoryName}</span>
              <span className="top-prediction__score">
                {Math.round(topCategories[0].score * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </DemoLayout>
  );
}
