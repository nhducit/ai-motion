import { useState, useEffect, useRef } from 'react';
import {
  LanguageDetector,
  FilesetResolver,
  LanguageDetectorResult,
} from '@mediapipe/tasks-text';
import { DemoLayout } from '../../components/DemoLayout';
import './LanguageDetectionDemo.css';

interface LanguageDetectionDemoProps {
  onBack: () => void;
}

const EXAMPLE_TEXTS = [
  { text: "Hello, how are you today?", expected: "English" },
  { text: "Bonjour, comment allez-vous?", expected: "French" },
  { text: "Hola, que tal estas?", expected: "Spanish" },
  { text: "Guten Tag, wie geht es Ihnen?", expected: "German" },
  { text: "Ciao, come stai?", expected: "Italian" },
  { text: "Olá, como você está?", expected: "Portuguese" },
  { text: "Privyet, kak dela?", expected: "Russian" },
  { text: "Konnichiwa, ogenki desu ka?", expected: "Japanese" },
];

const LANGUAGE_FLAGS: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  el: 'Greek',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  uk: 'Ukrainian',
  he: 'Hebrew',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  sl: 'Slovenian',
};

export function LanguageDetectionDemo({ onBack }: LanguageDetectionDemoProps) {
  const detectorRef = useRef<LanguageDetector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<LanguageDetectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDetector = async () => {
      try {
        const text = await FilesetResolver.forTextTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm'
        );

        const detector = await LanguageDetector.createFromOptions(text, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/language_detector/language_detector/float32/1/language_detector.tflite',
          },
          maxResults: 5,
        });

        detectorRef.current = detector;
        setModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize language detector:', err);
        setError('Failed to load model.');
        setIsLoading(false);
      }
    };

    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.close();
      }
    };
  }, []);

  const detectLanguage = () => {
    if (!detectorRef.current || !inputText.trim()) return;

    try {
      const result = detectorRef.current.detect(inputText);
      setResults(result);
    } catch (err) {
      console.error('Error during language detection:', err);
    }
  };

  const handleExampleClick = (text: string) => {
    setInputText(text);
    if (detectorRef.current) {
      const result = detectorRef.current.detect(text);
      setResults(result);
    }
  };

  const getLanguageName = (code: string) => {
    return LANGUAGE_FLAGS[code] || code.toUpperCase();
  };

  const topLanguage = results?.languages?.[0];

  return (
    <DemoLayout
      title="Language Detection"
      description="Detect the language of input text"
      onBack={onBack}
      controls={
        <>
          <h3>Example Texts</h3>
          <div className="example-texts">
            {EXAMPLE_TEXTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(item.text)}
                className="example-btn"
                disabled={!modelReady}
              >
                <span className="example-btn__text">{item.text.slice(0, 30)}...</span>
                <span className="example-btn__expected">{item.expected}</span>
              </button>
            ))}
          </div>
        </>
      }
      info={
        <>
          <h3>Detection Results</h3>
          {results?.languages && results.languages.length > 0 ? (
            <div className="language-results">
              {results.languages.slice(0, 5).map((lang, idx) => (
                <div key={idx} className="language-result">
                  <div className="language-result__header">
                    <span className="language-result__rank">#{idx + 1}</span>
                    <span className="language-result__name">
                      {getLanguageName(lang.languageCode)}
                    </span>
                    <span className="language-result__code">
                      ({lang.languageCode})
                    </span>
                  </div>
                  <div className="language-result__bar">
                    <div
                      className="language-result__fill"
                      style={{ width: `${lang.probability * 100}%` }}
                    />
                  </div>
                  <span className="language-result__score">
                    {Math.round(lang.probability * 100)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-result">Enter text to detect language</p>
          )}
          <div className="model-info">
            <p>Model: Language Detector</p>
            <p>100+ languages supported</p>
          </div>
        </>
      }
    >
      <div className="language-detection-demo">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading language detector...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : (
          <div className="input-section">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text in any language..."
              className="text-input"
              rows={6}
            />
            <button
              onClick={detectLanguage}
              disabled={!inputText.trim()}
              className="btn btn-primary detect-btn"
            >
              Detect Language
            </button>

            {topLanguage && (
              <div className="result-preview">
                <div className="result-preview__language">
                  {getLanguageName(topLanguage.languageCode)}
                </div>
                <div className="result-preview__code">
                  Language Code: {topLanguage.languageCode}
                </div>
                <div className="result-preview__confidence">
                  {Math.round(topLanguage.probability * 100)}% Confidence
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
