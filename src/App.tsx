import { useState } from 'react';
import { DemoCard } from './components/DemoCard';
import {
  GestureRecognitionDemo,
  ObjectDetectionDemo,
  ImageClassificationDemo,
  ImageSegmentationDemo,
  FaceDetectionDemo,
  FaceLandmarkDemo,
  PoseLandmarkDemo,
  HandLandmarkDemo,
  TextClassificationDemo,
  AudioClassificationDemo,
  InteractiveSegmentationDemo,
  ImageEmbeddingDemo,
  TextEmbeddingDemo,
  LanguageDetectionDemo,
} from './demos';
import './App.css';

type DemoType =
  | 'home'
  | 'gesture'
  | 'object-detection'
  | 'image-classification'
  | 'image-segmentation'
  | 'face-detection'
  | 'face-landmark'
  | 'pose-landmark'
  | 'hand-landmark'
  | 'text-classification'
  | 'audio-classification'
  | 'interactive-segmentation'
  | 'image-embedding'
  | 'text-embedding'
  | 'language-detection';

interface DemoInfo {
  id: DemoType;
  title: string;
  description: string;
  icon: string;
  category: 'vision' | 'text' | 'audio';
}

const DEMOS: DemoInfo[] = [
  {
    id: 'gesture',
    title: 'Gesture Recognition',
    description: 'Recognize hand gestures with 3D animations',
    icon: '🤚',
    category: 'vision',
  },
  {
    id: 'hand-landmark',
    title: 'Hand Landmark',
    description: 'Track 21 hand landmarks with finger detection',
    icon: '✋',
    category: 'vision',
  },
  {
    id: 'object-detection',
    title: 'Object Detection',
    description: 'Detect and locate objects in real-time',
    icon: '📦',
    category: 'vision',
  },
  {
    id: 'image-classification',
    title: 'Image Classification',
    description: 'Classify images into 1000+ categories',
    icon: '🏷️',
    category: 'vision',
  },
  {
    id: 'image-segmentation',
    title: 'Image Segmentation',
    description: 'Pixel-level semantic segmentation',
    icon: '🎨',
    category: 'vision',
  },
  {
    id: 'interactive-segmentation',
    title: 'Interactive Segmentation',
    description: 'Click to segment objects in images',
    icon: '🖱️',
    category: 'vision',
  },
  {
    id: 'face-detection',
    title: 'Face Detection',
    description: 'Detect faces and facial keypoints',
    icon: '😀',
    category: 'vision',
  },
  {
    id: 'face-landmark',
    title: 'Face Landmark',
    description: '478 facial landmarks with mesh and iris',
    icon: '👤',
    category: 'vision',
  },
  {
    id: 'pose-landmark',
    title: 'Pose Landmark',
    description: 'Full body pose with 33 keypoints',
    icon: '🏃',
    category: 'vision',
  },
  {
    id: 'image-embedding',
    title: 'Image Embedding',
    description: 'Compare image similarity with embeddings',
    icon: '🔍',
    category: 'vision',
  },
  {
    id: 'text-classification',
    title: 'Text Classification',
    description: 'Sentiment analysis with BERT',
    icon: '📝',
    category: 'text',
  },
  {
    id: 'text-embedding',
    title: 'Text Embedding',
    description: 'Semantic text similarity comparison',
    icon: '📊',
    category: 'text',
  },
  {
    id: 'language-detection',
    title: 'Language Detection',
    description: 'Detect language from text input',
    icon: '🌐',
    category: 'text',
  },
  {
    id: 'audio-classification',
    title: 'Audio Classification',
    description: 'Classify sounds with YAMNet',
    icon: '🎵',
    category: 'audio',
  },
];

function App() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>('home');

  const renderDemo = () => {
    switch (currentDemo) {
      case 'gesture':
        return <GestureRecognitionDemo onBack={() => setCurrentDemo('home')} />;
      case 'object-detection':
        return <ObjectDetectionDemo onBack={() => setCurrentDemo('home')} />;
      case 'image-classification':
        return <ImageClassificationDemo onBack={() => setCurrentDemo('home')} />;
      case 'image-segmentation':
        return <ImageSegmentationDemo onBack={() => setCurrentDemo('home')} />;
      case 'face-detection':
        return <FaceDetectionDemo onBack={() => setCurrentDemo('home')} />;
      case 'face-landmark':
        return <FaceLandmarkDemo onBack={() => setCurrentDemo('home')} />;
      case 'pose-landmark':
        return <PoseLandmarkDemo onBack={() => setCurrentDemo('home')} />;
      case 'hand-landmark':
        return <HandLandmarkDemo onBack={() => setCurrentDemo('home')} />;
      case 'text-classification':
        return <TextClassificationDemo onBack={() => setCurrentDemo('home')} />;
      case 'audio-classification':
        return <AudioClassificationDemo onBack={() => setCurrentDemo('home')} />;
      case 'interactive-segmentation':
        return <InteractiveSegmentationDemo onBack={() => setCurrentDemo('home')} />;
      case 'image-embedding':
        return <ImageEmbeddingDemo onBack={() => setCurrentDemo('home')} />;
      case 'text-embedding':
        return <TextEmbeddingDemo onBack={() => setCurrentDemo('home')} />;
      case 'language-detection':
        return <LanguageDetectionDemo onBack={() => setCurrentDemo('home')} />;
      default:
        return null;
    }
  };

  if (currentDemo !== 'home') {
    return renderDemo();
  }

  const visionDemos = DEMOS.filter(d => d.category === 'vision');
  const textDemos = DEMOS.filter(d => d.category === 'text');
  const audioDemos = DEMOS.filter(d => d.category === 'audio');

  return (
    <div className="app">
      <header className="header">
        <h1>MediaPipe Solutions</h1>
        <p>Interactive demos for all MediaPipe AI solutions on the web</p>
      </header>

      <main className="demos-main">
        <section className="demo-section">
          <h2 className="section-title">
            <span className="section-icon">👁️</span>
            Vision
          </h2>
          <div className="demo-grid">
            {visionDemos.map(demo => (
              <DemoCard
                key={demo.id}
                title={demo.title}
                description={demo.description}
                icon={<span>{demo.icon}</span>}
                category={demo.category}
                onClick={() => setCurrentDemo(demo.id)}
              />
            ))}
          </div>
        </section>

        <section className="demo-section">
          <h2 className="section-title">
            <span className="section-icon">📝</span>
            Text
          </h2>
          <div className="demo-grid">
            {textDemos.map(demo => (
              <DemoCard
                key={demo.id}
                title={demo.title}
                description={demo.description}
                icon={<span>{demo.icon}</span>}
                category={demo.category}
                onClick={() => setCurrentDemo(demo.id)}
              />
            ))}
          </div>
        </section>

        <section className="demo-section">
          <h2 className="section-title">
            <span className="section-icon">🎵</span>
            Audio
          </h2>
          <div className="demo-grid">
            {audioDemos.map(demo => (
              <DemoCard
                key={demo.id}
                title={demo.title}
                description={demo.description}
                icon={<span>{demo.icon}</span>}
                category={demo.category}
                onClick={() => setCurrentDemo(demo.id)}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Powered by{' '}
          <a href="https://ai.google.dev/edge/mediapipe/solutions/guide" target="_blank" rel="noopener noreferrer">
            MediaPipe
          </a>
        </p>
        <p className="footer-note">
          14 AI solutions • Vision • Text • Audio
        </p>
      </footer>
    </div>
  );
}

export default App;
