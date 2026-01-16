import { useState, useEffect, useRef } from 'react';
import {
  TextEmbedder,
  FilesetResolver,
} from '@mediapipe/tasks-text';
import { DemoLayout } from '../../components/DemoLayout';
import './TextEmbeddingDemo.css';

interface TextEmbeddingDemoProps {
  onBack: () => void;
}

const EXAMPLE_PAIRS = [
  { text1: "I love programming", text2: "I enjoy coding" },
  { text1: "The cat sat on the mat", text2: "A feline rested on the rug" },
  { text1: "It's raining outside", text2: "The weather is sunny" },
  { text1: "Machine learning is fascinating", text2: "AI technology is interesting" },
];

export function TextEmbeddingDemo({ onBack }: TextEmbeddingDemoProps) {
  const embedderRef = useRef<TextEmbedder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initEmbedder = async () => {
      try {
        const text = await FilesetResolver.forTextTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm'
        );

        const embedder = await TextEmbedder.createFromOptions(text, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/1/universal_sentence_encoder.tflite',
          },
        });

        embedderRef.current = embedder;
        setModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize text embedder:', err);
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

  const computeSimilarity = () => {
    if (!embedderRef.current || !text1.trim() || !text2.trim()) return;

    try {
      const embedding1 = embedderRef.current.embed(text1);
      const embedding2 = embedderRef.current.embed(text2);

      const cosineSimilarity = TextEmbedder.cosineSimilarity(
        embedding1.embeddings[0],
        embedding2.embeddings[0]
      );

      setSimilarity(cosineSimilarity);
    } catch (err) {
      console.error('Error computing similarity:', err);
    }
  };

  const handleExampleClick = (pair: typeof EXAMPLE_PAIRS[0]) => {
    setText1(pair.text1);
    setText2(pair.text2);

    if (embedderRef.current) {
      const embedding1 = embedderRef.current.embed(pair.text1);
      const embedding2 = embedderRef.current.embed(pair.text2);

      const cosineSimilarity = TextEmbedder.cosineSimilarity(
        embedding1.embeddings[0],
        embedding2.embeddings[0]
      );

      setSimilarity(cosineSimilarity);
    }
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
      title="Text Embedding"
      description="Compare semantic similarity between text using Universal Sentence Encoder"
      onBack={onBack}
      controls={
        <>
          <h3>Example Pairs</h3>
          <div className="example-pairs">
            {EXAMPLE_PAIRS.map((pair, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(pair)}
                className="example-pair-btn"
                disabled={!modelReady}
              >
                <span className="example-pair-btn__text1">{pair.text1.slice(0, 20)}...</span>
                <span className="example-pair-btn__vs">vs</span>
                <span className="example-pair-btn__text2">{pair.text2.slice(0, 20)}...</span>
              </button>
            ))}
          </div>
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
            </div>
          ) : (
            <p className="no-result">Enter two texts to compare</p>
          )}
          <div className="embedding-info">
            <h4>About Text Embeddings</h4>
            <p>Text embeddings capture semantic meaning. Similar sentences have embeddings that are close together, even if they use different words.</p>
          </div>
          <div className="model-info">
            <p>Model: Universal Sentence Encoder</p>
            <p>Semantic text similarity</p>
          </div>
        </>
      }
    >
      <div className="text-embedding-demo">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading Universal Sentence Encoder...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : (
          <div className="text-inputs">
            <div className="text-input-group">
              <label>Text 1</label>
              <textarea
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder="Enter first text..."
                className="text-input"
                rows={4}
              />
            </div>
            <div className="vs-divider">VS</div>
            <div className="text-input-group">
              <label>Text 2</label>
              <textarea
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder="Enter second text..."
                className="text-input"
                rows={4}
              />
            </div>
            <button
              onClick={computeSimilarity}
              disabled={!text1.trim() || !text2.trim()}
              className="btn btn-primary compare-btn"
            >
              Compare Texts
            </button>

            {similarity !== null && (
              <div className="result-preview">
                <div
                  className="result-preview__score"
                  style={{ color: getSimilarityColor(similarity) }}
                >
                  {Math.round(similarity * 100)}% Similar
                </div>
                <div className="result-preview__label">
                  {getSimilarityLabel(similarity)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
