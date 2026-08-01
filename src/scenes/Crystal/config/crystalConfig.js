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
  // ── Material de Transmissão — Vidro Óptico / Cristal Lapidado PBR ──
  material: {
    // Transmissão & Refração Física (Snell's Law)
    transmission: 1,            // 100% de transmissão de luz (transparência óptica)
    thickness: 0.6,             // Espessura física de casca (desvia a luz suavemente nas bordas)
    ior: 1.52,                  // Vidro Crown / Cristal de Lapidação (IOR = 1.52)
    backside: true,             // Refração de dupla passada (entra e sai das facetas)
    backsideThickness: 0.35,    // Refração traseira calibrada

    // Superfície & Especularidade
    roughness: 0.0,             // Zero rugosidade (vidro cristalino perfeitamente polido)
    clearcoat: 0.5,             // Camada de verniz reluzente para destaques de borda
    clearcoatRoughness: 0.05,

    // Dispersão Prismática & Distorção
    chromaticAberration: 0.006, // Dispersão cromática sutil nas arestas lapidadas
    anisotropicBlur: 0,         // Zero blur — visual 100% limpo e nítido
    distortion: 0,
    distortionScale: 0,
    temporalDistortion: 0,

    // Atenuação (100% Incolor e Cristalino)
    attenuationColor: "#ffffff",
    attenuationDistance: 25,
    color: "#ffffff",

    // Destaque de Reflexão das Facetas
    envMapIntensity: 0.85,      // Reflexões vívidas do ambiente de estúdio

    // Performance (FBO Render Target)
    resolution: 512,
    samples: 6,
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
