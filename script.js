'use strict';

// Constants
const PLANK_LENGTH_PX = 400; 
const MAX_ANGLE_DEG = 30;    
const TORQUE_SCALE = 10;    
const STORAGE_KEY = 'seesaw-state-v1';

const state = {
  objects: [],      
  angleDeg: 0,
  nextWeightKg: 0
};

const dom = {
  root: null,
  seesaw: null,
  plank: null,
  objectsLayer: null,
  leftWeight: null,
  rightWeight: null,
  nextWeight: null,
  tiltAngle: null,
  resetBtn: null,
  historyLog: null
};

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function randomIntInclusive(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function getHalfPlankLength() {
  return PLANK_LENGTH_PX / 2;
}

function renderTilt() {
  if (!dom.plank) return;
  dom.plank.style.transform = `rotate(${state.angleDeg}deg)`;
}

function calculateSideWeights() {
  let leftWeight = 0;
  let rightWeight = 0;
  
  for (const obj of state.objects) {
    if (obj.xFromCenterPx < 0) {
      leftWeight += obj.weightKg;
    } else {
      rightWeight += obj.weightKg;
    }
  }
  
  return { leftWeight, rightWeight };
}

function generateNextWeight() {
  state.nextWeightKg = randomIntInclusive(1, 10);
  if (dom.nextWeight) {
    dom.nextWeight.textContent = `${state.nextWeightKg} kg`;
  }
}

function updateStats() {
  if (!dom.leftWeight || !dom.rightWeight || !dom.tiltAngle) return;
  
  const { leftWeight, rightWeight } = calculateSideWeights();
  
  dom.leftWeight.textContent = `${leftWeight.toFixed(1)} kg`;
  dom.rightWeight.textContent = `${rightWeight.toFixed(1)} kg`;
  dom.tiltAngle.textContent = `${state.angleDeg.toFixed(1)}°`;
  dom.nextWeight.textContent = `${state.nextWeightKg} kg`;
}

function renderAll() {
  renderTilt();
  renderObjects();
  updateStats();
}

function renderObjects() {
  if (!dom.objectsLayer) return;
  dom.objectsLayer.innerHTML = '';
  const half = getHalfPlankLength();
  const frag = document.createDocumentFragment();
  for (const obj of state.objects) {
    const el = document.createElement('div');
    el.className = 'seesaw__object';
    const leftPx = obj.xFromCenterPx + half;
    el.style.left = leftPx + 'px';
    const label = document.createElement('span');
    label.className = 'seesaw__object-label';
    label.textContent = `${obj.weightKg}kg`;
    el.appendChild(label);
    frag.appendChild(el);
  }
  dom.objectsLayer.appendChild(frag);
}

// Physics helpers
function computeTorques(objects) {
  let leftTorque = 0;
  let rightTorque = 0;
  for (const obj of objects) {
    const distance = Math.abs(obj.xFromCenterPx);
    const torque = obj.weightKg * distance;
    if (obj.xFromCenterPx < 0) leftTorque += torque; else rightTorque += torque;
  }
  return { leftTorque, rightTorque };
}

function computeAngleDeg(leftTorque, rightTorque) {
  const raw = (rightTorque - leftTorque) / TORQUE_SCALE;
  return clamp(raw, -MAX_ANGLE_DEG, MAX_ANGLE_DEG);
}

function updatePhysics() {
  const { leftTorque, rightTorque } = computeTorques(state.objects);
  state.angleDeg = computeAngleDeg(leftTorque, rightTorque);
}

function updateAll() {
  updatePhysics();
  renderAll();
}

function onPlankClick(event) {
  if (!dom.plank) return;
  const rect = dom.plank.getBoundingClientRect();
  const width = rect.width;
  const xWithin = event.clientX - rect.left; 
  const clamped = clamp(xWithin, 0, width);
  const xFromCenter = clamped - width / 2; 

  const newObj = {
    xFromCenterPx: clamp(xFromCenter, -width / 2, width / 2),
    weightKg: state.nextWeightKg
  };
  state.objects.push(newObj);
  addHistoryEntry(newObj.weightKg, newObj.xFromCenterPx);
  generateNextWeight();
  updateAll();
}

function addHistoryEntry(weightKg, xFromCenterPx) {
  if (!dom.historyLog) return;
  
  const side = xFromCenterPx < 0 ? 'left' : 'right';
  const distance = Math.abs(Math.round(xFromCenterPx));
  
  const entry = document.createElement('div');
  entry.className = 'history__entry';
  entry.textContent = `🪵 ${weightKg}kg dropped on ${side} side at ${distance}px from center`;
  
  dom.historyLog.prepend(entry);
}

function clearHistory() {
  if (!dom.historyLog) return;
  dom.historyLog.innerHTML = '';
}

function resetSeesaw() {
  state.objects = [];
  state.angleDeg = 0;
  clearHistory();
  generateNextWeight();
  updateAll();
}


document.addEventListener('DOMContentLoaded', () => {
  dom.root = document.getElementById('simulation-root');
  dom.seesaw = document.getElementById('seesaw');
  dom.plank = document.getElementById('seesaw-plank');
  dom.objectsLayer = document.getElementById('objects-layer');
  dom.leftWeight = document.getElementById('left-weight');
  dom.rightWeight = document.getElementById('right-weight');
  dom.nextWeight = document.getElementById('next-weight');
  dom.tiltAngle = document.getElementById('tilt-angle');
  dom.resetBtn = document.getElementById('reset-btn');
  dom.historyLog = document.getElementById('history-log');

  generateNextWeight();
  updateAll();
  if (dom.plank) dom.plank.addEventListener('click', onPlankClick);
  if (dom.resetBtn) dom.resetBtn.addEventListener('click', resetSeesaw);
});