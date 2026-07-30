// ViewfinderFrame.jsx
// Overlay HTML em screen-space fixo (não gira com o modelo 3D)

import React from "react";

export default function ViewfinderFrame({ label, sublabel, onExplore, isHovered }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: "8%",
        pointerEvents: "none",
        zIndex: 10,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* 4 Cantos de Mira (Reticle Frame) */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "28px",
          height: "28px",
          borderLeft: "1.5px solid rgba(255,255,255,0.85)",
          borderTop: "1.5px solid rgba(255,255,255,0.85)",
          boxShadow: isHovered ? "0 0 12px rgba(255,255,255,0.9)" : "none",
          transition: "all 0.3s ease",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "28px",
          height: "28px",
          borderRight: "1.5px solid rgba(255,255,255,0.85)",
          borderTop: "1.5px solid rgba(255,255,255,0.85)",
          boxShadow: isHovered ? "0 0 12px rgba(255,255,255,0.9)" : "none",
          transition: "all 0.3s ease",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "28px",
          height: "28px",
          borderLeft: "1.5px solid rgba(255,255,255,0.85)",
          borderBottom: "1.5px solid rgba(255,255,255,0.85)",
          boxShadow: isHovered ? "0 0 12px rgba(255,255,255,0.9)" : "none",
          transition: "all 0.3s ease",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "28px",
          height: "28px",
          borderRight: "1.5px solid rgba(255,255,255,0.85)",
          borderBottom: "1.5px solid rgba(255,255,255,0.85)",
          boxShadow: isHovered ? "0 0 12px rgba(255,255,255,0.9)" : "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Rótulos e Telemetria HUD (Courier New estilo igloo.inc) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          fontFamily: "'Courier New', Courier, monospace",
          color: "#ffffff",
          fontSize: "11px",
          letterSpacing: "1px",
          textShadow: "0 0 8px rgba(255,255,255,0.6)",
        }}
      >
        {/* Top-Left: Rótulo do Projeto + Linha Conectora */}
        <div style={{ position: "absolute", top: "10px", left: "10px", textAlign: "left" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", letterSpacing: "1.5px" }}>
            {label || "PORTFOLIO_CO_01"}
          </div>
          <div style={{ opacity: 0.8, fontSize: "10px", marginTop: "2px" }}>
            {sublabel || "PUDGY PENGUINS"}
          </div>
          <svg
            width="80"
            height="40"
            style={{ position: "absolute", top: "28px", left: "0", overflow: "visible" }}
          >
            <polyline
              points="0,0 50,0 75,25"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Top-Right: Telemetria */}
        <div style={{ position: "absolute", top: "10px", right: "10px", textAlign: "right" }}>
          <div style={{ opacity: 0.85 }}>TEMP 35.36</div>
          <div style={{ opacity: 0.65, fontSize: "10px", marginTop: "2px" }}>+01.87</div>
        </div>

        {/* Bottom-Right: Data + Botão de Ação */}
        <div style={{ position: "absolute", bottom: "10px", right: "10px", textAlign: "right" }}>
          <div style={{ opacity: 0.75, fontSize: "10px" }}>D 01.02.2020</div>
          <div
            onClick={onExplore}
            style={{
              fontWeight: "bold",
              fontSize: "11px",
              borderBottom: "1px solid rgba(255,255,255,0.85)",
              display: "inline-block",
              marginTop: "4px",
              pointerEvents: "auto",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            CLICK TO EXPLORE
          </div>
        </div>
      </div>
    </div>
  );
}
