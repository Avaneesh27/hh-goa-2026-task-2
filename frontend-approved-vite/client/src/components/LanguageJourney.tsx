/**
 * LanguageJourney — Virtual Camera Scroll-driven Animation
 *
 * Architecture:
 * - `.lj-viewport` is position:absolute inset:0 on the black panel.
 * - `.lj-camera-canvas` is positioned at top:50% left:50% — its origin IS the panel center.
 * - Each language landmark is placed at (world.x, world.y) relative to the canvas origin.
 * - transform: translate(-50%, -50%) centers the landmark on its coordinate point.
 * - The camera pans by applying (-activeX, -activeY) as the canvas translateX/Y,
 *   which brings the active language's coordinate exactly to (0,0) = panel center.
 *
 * Languages are alternated left/right with a small x-offset (±80px) to form a gentle
 * S-path. The y-spacing is 380px between each language.
 *
 * Final Unity state fades in at scroll 90%+.
 */
import { motion, MotionValue, useTransform } from "framer-motion";
import { Languages } from "lucide-react";

interface LanguageJourneyProps {
  progress: MotionValue<number>;
}

interface LanguageDef {
  id: string;
  native: string;
  english: string;
  wx: number;  // x offset from center-line (negative = left side, positive = right side)
  wy: number;  // y position in world coords (0 = top)
  cp: number;  // centerProgress: scroll value where this language is centered
}

// wy is spaced 310px apart. wx alternates ±75px from the path's center spine.
// The panel's center is the camera's (0,0). When cp is active, camera translates to (-wx, -wy).
const LANGS: LanguageDef[] = [
  { id: "en", native: "English",    english: "ENGLISH",   wx:   0, wy:    0, cp: 0.04 },
  { id: "hi", native: "हिन्दी",    english: "HINDI",     wx:  70, wy:  310, cp: 0.11 },
  { id: "mr", native: "मराठी",     english: "MARATHI",   wx: -70, wy:  620, cp: 0.18 },
  { id: "bn", native: "বাংলা",    english: "BENGALI",   wx:  70, wy:  930, cp: 0.25 },
  { id: "ta", native: "தமிழ்",    english: "TAMIL",     wx: -70, wy: 1240, cp: 0.32 },
  { id: "te", native: "తెలుగు",   english: "TELUGU",    wx:  70, wy: 1550, cp: 0.39 },
  { id: "gu", native: "ગુજરાતી",  english: "GUJARATI",  wx: -70, wy: 1860, cp: 0.46 },
  { id: "kn", native: "ಕನ್ನಡ",    english: "KANNADA",   wx:  70, wy: 2170, cp: 0.53 },
  { id: "ml", native: "മലയാളം",   english: "MALAYALAM", wx: -70, wy: 2480, cp: 0.60 },
  { id: "pa", native: "ਪੰਜਾਬੀ",   english: "PUNJABI",   wx:  70, wy: 2790, cp: 0.67 },
  { id: "or", native: "ଓଡ଼ିଆ",    english: "ODIA",      wx: -70, wy: 3100, cp: 0.74 },
  { id: "as", native: "অসমীয়া",  english: "ASSAMESE",  wx:  70, wy: 3410, cp: 0.81 },
  { id: "ur", native: "اردو",     english: "URDU",      wx: -70, wy: 3720, cp: 0.88 },
];

const UNITY_WY = 4300;

// Build the SVG path through all language nodes
function buildPath() {
  const pts = LANGS;
  let d = `M ${pts[0].wx} ${pts[0].wy}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const midY = (prev.wy + curr.wy) / 2;
    // Smooth cubic bezier: control points at mid-y
    d += ` C ${prev.wx} ${midY}, ${curr.wx} ${midY}, ${curr.wx} ${curr.wy}`;
  }
  return d;
}
const PATH_D = buildPath();

// Build arrays for useTransform scroll timeline
const CP_VALS  = LANGS.map((l) => l.cp);
const CAM_X    = LANGS.map((l) => -l.wx);
const CAM_Y    = LANGS.map((l) => -l.wy);

export default function LanguageJourney({ progress }: LanguageJourneyProps) {

  // Camera pans: translate canvas so active language is at (0,0) = panel center
  const cameraX = useTransform(progress, CP_VALS, CAM_X);
  const cameraY = useTransform(progress, CP_VALS, CAM_Y);

  // Cross-fade journey vs unity (Urdu is last at cp:0.88, unity starts at 0.92)
  const journeyOpacity = useTransform(progress, [0.90, 0.95], [1, 0]);
  const unityOpacity   = useTransform(progress, [0.93, 0.98], [0, 1]);
  const unityScale     = useTransform(progress, [0.93, 0.99], [0.93, 1]);

  // Camera also needs to travel to unity position
  const fullCameraX = useTransform(
    progress,
    [...CP_VALS, 0.95, 1.0],
    [...CAM_X, 0, 0]
  );
  const fullCameraY = useTransform(
    progress,
    [...CP_VALS, 0.95, 1.0],
    [...CAM_Y, -UNITY_WY, -UNITY_WY]
  );

  // Total world height for SVG
  const totalH = LANGS[LANGS.length - 1].wy + 400;

  return (
    <div className="lj-viewport" aria-hidden="true">

      {/* ── Moving Camera Canvas ──
          Origin sits at PANEL CENTER via top:50% left:50%.
          translateX/Y moves the world beneath it. */}
      <motion.div
        className="lj-camera-canvas"
        style={{ x: fullCameraX, y: fullCameraY }}
      >

        {/* 1. Journey Layer (visible 0→88%) */}
        <motion.div className="lj-journey-layer" style={{ opacity: journeyOpacity }}>

          {/* Subtle S-curve path SVG */}
          <svg
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 0,          // zero-width — the viewBox handles sizing
              height: 0,
              overflow: "visible",
              pointerEvents: "none",
            }}
            viewBox={`-250 ${LANGS[0].wy - 60} 500 ${totalH + 120}`}
            fill="none"
          >
            <defs>
              <linearGradient id="lj-path-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ff5f45" stopOpacity="0.55" />
                <stop offset="50%"  stopColor="#f4b942" stopOpacity="0.6"  />
                <stop offset="100%" stopColor="#ff5f45" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* Ghost guide line */}
            <path
              d={PATH_D}
              stroke="rgba(255,253,247,0.10)"
              strokeWidth="1.5"
              strokeDasharray="5 6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Glowing active line */}
            <path
              d={PATH_D}
              stroke="url(#lj-path-grad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Language Landmarks */}
          {LANGS.map((lang) => (
            <LangMark key={lang.id} lang={lang} progress={progress} />
          ))}

        </motion.div>

        {/* 2. Unity State (visible 89→100%) */}
        <motion.div
          className="lj-unity-container"
          style={{
            top: UNITY_WY,
            opacity: unityOpacity,
            scale: unityScale,
          }}
        >
          <svg
            className="lj-unity-svg"
            viewBox="-200 0 400 140"
            fill="none"
          >
            <defs>
              <radialGradient id="lj-beacon-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#ff5f45" stopOpacity="0.9" />
                <stop offset="60%"  stopColor="#ff5f45" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff5f45" stopOpacity="0"   />
              </radialGradient>
            </defs>
            <path d="M -145 10 C -90 55, -35 95, 0 120" stroke="rgba(255,95,69,0.4)"   strokeWidth="1.2" strokeDasharray="3 4" />
            <path d="M  -75 10 C -42 55, -14 95, 0 120" stroke="rgba(244,185,66,0.4)"  strokeWidth="1.2" strokeDasharray="3 4" />
            <path d="M    0 10 L   0 120"                stroke="rgba(255,253,247,0.45)" strokeWidth="1.2" />
            <path d="M   75 10 C  42 55,  14 95, 0 120" stroke="rgba(244,185,66,0.4)"  strokeWidth="1.2" strokeDasharray="3 4" />
            <path d="M  145 10 C  90 55,  35 95, 0 120" stroke="rgba(255,95,69,0.4)"   strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx="0" cy="120" r="20" fill="url(#lj-beacon-glow)" />
            <circle cx="0" cy="120" r="5"  fill="#ff5f45" />
            <circle cx="0" cy="120" r="2"  fill="#fffdf7" />
          </svg>

          <div className="lj-unity-scripts">
            {["हिन्दी","मराठी","বাংলা","தமிழ்","తెలుగు","ગુજરાતી","ಕನ್ನಡ","മലയാളം","ਪੰਜਾਬੀ","ଓଡ଼ିଆ","অসমীয়া","اردو","English"].map((s) => (
              <span key={s} className="lj-unity-tag">{s}</span>
            ))}
          </div>

          <div className="lj-unity-line" />

          <div className="lj-unity-statement">
            <h3 className="lj-unity-headline">
              MANY LANGUAGES.<br />
              <span className="lj-unity-accent">ONE SHARED VOICE.</span>
            </h3>
            <p className="lj-unity-subtext">
              India speaks in many ways.<br />
              We listen to all of them.
            </p>
          </div>
        </motion.div>

      </motion.div>

      {/* Edge vignettes */}
      <div className="lj-vignette-top" />
      <div className="lj-vignette-bottom" />

      {/* Persistent badge */}
      <div className="lj-fixed-badge">
        <Languages size={14} />
        <span>Language is context</span>
      </div>
    </div>
  );
}

/**
 * Single language landmark — always centered on its world coordinate (wx, wy).
 *
 * Positioning:
 * - `left: wx` and `top: wy` place the element's origin at the world point.
 * - `transform: translate(-50%, -50%)` (via CSS .lj-landmark) centers it on that point.
 * - framer-motion `scale` and `opacity` animate based on distance from camera focal point.
 */
function LangMark({
  lang,
  progress,
}: {
  lang: LanguageDef;
  progress: MotionValue<number>;
}) {
  const p = lang.cp;
  const d = 0.09;

  const scale = useTransform(
    progress,
    [p - d * 1.6, p - d * 0.4, p, p + d * 0.4, p + d * 1.6],
    [0.82,          1.05,         1.32, 1.05,         0.82]
  );

  const opacity = useTransform(
    progress,
    [p - d * 1.6, p - d * 0.5, p, p + d * 0.5, p + d * 1.6],
    [0.28,          0.68,         1.0,  0.68,         0.28]
  );

  const nodeGlow = useTransform(
    progress,
    [p - d * 0.5, p, p + d * 0.5],
    [0.35,         1.0, 0.35]
  );

  return (
    <motion.div
      className="lj-landmark"
      style={{
        // World position — CSS .lj-landmark has translate(-50%,-50%) to center on this point
        left: lang.wx,
        top:  lang.wy,
        scale,
        opacity,
      }}
    >
      {/* Orange beacon node */}
      <motion.div
        style={{
          position: "relative",
          width: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          opacity: nodeGlow,
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(255,95,69,0.35)",
            filter: "blur(4px)",
          }}
        />
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ff5f45",
            boxShadow: "0 0 10px rgba(255,95,69,0.95)",
            position: "relative",
            zIndex: 1,
          }}
        />
      </motion.div>

      {/* Text */}
      <div className="lj-landmark-text">
        <span className="lj-lang-native">{lang.native}</span>
        <span className="lj-lang-english">{lang.english}</span>
      </div>
    </motion.div>
  );
}
