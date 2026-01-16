import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioClassifier,
  FilesetResolver,
  AudioClassifierResult,
} from '@mediapipe/tasks-audio';
import { DemoLayout } from '../../components/DemoLayout';
import './AudioClassificationDemo.css';

interface AudioClassificationDemoProps {
  onBack: () => void;
}

export function AudioClassificationDemo({ onBack }: AudioClassificationDemoProps) {
  const classifierRef = useRef<AudioClassifier | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [classifications, setClassifications] = useState<AudioClassifierResult['classifications']>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const initClassifier = async () => {
      try {
        const audio = await FilesetResolver.forAudioTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@latest/wasm'
        );

        const classifier = await AudioClassifier.createFromOptions(audio, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite',
          },
          maxResults: 5,
        });

        classifierRef.current = classifier;
        setModelReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize audio classifier:', err);
        setError('Failed to load audio model.');
        setIsLoading(false);
      }
    };

    initClassifier();

    return () => {
      if (classifierRef.current) {
        classifierRef.current.close();
      }
      stopListening();
    };
  }, []);

  const processAudio = useCallback((analyser: AnalyserNode, sampleRate: number) => {
    if (!classifierRef.current || !isListening) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate audio level for visualization
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(Math.min(rms * 10, 1));

    try {
      // Use synchronous classify method with Float32Array
      const results = classifierRef.current.classify(dataArray, sampleRate);
      if (results.length > 0 && results[0].classifications.length > 0) {
        setClassifications(results[0].classifications);
      }
    } catch {
      // Silently handle errors during continuous audio processing
    }

    animationFrameRef.current = requestAnimationFrame(() => processAudio(analyser, sampleRate));
  }, [isListening]);

  const startListening = async () => {
    if (!classifierRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 16384;

      source.connect(analyser);

      setIsListening(true);
      processAudio(analyser, audioContext.sampleRate);
    } catch (err) {
      console.error('Failed to start audio:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setAudioLevel(0);
  };

  const topCategories = classifications[0]?.categories?.slice(0, 5) || [];

  return (
    <DemoLayout
      title="Audio Classification"
      description="Classify sounds and speech using YAMNet model"
      onBack={onBack}
      controls={
        <>
          <h3>Controls</h3>
          {!isListening ? (
            <button
              onClick={startListening}
              disabled={isLoading || !modelReady}
              className="btn btn-primary btn-full"
            >
              {isLoading ? 'Loading...' : modelReady ? 'Start Microphone' : 'Loading AI...'}
            </button>
          ) : (
            <button onClick={stopListening} className="btn btn-secondary btn-full">
              Stop Microphone
            </button>
          )}
          {error && <div className="error">{error}</div>}
        </>
      }
      info={
        <>
          <h3>Detected Sounds</h3>
          <div className="audio-classifications">
            {topCategories.length === 0 ? (
              <p className="no-sound">No sounds detected</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="audio-class">
                  <div className="audio-class__header">
                    <span className="audio-class__rank">#{idx + 1}</span>
                    <span className="audio-class__name">{cat.categoryName}</span>
                  </div>
                  <div className="audio-class__bar">
                    <div
                      className="audio-class__fill"
                      style={{ width: `${cat.score * 100}%` }}
                    />
                  </div>
                  <span className="audio-class__score">
                    {Math.round(cat.score * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="model-info">
            <p>Model: YAMNet</p>
            <p>521 audio classes</p>
          </div>
        </>
      }
    >
      <div className="audio-classification-demo">
        <div className="audio-display">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading YAMNet model...</p>
            </div>
          ) : (
            <>
              <div className="microphone-visual">
                <div
                  className={`mic-icon ${isListening ? 'mic-icon--active' : ''}`}
                  style={{
                    transform: isListening ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </div>
                {isListening && (
                  <div className="audio-waves">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="audio-wave"
                        style={{
                          height: `${20 + audioLevel * 80 * Math.random()}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="status-text">
                {isListening ? (
                  <>
                    <span className="status-listening">Listening...</span>
                    {topCategories[0] && (
                      <span className="current-sound">{topCategories[0].categoryName}</span>
                    )}
                  </>
                ) : (
                  <span className="status-idle">Click "Start Microphone" to begin</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DemoLayout>
  );
}
