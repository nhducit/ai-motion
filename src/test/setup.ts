import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [];
  }
}

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
  },
  writable: true,
});

// Mock canvas context for tests
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillStyle: '',
});

// Mock requestAnimationFrame
(globalThis as typeof globalThis & { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 0;
});

(globalThis as typeof globalThis & { cancelAnimationFrame: typeof cancelAnimationFrame }).cancelAnimationFrame = vi.fn();
