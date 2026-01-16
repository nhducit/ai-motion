import { useState, useEffect, useRef } from 'react';
import {
  TextClassifier,
  FilesetResolver,
  Classifications,
} from '@mediapipe/tasks-text';
import { DemoLayout } from '../../components/DemoLayout';
import './TextClassificationDemo.css';

interface TextClassificationDemoProps {
  onBack: () => void;
}

const EXAMPLE_TEXTS = [
  "I absolutely loved this movie! The acting was superb and the story was captivating.",
  "This was the worst experience I've ever had. Terrible service and poor quality.",
  "The product arrived on time and works as expected. Nothing special but does the job.",
  "What an amazing restaurant! The food was delicious and the atmosphere was perfect.",
  "I'm very disappointed with this purchase. It broke after just one week of use.",
];

export function TextClassificationDemo({ onBack }: TextClassificationDemoProps) {
  const classifierRef = useRef<TextClassifier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [classifications, setClassifications] = useState<Classifications[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initClassifier = async () => {
      try {
        const text = await FilesetResolver.forTextTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm'
        );

        const classifier = await TextClassifier.createFromOptions(text, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/text_classifier/bert_classifier/float32/1/bert_classifier.tflite',
          },
          maxResults: 5,
        });

        classifierRef.current = classifier;
        setModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize text classifier:', err);
        setError('Failed to load model. Text classification may not be available in your browser.');
        setIsLoading(false);
      }
    };

    initClassifier();

    return () => {
      if (classifierRef.current) {
        classifierRef.current.close();
      }
    };
  }, []);

  const classifyText = () => {
    if (!classifierRef.current || !inputText.trim()) return;

    try {
      const results = classifierRef.current.classify(inputText);
      setClassifications(results.classifications);
    } catch (err) {
      console.error('Error during text classification:', err);
    }
  };

  const handleExampleClick = (text: string) => {
    setInputText(text);
    if (classifierRef.current) {
      const results = classifierRef.current.classify(text);
      setClassifications(results.classifications);
    }
  };

  const topCategory = classifications[0]?.categories?.[0];
  const isPositive = topCategory?.categoryName === 'positive';
  const isNegative = topCategory?.categoryName === 'negative';

  return (
    <DemoLayout
      title="Text Classification"
      description="Classify text sentiment using BERT-based model"
      onBack={onBack}
      controls={
        <>
          <h3>Example Texts</h3>
          <div className="example-texts">
            {EXAMPLE_TEXTS.map((text, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(text)}
                className="example-btn"
                disabled={!modelReady}
              >
                {text.slice(0, 40)}...
              </button>
            ))}
          </div>
        </>
      }
      info={
        <>
          <h3>Classification Result</h3>
          {classifications.length === 0 ? (
            <p className="no-result">Enter text to classify</p>
          ) : (
            <>
              <div className={`sentiment-badge ${isPositive ? 'sentiment-badge--positive' : isNegative ? 'sentiment-badge--negative' : ''}`}>
                {topCategory?.categoryName || 'Unknown'}
              </div>
              <div className="classification-details">
                {classifications[0]?.categories?.map((cat, idx) => (
                  <div key={idx} className="classification-detail">
                    <div className="classification-detail__header">
                      <span className="classification-detail__name">{cat.categoryName}</span>
                      <span className="classification-detail__score">
                        {Math.round(cat.score * 100)}%
                      </span>
                    </div>
                    <div className="classification-detail__bar">
                      <div
                        className={`classification-detail__fill ${cat.categoryName === 'positive' ? 'classification-detail__fill--positive' : 'classification-detail__fill--negative'}`}
                        style={{ width: `${cat.score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="model-info">
            <p>Model: BERT Classifier</p>
            <p>Binary sentiment classification</p>
          </div>
        </>
      }
    >
      <div className="text-classification-demo">
        <div className="input-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading BERT model...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to classify sentiment..."
                className="text-input"
                rows={6}
              />
              <button
                onClick={classifyText}
                disabled={!modelReady || !inputText.trim()}
                className="btn btn-primary classify-btn"
              >
                Classify Text
              </button>
            </>
          )}
        </div>
        {topCategory && (
          <div className="result-display">
            <div className={`result-icon ${isPositive ? 'result-icon--positive' : isNegative ? 'result-icon--negative' : ''}`}>
              {isPositive ? '+' : isNegative ? '-' : '?'}
            </div>
            <div className="result-text">
              <span className="result-label">{topCategory.categoryName}</span>
              <span className="result-confidence">{Math.round(topCategory.score * 100)}% confidence</span>
            </div>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
