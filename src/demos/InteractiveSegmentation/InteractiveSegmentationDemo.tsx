import { useState, useCallback, useEffect, useRef } from 'react';
import {
  InteractiveSegmenter,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import './InteractiveSegmentationDemo.css';

interface InteractiveSegmentationDemoProps {
  onBack: () => void;
}

interface ClickPoint {
  x: number;
  y: number;
}

export function InteractiveSegmentationDemo({ onBack }: InteractiveSegmentationDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const segmenterRef = useRef<InteractiveSegmenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('/demo-image.jpg');
  const [error, setError] = useState<string | null>(null);

  const DEMO_IMAGES = [
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=640&q=80',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=640&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80',
  ];

  useEffect(() => {
    const initSegmenter = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const segmenter = await InteractiveSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite',
          },
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });

        segmenterRef.current = segmenter;
        setModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize interactive segmenter:', err);
        setError('Failed to load model.');
        setIsLoading(false);
      }
    };

    initSegmenter();

    return () => {
      if (segmenterRef.current) {
        segmenterRef.current.close();
      }
    };
  }, []);

  const segmentAtPoint = useCallback((x: number, y: number) => {
    if (!segmenterRef.current || !imageRef.current) return;

    try {
      segmenterRef.current.segment(
        imageRef.current,
        { keypoint: { x, y } },
        (result) => {
          if (result.categoryMask) {
            drawSegmentationMask(result.categoryMask.getAsUint8Array(), result.categoryMask.width, result.categoryMask.height);
          }
        }
      );
    } catch (err) {
      console.error('Error during segmentation:', err);
    }
  }, []);

  const drawSegmentationMask = (mask: Uint8Array, width: number, height: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < mask.length; i++) {
      const pixelIndex = i * 4;
      if (mask[i] === 1) {
        imageData.data[pixelIndex] = 0;
        imageData.data[pixelIndex + 1] = 212;
        imageData.data[pixelIndex + 2] = 255;
        imageData.data[pixelIndex + 3] = 150;
      } else {
        imageData.data[pixelIndex + 3] = 0;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    // Draw click points
    ctx.fillStyle = '#ff6b6b';
    for (const point of clickPoints) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!modelReady || !imageLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPoint = { x, y };
    setClickPoints([...clickPoints, newPoint]);
    segmentAtPoint(x, y);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }
  };

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setClickPoints([]);
    setImageLoaded(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  const handleClearPoints = () => {
    setClickPoints([]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  return (
    <DemoLayout
      title="Interactive Segmentation"
      description="Click on objects to segment them using Magic Touch"
      onBack={onBack}
      controls={
        <>
          <h3>Controls</h3>
          <button
            onClick={handleClearPoints}
            disabled={clickPoints.length === 0}
            className="btn btn-secondary btn-full"
          >
            Clear Selection
          </button>

          <div className="image-selector">
            <h4>Sample Images</h4>
            <div className="image-grid">
              {DEMO_IMAGES.map((url, idx) => (
                <div
                  key={idx}
                  className={`image-thumb ${selectedImage === url ? 'image-thumb--selected' : ''}`}
                  onClick={() => handleImageSelect(url)}
                >
                  <img src={url} alt={`Sample ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </>
      }
      info={
        <>
          <h3>Instructions</h3>
          <div className="instructions">
            <ol>
              <li>Select a sample image or use the default</li>
              <li>Click on any object in the image</li>
              <li>The AI will segment the object you clicked</li>
              <li>Click multiple points for better results</li>
            </ol>
          </div>
          <div className="click-count">
            <span className="click-count__value">{clickPoints.length}</span>
            <span className="click-count__label">Click Points</span>
          </div>
          <div className="model-info">
            <p>Model: Magic Touch</p>
            <p>Interactive object segmentation</p>
          </div>
        </>
      }
    >
      <div className="interactive-segmentation-demo">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading segmentation model...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : (
          <div className="image-container">
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Segmentation target"
              className="target-image"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
            />
            <canvas
              ref={canvasRef}
              className="segmentation-overlay"
              onClick={handleCanvasClick}
            />
            {!imageLoaded && (
              <div className="image-loading">
                <div className="loading-spinner"></div>
                <p>Loading image...</p>
              </div>
            )}
            {imageLoaded && clickPoints.length === 0 && (
              <div className="click-hint">
                Click on an object to segment it
              </div>
            )}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
