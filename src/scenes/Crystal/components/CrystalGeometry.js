// CrystalGeometry.js
// Geometria procedural de cristal mineral — facetas grandes, planas, silhueta marcante

import * as THREE from "three";

/**
 * Gera geometria de cristal mineral com facetas grandes e flat shading.
 * Inspirado em quartzo hexagonal: prisma + pirâmide superior.
 *
 * @param {Object} opts
 * @param {number} opts.radius   — raio do prisma (default 1.0)
 * @param {number} opts.height   — altura total do corpo do prisma (default 1.8)
 * @param {number} opts.facets   — número de laterais (6 = hexagonal, 8 = octogonal)
 * @param {number} opts.tipRatio — proporção da altura da ponta vs corpo (0.3 = ponta ocupa 30% da altura)
 * @param {number} opts.tipInset — quão afilada é a ponta (0 = ponta afiada, 1 = ponta no centro do topo)
 * @returns {THREE.BufferGeometry}
 */
export function createCrystalGeometry({
  radius = 1.0,
  height = 1.8,
  facets = 6,
  tipRatio = 0.35,
  tipInset = 0.35,
} = {}) {
  const bodyH = height;
  const tipH = height * tipRatio;
  const baseH = height * tipRatio * 0.6;
  const innerR = radius * (1 - tipInset);

  const vertices = [];
  const indices = [];

  // ── Anéis de vértices ──
  // ring 0: base do prisma (y = -bodyH/2)
  // ring 1: topo do prisma (y = +bodyH/2)
  // ring 2: base da ponta (y = +bodyH/2, inner radius)
  // apex: ponta do cristal (y = +bodyH/2 + tipH)

  const baseY = -bodyH / 2;
  const topY = bodyH / 2;
  const apexY = topY + tipH;
  const baseApexY = baseY - baseH;

  // Gerar anéis
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // ring 0: base do prisma
    vertices.push(cos * radius, baseY, sin * radius);
    // ring 1: topo do prisma
    vertices.push(cos * radius, topY, sin * radius);
    // ring 2: base da ponta (inner radius)
    vertices.push(cos * innerR, topY, sin * innerR);
  }

  // apex (ponta superior)
  const apexIdx = facets * 3;
  vertices.push(0, apexY, 0);

  // base apex (ponta inferior)
  const baseApexIdx = apexIdx + 1;
  vertices.push(0, baseApexY, 0);

  // ── Faces laterais do prisma (ring0 → ring1) ──
  for (let i = 0; i < facets; i++) {
    const next = (i + 1) % facets;
    const i0 = i * 3;      // ring0 current
    const i1 = i * 3 + 1;  // ring1 current
    const i2 = next * 3;   // ring0 next
    const i3 = next * 3 + 1; // ring1 next

    // Duas faces por segmento lateral
    indices.push(i0, i2, i1);
    indices.push(i1, i2, i3);
  }

  // ── Faces da ponta superior (ring2 → apex) ──
  for (let i = 0; i < facets; i++) {
    const next = (i + 1) % facets;
    const i2 = i * 3 + 2;    // ring2 current
    const i3 = next * 3 + 2; // ring2 next

    indices.push(i2, i3, apexIdx);
  }

  // ── Faces da base (ring0 → baseApex) ──
  for (let i = 0; i < facets; i++) {
    const next = (i + 1) % facets;
    const i0 = i * 3;      // ring0 current
    const i2 = next * 3;   // ring0 next

    indices.push(i0, baseApexIdx, i2);
  }

  // ── Face de tampa (ring1 → ring2) ──
  for (let i = 0; i < facets; i++) {
    const next = (i + 1) % facets;
    const i1 = i * 3 + 1;    // ring1 current
    const i2 = i * 3 + 2;    // ring2 current
    const i3 = next * 3 + 1; // ring1 next
    const i4 = next * 3 + 2; // ring2 next

    indices.push(i1, i3, i4);
    indices.push(i1, i4, i2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Flat shading: recomputar normais por face (sem suavização)
  geometry.computeVertexNormals();
  toFlatShading(geometry);

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Converte geometria para flat shading — normais idênticas para vértices da mesma face.
 * Three.js r152+ suporta `geometry.computeVertexNormals()` + `flat shading` no material,
 * mas para garantir compatibilidade, expandimos vértices por face.
 */
function toFlatShading(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;

  if (!index) return; // já é indexed sem faces compartilhadas

  // Para flat shading, precisamos de vértices não-compartilhados por face
  const newPositions = [];
  const newNormals = [];
  const newIndices = [];

  const triCount = index.count / 3;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < triCount; i++) {
    const a = index.getX(i * 3);
    const b = index.getX(i * 3 + 1);
    const c = index.getX(i * 3 + 2);

    vA.fromBufferAttribute(pos, a);
    vB.fromBufferAttribute(pos, b);
    vC.fromBufferAttribute(pos, c);

    // Calcular normal da face
    const edge1 = vB.clone().sub(vA);
    const edge2 = vC.clone().sub(vA);
    normal.crossVectors(edge1, edge2).normalize();

    const baseIdx = i * 3;
    newPositions.push(vA.x, vA.y, vA.z);
    newPositions.push(vB.x, vB.y, vB.z);
    newPositions.push(vC.x, vC.y, vC.z);
    newNormals.push(normal.x, normal.y, normal.z);
    newNormals.push(normal.x, normal.y, normal.z);
    newNormals.push(normal.x, normal.y, normal.z);
    newIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
  }

  geometry.deleteAttribute("position");
  if (geometry.attributes.normal) geometry.deleteAttribute("normal");

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(newPositions, 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(newNormals, 3)
  );
  geometry.setIndex(newIndices);
}

/**
 * Cache global para reutilizar geometria entre instâncias.
 */
const GEO_CACHE = new Map();

export function getCrystalGeometry(opts) {
  const key = JSON.stringify(opts || {});
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const geo = createCrystalGeometry(opts);
  GEO_CACHE.set(key, geo);
  return geo;
}
