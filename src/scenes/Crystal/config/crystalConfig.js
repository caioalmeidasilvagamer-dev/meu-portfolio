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
  // ── Material de Transmissão — Vidro Oco 100% Transparente (Sem Refração Interna) ──
  material: {
    // Transmissão & Refração
    transmission: 1,            // 100% transparente
    thickness: 0,               // Oco — zero espessura
    ior: 1.0,                   // Zero refração (sem distorcer o conteúdo interno)
    backside: false,            // Sem cálculo de face traseira (transparência pura)
    backsideThickness: 0,

    // Superfície
    roughness: 0,               // Perfeitamente liso — vidro limpo
    clearcoat: 0,
    clearcoatRoughness: 0,

    // Dispersão & Distorção (Desativados)
    chromaticAberration: 0,     // Zero dispersão
    anisotropicBlur: 0,         // Zero blur
    distortion: 0,
    distortionScale: 0,
    temporalDistortion: 0,

    // Atenuação (Incolor)
    attenuationColor: "#ffffff",
    attenuationDistance: 99,
    color: "#ffffff",

    // Reflexões Suaves de Borda
    envMapIntensity: 0.12,

    // Performance
    resolution: 512,
    samples: 4,
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
