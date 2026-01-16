import { useState, useEffect, useRef } from 'react';
import {
  ImageEmbedder,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { DemoLayout } from '../../components/DemoLayout';
import './ImageEmbeddingDemo.css';

interface ImageEmbeddingDemoProps {
  onBack: () => void;
}

const DEMO_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80', label: 'Cat' },
  { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', label: 'Dog' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', label: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=400&q=80', label: 'Cat 2' },
  { url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&q=80', label: 'Cat 3' },
  { url: 'https://images.unsplash.com/photo-1601758123927-4f7acc7da589?w=400&q=80', label: 'Dog 2' },
];

export function ImageEmbeddingDemo({ onBack }: ImageEmbeddingDemoProps) {
  const embedderRef = useRef<ImageEmbedder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const initEmbedder = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const embedder = await ImageEmbedder.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite',
          },
          runningMode: 'IMAGE',
        });

        embedderRef.current = embedder;
        setIsModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize image embedder:', err);
        setError('Failed to load model.');
        setIsLoading(false);
      }
    };

    initEmbedder();

    return () => {
      if (embedderRef.current) {
        embedderRef.current.close();
      }
    };
  }, []);

  const handleImageSelect = (index: number) => {
    if (selectedImages.includes(index)) {
      setSelectedImages(selectedImages.filter(i => i !== index));
      setSimilarity(null);
    } else if (selectedImages.length < 2) {
      const newSelected = [...selectedImages, index];
      setSelectedImages(newSelected);

      if (newSelected.length === 2) {
        computeSimilarity(newSelected[0], newSelected[1]);
      } else {
        setSimilarity(null);
      }
    }
  };

  const computeSimilarity = async (idx1: number, idx2: number) => {
    if (!embedderRef.current) return;

    const img1 = imageRefs.current[idx1];
    const img2 = imageRefs.current[idx2];

    if (!img1 || !img2) return;

    try {
      const embedding1 = embedderRef.current.embed(img1);
      const embedding2 = embedderRef.current.embed(img2);

      const cosineSimilarity = ImageEmbedder.cosineSimilarity(
        embedding1.embeddings[0],
        embedding2.embeddings[0]
      );

      setSimilarity(cosineSimilarity);
    } catch (err) {
      console.error('Error computing similarity:', err);
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const getSimilarityLabel = (sim: number) => {
    if (sim > 0.8) return 'Very Similar';
    if (sim > 0.6) return 'Similar';
    if (sim > 0.4) return 'Somewhat Similar';
    if (sim > 0.2) return 'Different';
    return 'Very Different';
  };

  const getSimilarityColor = (sim: number) => {
    if (sim > 0.6) return '#2ecc71';
    if (sim > 0.4) return '#f1c40f';
    return '#e74c3c';
  };

  return (
    <DemoLayout
      title="Image Embedding"
      description="Compare image similarity using neural embeddings"
      onBack={onBack}
      controls={
        <>
          <h3>Instructions</h3>
          <div className="instructions">
            <ol>
              <li>Select two images from the grid</li>
              <li>The AI will compute their embeddings</li>
              <li>Similarity score shows how alike they are</li>
            </ol>
          </div>
          <button
            onClick={() => {
              setSelectedImages([]);
              setSimilarity(null);
            }}
            disabled={selectedImages.length === 0}
            className="btn btn-secondary btn-full"
          >
            Clear Selection
          </button>
        </>
      }
      info={
        <>
          <h3>Similarity Result</h3>
          {similarity !== null ? (
            <div className="similarity-result">
              <div
                className="similarity-score"
                style={{ color: getSimilarityColor(similarity) }}
              >
                {Math.round(similarity * 100)}%
              </div>
              <div className="similarity-label">
                {getSimilarityLabel(similarity)}
              </div>
              <div className="similarity-bar">
                <div
                  className="similarity-bar__fill"
                  style={{
                    width: `${similarity * 100}%`,
                    backgroundColor: getSimilarityColor(similarity),
                  }}
                />
              </div>
              <div className="compared-images">
                <span>{DEMO_IMAGES[selectedImages[0]]?.label}</span>
                <span>vs</span>
                <span>{DEMO_IMAGES[selectedImages[1]]?.label}</span>
              </div>
            </div>
          ) : (
            <p className="no-result">Select 2 images to compare</p>
          )}
          <div className="embedding-info">
            <h4>About Embeddings</h4>
            <p>Image embeddings are vector representations that capture visual features. Similar images have embeddings that are close together in the vector space.</p>
          </div>
          <div className="model-info">
            <p>Model: MobileNet V3 Small</p>
            <p>1024-dimensional embeddings</p>
          </div>
        </>
      }
    >
      <div className="image-embedding-demo">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading embedding model...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : (
          <div className="image-grid">
            {DEMO_IMAGES.map((image, idx) => (
              <div
                key={idx}
                className={`image-card ${selectedImages.includes(idx) ? 'image-card--selected' : ''} ${selectedImages.length >= 2 && !selectedImages.includes(idx) ? 'image-card--disabled' : ''}`}
                onClick={() => loadedImages.has(idx) && handleImageSelect(idx)}
              >
                <img
                  ref={el => imageRefs.current[idx] = el}
                  src={image.url}
                  alt={image.label}
                  onLoad={() => handleImageLoad(idx)}
                  crossOrigin="anonymous"
                />
                <div className="image-card__label">{image.label}</div>
                {selectedImages.includes(idx) && (
                  <div className="image-card__badge">
                    {selectedImages.indexOf(idx) + 1}
                  </div>
                )}
                {!loadedImages.has(idx) && (
                  <div className="image-card__loading">
                    <div className="loading-spinner-small"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
