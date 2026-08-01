// src/scenes/Crystal/config/crystalConfig.js
import * as THREE from "three";

/**
 * Configuração Global para todos os Modelos de Cristais do Site.
 * Qualquer novo arquivo .glb de cristal importado no futuro herdará
 * automaticamente todas essas propriedades visuais, de material,
 * iluminação e interação com o mouse.
 */
export const crystalConfig = {
  // Modelo padrão (em /public/models/)
  defaultModel: "/models/cristal.glb",

  // Configuração do Material de Transmissão do Cristal (MeshTransmissionMaterial)
  // NOTA: Cada instância renderiza um render target separado. Se múltiplos cristais
  // forem visíveis simultaneamente, o custo GPU se multiplica proporcionalmente.
  material: {
    transmission: 1,
    thickness: 2.5,
    roughness: 0.02,
    ior: 1.52,
    chromaticAberration: 0.015,
    anisotropicBlur: 0.08,
    distortion: 0.0,
    distortionScale: 0.0,
    temporalDistortion: 0,
    normalScale: new THREE.Vector2(0.05, 0.05),
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
    attenuationColor: "#ffffff",
    attenuationDistance: 8,
    resolution: 1024,
    samples: 12,
    backside: true,
    backsideThickness: 2.5,
    side: THREE.DoubleSide,
  },

  // Configuração do Conteúdo Interno Congelado (Inner Blob Core)
  innerBlob: {
    scaleFactor: 0.16,
    material: {
      color: "#dce5ef",
      roughness: 0.7,
      metalness: 0.0,
      emissive: "#c0d4e8",
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
      depthWrite: true,
    },
    pointLight: {
      intensity: 4,
      distance: 3.5,
      color: "#ffffff",
    },
  },

  // Configuração do Efeito Interativo do Mouse (Ondas nos Vértices 3D)
  hoverEffect: {
    radius: 0.55,
    frequency: 14.0,
    speed: 7.0,
    amplitude: 0.025,
    lerpSpeed: 0.12,
    fadeSpeed: 0.08,
  },

  // Configuração do Ambiente e Iluminação
  environment: {
    backgroundColor: "#0a0a0f",
    fog: {
      color: "#0a0a0f",
      near: 10,
      far: 25,
    },
    ambientLightIntensity: 0.15,
    particlesColor: "#ffffff",
  },
};
