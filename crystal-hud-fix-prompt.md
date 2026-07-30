# Task: Fix Crystal HUD — anchor annotations to the object, not the viewport

## Context

This is a React Three Fiber + drei project (`@react-three/fiber`, `@react-three/drei`, `three`). The relevant files are:

- `src/scenes/Crystal/CrystalCarousel.jsx` — Canvas setup, lighting, particles, nav buttons.
- `src/scenes/Crystal/components/CrystalMesh.jsx` — the crystal mesh, materials, mouse-deform shader, and the current HUD (`<Html>` block at the bottom of the component).
- `src/scenes/Crystal/config/crystalConfig.js` — material/lighting/hover config.

Reference design target: the igloo.inc portfolio crystal viewer (Pudgy Penguins parent company site). Two screenshots are attached: `current.png` (our current result) and `reference.png` (target look).

## Diagnosis (already confirmed)

Current behavior in `CrystalMesh.jsx`:
- The `<Html position={[0,0,0]} center>` block renders one fixed-size box (`440px x 320px`) with `position: absolute` text corners (top-left, top-right, bottom-right) inside it.
- These text blocks are NOT connected to any real point on the crystal's surface. The little diagonal line under "PROJETO_01" is a static decorative SVG polyline, not a leader line computed from geometry.
- Visually this reads as "UI pinned to the four corners of the screen," disconnected from the object.

Target behavior (reference image):
- Each HUD label (`PORTFOLIO_CO_01 / PUDGY PENGUINS`, `TEMP xx.xx`, `D 01.02.2020 / CLICK TO EXPLORE`) has a **thin leader line that visually originates from a specific point on the crystal's surface** and travels outward to the text. When the crystal rotates/floats, the leader line's anchor point moves with it.
- There's a scattering of small, short "tick" marks (2–6px line fragments) loosely orbiting the crystal, like a scanning/measurement effect. These fade in/out subtly and don't need to be physically meaningful — just visually anchored near the crystal's silhouette, not the viewport corners.
- No decorative corner brackets pinned to the four corners of the screen — remove that pattern entirely.

## What to implement

1. **Define 3–4 anchor points in local space** on (or just outside) the crystal geometry — e.g. hardcoded `Vector3` offsets relative to the mesh's bounding box (top area, right side, bottom area), not derived from actual mesh vertices (approximate is fine, doesn't need to be pixel-perfect to the mesh surface).

2. **Project each anchor point to screen space every frame** using `camera.project()` (or `useThree` + `Vector3.project(camera)` inside `useFrame`), converting NDC to pixel coordinates based on canvas size. Store each label's screen `{x, y}` in state/ref and update a small floating `<Html>` (or a plain absolutely-positioned `<div>` layered outside the Canvas, driven by the same projected coordinates) per label.

3. **Draw a leader line per label** from the anchor's projected screen point to the label's text position, using an SVG `<line>` or `<path>` layered in a full-viewport `<svg>` overlay (not baked per-label), recalculated each frame alongside the label positions.

4. **Replace the current static "corner-bracket at viewport edges" pattern** — delete the four-corner decorative brackets pinned to the screen edges. Keep only: the object-anchored labels + leader lines described above, plus the scattered tick marks near the crystal's silhouette.

5. **Ticks/scan marks**: generate ~15–20 short line segments with randomized position (within a radius around the crystal's projected screen center), randomized rotation, and randomized opacity (0.2–0.6). Re-randomize a subset on an interval (~2–4s) or animate opacity with a slow sine wave so they feel alive, not static.

6. **Performance**: avoid re-creating DOM nodes every frame — update `style.transform` (translate) on existing refs inside `useFrame`, don't trigger React re-renders for position updates.

7. Keep all existing crystal material/shader/hover-deform logic in `CrystalMesh.jsx` untouched — this task is only about the HUD/annotation layer.

## Acceptance criteria

- Rotating or floating the crystal visibly moves the label anchor points and their leader lines in sync with the object (open dev tools, slow down `groupRef.current.rotation.y` temporarily to verify if needed).
- No text or bracket element is hard-pinned to the four corners of the viewport.
- Visual result should closely match `reference.png`: labels near the object with angled leader lines pointing at it, small tick marks scattered around it, no viewport-corner brackets.
- Existing nav arrows (prev/next) and crystal interactivity (hover-deform, click) keep working.

## Deliverable

Modify the existing components (don't scaffold a new library/pattern unless necessary). If you introduce a new component (e.g. `CrystalHUD.jsx`), place it in `src/scenes/Crystal/components/` and wire it into `CrystalMesh.jsx` or `CrystalCarousel.jsx` as makes most sense given the projection math needs access to `camera` and `size` from `useThree`.

After implementing, run the dev server and describe/screenshot the result so it can be visually compared against `reference.png`.
