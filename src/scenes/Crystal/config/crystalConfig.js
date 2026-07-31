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
    transmission: 0.98,
    roughness: 0.28,
    thickness: 1.1,
    ior: 1.31,
    chromaticAberration: 0.015,
    anisotropy: 0.2,
    distortion: 0.05,
    distortionScale: 0.12,
    temporalDistortion: 0.02,
    normalScale: new THREE.Vector2(0.005, 0.005),
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    attenuationColor: "#9ca6b2",
    attenuationDistance: 2.5,
    resolution: 128,  // 256→128: 4× menor render target; roughness máscara artifacts
    samples: 4,       // mantido: já é o mínimo para antialiasing aceitável
    backside: true,   // mantido: essencial para efeito de cristal translúcido
    // transmissionSampler: true,  // alternativa: reusa buffer global (economia extra),
                                    // mas cristais não "veem" outros objetos transmissivos atrás
  },

  // Configuração do Conteúdo Interno Congelado (Inner Blob Core)
  innerBlob: {
    scaleFactor: 0.16,
    material: {
      color: "#cfd7e0",
      roughness: 0.85,
      metalness: 0.0,
      emissive: "#b8c6d4",
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.88,
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
    backgroundColor: "#8f97a1",
    fog: {
      color: "#8f97a1",
      near: 10,
      far: 25,
    },
    ambientLightIntensity: 0.35,
    particlesColor: "#ffffff",
  },
};
