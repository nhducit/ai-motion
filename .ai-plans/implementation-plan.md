# AI Motion - Hand Gesture Three.js Animation Web App

## Project Overview
A web application that captures webcam video, detects hand gestures using MediaPipe, and displays corresponding Three.js animations based on detected gestures.

## Technology Stack
- **Framework**: React 18 with Vite
- **3D Graphics**: Three.js with @react-three/fiber and @react-three/drei
- **Hand Detection**: MediaPipe Hands (@mediapipe/hands, @mediapipe/camera_utils)
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Language**: TypeScript

## Architecture

```
src/
├── components/
│   ├── WebcamCapture.tsx      # Webcam video stream component
│   ├── HandDetection.tsx      # MediaPipe hand detection wrapper
│   ├── GestureRecognizer.tsx  # Gesture classification logic
│   ├── ThreeAnimation.tsx     # Three.js animation canvas
│   └── App.tsx                # Main application component
├── hooks/
│   ├── useWebcam.ts           # Webcam access hook
│   ├── useHandDetection.ts    # Hand detection hook
│   └── useGesture.ts          # Gesture state management
├── utils/
│   ├── gestureClassifier.ts   # Gesture classification algorithms
│   └── animationHelpers.ts    # Animation utility functions
├── animations/
│   ├── WaveAnimation.tsx      # Wave gesture animation
│   ├── FistAnimation.tsx      # Fist gesture animation
│   ├── PointAnimation.tsx     # Point gesture animation
│   ├── OpenHandAnimation.tsx  # Open hand animation
│   └── PeaceAnimation.tsx     # Peace sign animation
├── types/
│   └── index.ts               # TypeScript type definitions
└── __tests__/
    ├── gestureClassifier.test.ts
    ├── useGesture.test.ts
    └── components/
        └── GestureRecognizer.test.tsx
```

## Gesture Recognition

### Supported Gestures
1. **Open Hand** - All fingers extended → Particle explosion animation
2. **Fist** - All fingers closed → Pulsing sphere animation
3. **Point** - Index finger extended → Laser beam animation
4. **Peace Sign** - Index and middle fingers extended → Rainbow wave animation
5. **Thumbs Up** - Thumb extended upward → Fireworks animation

### Detection Logic
- Use MediaPipe Hand Landmarks (21 points per hand)
- Calculate finger extension states based on landmark positions
- Classify gesture based on finger state combination
- Apply debouncing to prevent flickering

## Implementation Phases

### Phase 1: Project Setup
- Initialize Vite + React + TypeScript project
- Install all dependencies
- Configure TypeScript and ESLint

### Phase 2: Webcam Integration
- Create webcam access hook
- Display video stream
- Handle permissions

### Phase 3: Hand Detection
- Integrate MediaPipe Hands
- Draw hand landmarks overlay
- Extract landmark data

### Phase 4: Gesture Recognition
- Implement gesture classifier
- Create gesture state management
- Add debouncing

### Phase 5: Three.js Animations
- Set up React Three Fiber canvas
- Create gesture-specific animations
- Link gestures to animations

### Phase 6: Testing
- Unit tests for gesture classifier
- Component tests
- E2E tests with Playwright

## Testing Strategy

### Unit Tests (Vitest)
- Gesture classification logic
- Utility functions
- Custom hooks

### E2E Tests (Playwright)
- Application loads correctly
- Webcam permission flow
- UI interactions
- Animation rendering verification

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.158.0",
    "@mediapipe/hands": "^0.4.1675469240",
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "@mediapipe/drawing_utils": "^0.3.1675466124"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/three": "^0.158.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jsdom": "^23.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

## Success Criteria
1. ✅ Webcam video displays in browser
2. ✅ Hand landmarks are detected and visualized
3. ✅ At least 5 gestures are recognized
4. ✅ Each gesture triggers unique Three.js animation
5. ✅ Unit tests pass with >80% coverage on core logic
6. ✅ Playwright E2E tests pass
7. ✅ Application runs without errors
