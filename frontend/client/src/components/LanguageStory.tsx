/**
 * LanguageStory — Entrance animation + full-viewport language journey.
 *
 * === SEQUENCE ===
 * 0.00–0.10  Stage slides IN from the left (contained in ls-stage-wrap).
 * 0.10–0.22  Editorial panel covers the full stage width.
 * 0.22–0.46  Editorial panel collapses away; contained black panel grows to fill stage.
 * 0.46–0.56  A TRUE FULL-SCREEN fixed overlay (position:fixed; inset:0) fades in,
 *            completely covering the viewport edge-to-edge.
 * 0.56–1.00  Scroll-driven Language Journey runs inside the full-viewport overlay.
 */
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import LanguageJourney from "./LanguageJourney";

const restingLanguages = [
  "हिंदी", "मराठी", "বাংলা", "தமிழ்",
  "తెలుగు", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം",
];

export default function LanguageStory() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 75,
    damping: 24,
    mass: 0.2,
    restDelta: 0.0001,
  });

  // ── PHASE 0: Whole stage slides in from the left ──────────────────────────
  const stageX = useTransform(smooth, [0.0, 0.10], ["-110%", "0%"]);

  // ── PHASE 1→2: Editorial collapses; contained black panel grows ───────────
  const editorialWidth   = useTransform(smooth, [0.22, 0.44], ["100%", "0%"]);
  const editorialOpacity = useTransform(smooth, [0.22, 0.38], [1, 0]);
  const blackWidth       = useTransform(smooth, [0.22, 0.46], ["0%", "100%"]);

  // ── PHASE 3: TRUE FULL-SCREEN overlay fades IN then OUT ──────────────────
  // Fades in at 44-57%, stays fully visible through the journey, then
  // FADES OUT at 97-100% so the voice station below is fully unblocked.
  const overlayOpacity = useTransform(
    smooth,
    [0.44, 0.57, 0.97, 1.0],
    [0,    1,    1,    0]
  );

  // Enable pointer-events ONLY while the overlay is meaningfully visible.
  // This turns OFF when smooth > 0.97 (fading out) or before it fades in.
  const [overlayActive, setOverlayActive] = useState(false);
  useMotionValueEvent(smooth, "change", (v) => {
    setOverlayActive(v > 0.42 && v < 0.975);
  });

  // ── PHASE 4: Journey scroll (0→1 maps to smooth 0.56→1.0) ────────────────
  const journeyProgress = useTransform(smooth, [0.56, 1.0], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="ls-section"
      id="languages"
      aria-labelledby="language-title"
    >
      {/* ── Sticky frame that holds the entrance animation ── */}
      <div className="ls-sticky">
        <div className="ls-stage-wrap">
          <motion.div className="ls-stage-grid" style={{ x: stageX }}>

            {/* Contained black panel (entrance phase only) */}
            <motion.div
              className="ls-art-panel"
              style={{ width: blackWidth }}
            >
              {/* This panel is just a black placeholder during entrance.
                  The real animation lives in the full-screen overlay below. */}
            </motion.div>

            {/* Editorial text (collapses away) */}
            <motion.div
              className="ls-copy-block"
              style={{ width: editorialWidth, opacity: editorialOpacity }}
            >
              <div className="ls-resting-view">
                <div className="eyebrow">
                  <span className="eyebrow-number">14</span>
                  <span>Indic language paths</span>
                </div>
                <h2 id="language-title" className="ls-resting-title">
                  Keep the way people actually speak.
                </h2>
                <p className="ls-resting-lede">
                  A query can be Marathi, Hindi, Tamil, English, or naturally
                  code-mixed. The product preserves that intent before it
                  searches—then shows the evidence in a form a user can inspect.
                </p>
                <div className="language-codes" aria-label="Example supported languages">
                  {restingLanguages.map((lang) => (
                    <span key={lang}>{lang}</span>
                  ))}
                </div>
                <a className="text-link" href="#voice-station">
                  Choose an input language <ArrowDownRight size={17} />
                </a>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* ── TRUE FULL-SCREEN overlay: position:fixed; inset:0 ── */}
      {/* Fades in at 44-57%, covers the ENTIRE viewport, no margins. */}
      <motion.div
        className="ls-fullscreen-overlay"
        style={{
          opacity: overlayOpacity,
          pointerEvents: overlayActive ? "auto" : "none",
        }}
        aria-hidden="true"
      >
        <LanguageJourney progress={journeyProgress} />
      </motion.div>
    </section>
  );
}
