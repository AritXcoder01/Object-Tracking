import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

let model = null;
let modelStatus = 'loading';

export async function loadModel() {
  try {
    modelStatus = 'loading';
    model = await cocossd.load();
    modelStatus = 'ready';
    return model;
  } catch (error) {
    modelStatus = 'error';
    console.error('Failed to load COCO-SSD model:', error);
    throw error;
  }
}

export async function detectObjects(videoElement, confidenceThreshold = 0.5) {
  if (!model) {
    console.warn('Model not loaded yet.');
    return [];
  }
  const predictions = await model.detect(videoElement);
  return predictions
    .filter(pred => pred.score >= confidenceThreshold)
    .map((pred, index) => {
      const [x, y, width, height] = pred.bbox;
      return {
        id: `det_${Date.now()}_${index}`,
        bbox: [x, y, width, height],
        class: pred.class,
        score: pred.score,
        centroid: { x: x + width / 2, y: y + height / 2 }
      };
    });
}

export function getModelStatus() {
  return modelStatus;
}

export function isModelLoaded() {
  return model !== null && modelStatus === 'ready';
}

const CLASS_COLORS = {
  person: '#00ff88',
  bicycle: '#00d4ff', car: '#00d4ff', motorcycle: '#00d4ff', bus: '#00d4ff', truck: '#00d4ff', boat: '#00d4ff', airplane: '#00d4ff', train: '#00d4ff',
  cat: '#ffaa00', dog: '#ffaa00', horse: '#ffaa00', sheep: '#ffaa00', cow: '#ffaa00', elephant: '#ffaa00', bear: '#ffaa00', zebra: '#ffaa00', giraffe: '#ffaa00', bird: '#ffaa00',
  default: '#00d4ff'
};

export function getClassColor(className) {
  return CLASS_COLORS[className] || CLASS_COLORS.default;
}

const CLASS_CATEGORIES = {
  person: 'Person',
  // vehicles
  bicycle: 'Vehicle', car: 'Vehicle', motorcycle: 'Vehicle', bus: 'Vehicle', truck: 'Vehicle', boat: 'Vehicle', airplane: 'Vehicle', train: 'Vehicle',
  // animals
  cat: 'Animal', dog: 'Animal', horse: 'Animal', sheep: 'Animal', cow: 'Animal', elephant: 'Animal', bear: 'Animal', zebra: 'Animal', giraffe: 'Animal', bird: 'Animal',
};

export function getClassCategory(className) {
  return CLASS_CATEGORIES[className] || 'Other';
}
