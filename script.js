'use strict';

// Constants
const PLANK_LENGTH_PX = 400; 
const MAX_ANGLE_DEG = 30;    
const TORQUE_SCALE = 10;    
const STORAGE_KEY = 'seesaw-state-v1';

const state = {
  objects: [],      
  angleDeg: 0
};

const dom = {
  root: null,
  seesaw: null,
  plank: null,
  objectsLayer: null
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

function renderAll() {
  renderTilt();
  renderObjects();
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
    frag.appendChild(el);
  }
  dom.objectsLayer.appendChild(frag);
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
    weightKg: randomIntInclusive(1, 10)
  };
  state.objects.push(newObj);
  renderAll();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  dom.root = document.getElementById('simulation-root');
  dom.seesaw = document.getElementById('seesaw');
  dom.plank = document.getElementById('seesaw-plank');
  dom.objectsLayer = document.getElementById('objects-layer');

  renderAll();
  if (dom.plank) dom.plank.addEventListener('click', onPlankClick);
});