// src/scenes/Crystal/config/crystalConfig.js

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
  // ── Material de Transmissão — Cristal Branco-Gelo Claro ──
  material: {
    // Transmissão & Refração Física
    transmission: 1,
    thickness: 1.0,
    ior: 1.45,
    backside: true,
    backsideThickness: 1.0,

    // Superfície — fosca
    roughness: 0.15,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,

    // Dispersão — sutil
    chromaticAberration: 0.01,
    anisotropicBlur: 0.03,
    distortion: 0,
    distortionScale: 0,
    temporalDistortion: 0,

    // Atenuação — branco puro, sem absorção
    attenuationColor: "#ffffff",
    attenuationDistance: 50,
    color: "#ffffff",

    // Reflexos — presentes
    envMapIntensity: 1.2,

    // Performance
    resolution: 1024,
    samples: 8,
  },

  // Configuração do Conteúdo Interno Congelado (Inner Blob Core)
  innerBlob: {
    scaleFactor: 0.16,
    material: {
      color: "#dce5ef",
      roughness: 0.7,
      metalness: 0.0,
      emissive: "#c0d4e8",
      emissiveIntensity: 0.4,
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
