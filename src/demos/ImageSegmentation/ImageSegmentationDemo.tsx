import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ImageSegmenter,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import { useWebcam } from '../../hooks/useWebcam';
import './ImageSegmentationDemo.css';

interface ImageSegmentationDemoProps {
  onBack: () => void;
}

const LEGEND_COLORS = [
  { name: 'Background', color: [0, 0, 0] },
  { name: 'Aeroplane', color: [128, 0, 0] },
  { name: 'Bicycle', color: [0, 128, 0] },
  { name: 'Bird', color: [128, 128, 0] },
  { name: 'Boat', color: [0, 0, 128] },
  { name: 'Bottle', color: [128, 0, 128] },
  { name: 'Bus', color: [0, 128, 128] },
  { name: 'Car', color: [128, 128, 128] },
  { name: 'Cat', color: [64, 0, 0] },
  { name: 'Chair', color: [192, 0, 0] },
  { name: 'Cow', color: [64, 128, 0] },
  { name: 'Dining Table', color: [192, 128, 0] },
  { name: 'Dog', color: [64, 0, 128] },
  { name: 'Horse', color: [192, 0, 128] },
  { name: 'Motorbike', color: [64, 128, 128] },
  { name: 'Person', color: [192, 128, 128] },
  { name: 'Potted Plant', color: [0, 64, 0] },
  { name: 'Sheep', color: [128, 64, 0] },
  { name: 'Sofa', color: [0, 192, 0] },
  { name: 'Train', color: [128, 192, 0] },
  { name: 'TV/Monitor', color: [0, 64, 128] },
];

export function ImageSegmentationDemo({ onBack }: ImageSegmentationDemoProps) {
  const { videoRef, startWebcam, stopWebcam, isActive, error } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const animationFrameRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [detectedClasses, setDetectedClasses] = useState<Set<number>>(new Set());

  const drawSegmentation = useCallback((mask: Uint8Array, width: number, height: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.createImageData(width, height);
    const detected = new Set<number>();

    for (let i = 0; i < mask.length; i++) {
      const classId = mask[i];
      detected.add(classId);

      const color = LEGEND_COLORS[classId]?.color || [0, 0, 0];
      const pixelIndex = i * 4;

      imageData.data[pixelIndex] = color[0];
      imageData.data[pixelIndex + 1] = color[1];
      imageData.data[pixelIndex + 2] = color[2];
      imageData.data[pixelIndex + 3] = classId === 0 ? 0 : 180; // Transparent background
    }

    // Scale to canvas size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    setDetectedClasses(detected);
  }, []);

  useEffect(() => {
    const initSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });

        segmenterRef.current = segmenter;
        setModelReady(true);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );

          const segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          });

          segmenterRef.current = segmenter;
          setModelReady(true);
        } catch (fallbackErr) {
          console.error('Failed to initialize image segmenter:', fallbackErr);
        }
      }
    };

    initSegmenter();

    return () => {
      if (segmenterRef.current) {
        segmenterRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !modelReady || !segmenterRef.current) return;

    const segmentFrame = () => {
      if (!segmenterRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          segmenterRef.current.segmentForVideo(video, performance.now(), (result) => {
            if (result.categoryMask) {
              const mask = result.categoryMask.getAsUint8Array();
              drawSegmentation(mask, result.categoryMask.width, result.categoryMask.height);
            }
          });
        } catch (err) {
          console.error('Error during image segmentation:', err);
        }
      }

      animationFrameRef.current = requestAnimationFrame(segmentFrame);
    };

    segmentFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, modelReady, videoRef, drawSegmentation]);

  const handleStart = async () => {
    setIsLoading(true);
    await startWebcam();
    setIsLoading(false);
  };

  return (
    <DemoLayout
      title="Image Segmentation"
      description="Pixel-level semantic segmentation using DeepLab V3"
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
          <h3>Detected Classes</h3>
          <div className="legend">
            {LEGEND_COLORS.map((item, idx) => (
              <div
                key={idx}
                className={`legend-item ${detectedClasses.has(idx) ? 'legend-item--active' : ''}`}
              >
                <div
                  className="legend-item__color"
                  style={{ backgroundColor: `rgb(${item.color.join(',')})` }}
                />
                <span className="legend-item__name">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="model-info">
            <p>Model: DeepLab V3</p>
            <p>21 PASCAL VOC classes</p>
          </div>
        </>
      }
    >
      <div className="image-segmentation-demo">
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
