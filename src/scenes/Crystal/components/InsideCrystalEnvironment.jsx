// InsideCrystalEnvironment.jsx
// Background animado "Mesh drift" como overlay HTML (WebGL1 puro)
// Renderiza como fullscreen canvas dentro do cristal

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VERT = `attribute vec2 a_position;
void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene,u_shape,u_surface,u_finish,u_transform,u_space,u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x,31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
float hash21(vec2 p){
#ifndef GL_FRAGMENT_PRECISION_HIGH
p=mod(p,31.0);
#endif
p=fract(p*vec2(234.34,435.345));
p+=dot(p,p+34.23);
return fract(p.x*p.y);
}
float grainHash(vec2 p){
vec3 p3=fract(vec3(p.xyx)*0.1031);
p3+=dot(p3,p3.yzx+33.33);
return fract((p3.x+p3.y)*p3.z);
}
float noise(vec2 p){
vec2 i=floor(p),f=fract(p);
vec2 u=f*f*(3.0-2.0*f);
return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),
mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
float v=0.0,a=0.5;
for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.0,9.2);a*=0.5;}
return v;
}
vec3 srgbToLinear(vec3 c){return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(0.04045,c));}
vec3 linearToSrgb(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0)),vec3(1.0/2.4))-0.055,step(0.0031308,c));}
vec3 linToOklab(vec3 c){
float l=0.4122214708*c.r+0.5363325363*c.g+0.0514459929*c.b;
float m=0.2119034982*c.r+0.6806995451*c.g+0.1073969566*c.b;
float s=0.0883024619*c.r+0.2817188376*c.g+0.6299787005*c.b;
l=pow(max(l,0.0),1.0/3.0);m=pow(max(m,0.0),1.0/3.0);s=pow(max(s,0.0),1.0/3.0);
return vec3(0.2104542553*l+0.7936177850*m-0.0040720468*s,
1.9779984951*l-2.4285922050*m+0.4505937099*s,
0.0259040371*l+0.7827717662*m-0.8086757660*s);
}
vec3 oklabToLin(vec3 c){
float l=c.x+0.3963377774*c.y+0.2158037573*c.z;
float m=c.x-0.1055613458*c.y-0.0638541728*c.z;
float s=c.x-0.0894841775*c.y-1.2914855480*c.z;
l=l*l*l;m=m*m*m;s=s*s*s;
return vec3(4.0767416621*l-3.3077115913*m+0.2309699292*s,
-1.2684380046*l+2.6097574011*m-0.3413193965*s,
-0.0041960863*l-0.7034186147*m+1.7076147010*s);
}
vec3 mixColour(vec3 a,vec3 b,float t){
if(u_oklab>0.5){vec3 la=linToOklab(srgbToLinear(a)),lb=linToOklab(srgbToLinear(b));
return clamp(linearToSrgb(oklabToLin(mix(la,lb,t))),0.0,1.0);}
return mix(a,b,t);
}
vec3 palette(float x){
float n=max(u_colorCount-1.0,1.0),f=clamp(x,0.0,1.0)*n;
vec3 col=u_colors[0];
for(int i=0;i<7;i++){if(float(i)<n)col=mixColour(col,u_colors[i+1],smoothstep(0.0,1.0,clamp(f-float(i),0.0,1.0)));}
return col;
}
vec3 hueRotate(vec3 col,float a){
const mat3 Y=mat3(0.299,0.596,0.211,0.587,-0.274,-0.523,0.114,-0.322,0.312);
const mat3 R=mat3(1.0,1.0,1.0,0.956,-0.272,-1.106,0.621,-0.647,1.703);
vec3 y=Y*col;float c=cos(a),s=sin(a);
return R*vec3(y.x,y.y*c-y.z*s,y.y*s+y.z*c);
}
vec3 shade(vec2 uv,vec2 p,float t){
vec3 acc=u_colors[0]*0.15;float tot=0.15;
for(int i=0;i<8;i++){if(float(i)>=u_colorCount)break;
float fi=float(i);
vec2 c=vec2(sin(t*(0.21+fi*0.071)+fi*2.4+u_seed),cos(t*(0.17+fi*0.093)+fi*1.7))*(0.45+u_intensity*0.35);
float w=exp(-dot(p-c,p-c)*6.0);acc+=u_colors[i]*w;tot+=w;}
return acc/tot;
}
void main(){
vec2 uv=gl_FragCoord.xy/u_resolution.xy;
vec2 suv=uv;
vec2 p=(gl_FragCoord.xy-0.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
uv=p*min(u_resolution.x,u_resolution.y)/u_resolution.xy+0.5;
p*=u_scale;
if(abs(u_rotate)>0.0001){float c=cos(u_rotate),s=sin(u_rotate);p=mat2(c,-s,s,c)*p;}
p+=u_offset;
if(u_drift>0.0001)p+=u_drift*vec2(sin(u_time*0.31),cos(u_time*0.23));
if(u_warp>0.0)p+=u_warp*(vec2(fbm(p*u_detail+u_seed),fbm(p*u_detail+vec2(5.2,1.3)))-0.5);
vec3 col;
if(u_blur>0.0){
float e=u_blur,pe=e*u_scale;
vec2 uvE=vec2(e)*min(u_resolution.x,u_resolution.y)/u_resolution.xy;
col=shade(uv,p,u_time)*0.36;
col+=shade(uv+vec2(uvE.x,0),p+vec2(pe,0),u_time)*0.16;
col+=shade(uv-vec2(uvE.x,0),p-vec2(pe,0),u_time)*0.16;
col+=shade(uv+vec2(0,uvE.y),p+vec2(0,pe),u_time)*0.16;
col+=shade(uv-vec2(0,uvE.y),p-vec2(0,pe),u_time)*0.16;
}else col=shade(uv,p,u_time);
if(abs(u_contrast-1.0)>0.0001)col=(col-0.5)*u_contrast+0.5;
if(abs(u_saturation-1.0)>0.0001){float l=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(l),col,u_saturation);}
if(abs(u_hue)>0.0001)col=hueRotate(col,u_hue);
if(abs(u_brightness)>0.0001)col+=u_brightness;
if(u_vignette>0.0001){float vd=length(suv-0.5)*1.41421356;col*=1.0-u_vignette*smoothstep(0.35,1.0,vd);}
if(u_grain>0.0001)col+=(grainHash(gl_FragCoord.xy+vec2(u_seed*17.0,u_seed*31.0))-0.5)*u_grain;
gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

const COLORS = (() => {
  const c = ["#031C26","#1B6CA8","#5AD2F4","#EAF9FF",
             "#031C26","#1B6CA8","#5AD2F4","#EAF9FF"].map(hexToRgb);
  const a = new Float32Array(24);
  c.forEach((v, i) => { a[i*3]=v[0]; a[i*3+1]=v[1]; a[i*3+2]=v[2]; });
  return a;
})();

const W = 512, H = 256;

// Module-level state — outside React render cycle
let shaderState = null;

function initShader() {
  if (shaderState) return shaderState;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;

  const g = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!g) return null;

  function compile(src, type) {
    const s = g.createShader(type);
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
      console.error("Shader:", g.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(VERT, g.VERTEX_SHADER);
  const fs = compile(FRAG, g.FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const prog = g.createProgram();
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  g.useProgram(prog);

  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), g.STATIC_DRAW);
  const aPos = g.getAttribLocation(prog, "a_position");
  g.enableVertexAttribArray(aPos);
  g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

  const u = {};
  ["u_colors[0]","u_scene","u_shape","u_surface",
   "u_finish","u_transform","u_space","u_cursor"].forEach((n) => {
    u[n] = g.getUniformLocation(prog, n);
  });

  g.uniform3fv(u["u_colors[0]"], COLORS);
  g.viewport(0, 0, W, H);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  shaderState = { gl: g, u, tex };
  return shaderState;
}

export default function InsideCrystalEnvironment() {
  const [texture] = useState(() => {
    const s = initShader();
    return s ? s.tex : null;
  });
  const meshRef = useRef();

  useEffect(() => () => {
    if (shaderState) {
      shaderState.tex.dispose();
      shaderState = null;
    }
  }, []);

  useFrame((_, delta) => {
    const s = shaderState;
    if (!s) return;

    const t = performance.now() / 1000;
    s.gl.uniform4f(s.u.u_scene, W, H, t * -1.37, 4.0);
    s.gl.uniform4f(s.u.u_shape, 1.30, 0.56, 0.67, 0.19);
    s.gl.uniform4f(s.u.u_surface, 2.02, 1.17, 0.00, 1.00);
    s.gl.uniform4f(s.u.u_finish, 0.00, 0.15, 0.007, 0.10);
    s.gl.uniform4f(s.u.u_transform, 5069.0, 2.72, 0.15, 0.0);
    s.gl.uniform4f(s.u.u_space, 0.09, 0.15, 0.0, 0.0);
    s.gl.uniform4f(s.u.u_cursor, 0.0, 2.0, 0.65, 0.46);

    s.gl.drawArrays(s.gl.TRIANGLES, 0, 3);
    s.tex.needsUpdate = true;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.003;
      meshRef.current.rotation.x = Math.sin(t * 0.001) * 0.05;
    }
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[45, 64, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}
