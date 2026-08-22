/**
 * PipelineCards — Scroll-driven 3D card storytelling for the Voice RAG pipeline.
 * Replaces the four-column path-section with a sticky scroll stage where
 * each pipeline card moves through 3D space as the user scrolls.
 *
 * Design language: paper/cream, ink navy, coral accent — matches existing site.
 * Uses framer-motion useScroll + useTransform for performant scroll-driven animation.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { Mic, Search, FileSearch, ShieldCheck } from "lucide-react";

// ─── Scroll-mapped 3D transform helper ───────────────────────────────────────

function useCardTransform(
  smooth: MotionValue<number>,
  enterAt: number,
  peakAt: number,
  exitAt: number
) {
  // z: card starts far back (–480), comes to 0 at peak, goes back to –300 on exit
  const z = useTransform(
    smooth,
    [enterAt - 0.01, enterAt, peakAt, exitAt, exitAt + 0.01],
    [-480, -320, 0, -300, -300]
  );
  const scale = useTransform(
    smooth,
    [enterAt - 0.01, enterAt, peakAt, exitAt, exitAt + 0.01],
    [0.74, 0.80, 1, 0.86, 0.86]
  );
  const rotateX = useTransform(
    smooth,
    [enterAt, peakAt, exitAt],
    [8, 0, -5]
  );
  const rotateY = useTransform(
    smooth,
    [enterAt, peakAt, exitAt],
    [-3, 0, 3]
  );
  const y = useTransform(
    smooth,
    [enterAt, peakAt, exitAt],
    [50, 0, -70]
  );
  const opacity = useTransform(
    smooth,
    [enterAt - 0.01, enterAt, peakAt * 0.5 + exitAt * 0.5, exitAt],
    [0, 0.6, 1, 0.4]
  );
  // z-index: active card sits above the rest
  const zIndex = useTransform(smooth, [enterAt, peakAt, exitAt], [1, 10, 2]);

  return { z, scale, rotateX, rotateY, y, opacity, zIndex };
}

// ─── Individual card visuals ──────────────────────────────────────────────────

function Card01() {
  return (
    <div className="pc-card-inner">
      <div className="pc-card-step">01 / SPEAK OR TYPE</div>
      <div className="pc-card-icon coral-icon"><Mic size={22} strokeWidth={1.5} /></div>
      <div className="pc-card-body">
        <h3 className="pc-card-headline">You ask.<br />We keep your words intact.</h3>
        <div className="pc-voice-demo">
          <div className="pc-mic-ring">
            <span className="pc-mic-dot" />
            <span className="pc-ring r1" />
            <span className="pc-ring r2" />
          </div>
          <div className="pc-query-display">
            <span className="pc-query-lang">HI + EN</span>
            <p className="pc-query-text">"kal college mein<br />lecture hai?"</p>
            <div className="pc-lang-tags">
              <span className="pc-tag">Hindi</span>
              <span className="pc-tag">English</span>
            </div>
          </div>
        </div>
        <div className="pc-flow-label">
          <span>VOICE</span>
          <span className="pc-arrow">→</span>
          <span className="pc-highlight">PRESERVED QUERY</span>
        </div>
      </div>
    </div>
  );
}

function Card02({ progress }: { progress: MotionValue<number> }) {
  // Docs move toward the query as this card becomes active (0.25 → 0.5)
  const docY1 = useTransform(progress, [0.22, 0.42], [0, -14]);
  const docY2 = useTransform(progress, [0.22, 0.42], [0, -10]);
  const docY3 = useTransform(progress, [0.22, 0.42], [0, -18]);
  const docOpacity1 = useTransform(progress, [0.28, 0.46], [1, 0.22]);
  const docOpacity2 = useTransform(progress, [0.28, 0.46], [1, 0.22]);

  return (
    <div className="pc-card-inner">
      <div className="pc-card-step mango-step-label">02 / RETRIEVE</div>
      <div className="pc-card-icon mango-icon"><Search size={22} strokeWidth={1.5} /></div>
      <div className="pc-card-body">
        <h3 className="pc-card-headline">We find<br />what matters.</h3>
        <div className="pc-retrieval-stage">
          <div className="pc-query-chip">"kal college mein lecture hai?"</div>
          <div className="pc-docs-grid">
            <motion.div className="pc-doc irrelevant" style={{ y: docY1, opacity: docOpacity1 }}>
              <span className="pc-doc-lang">EN</span>
              <p>Corporate law basics</p>
            </motion.div>
            <div className="pc-doc relevant">
              <span className="pc-doc-lang">HI</span>
              <p>kal ke lecture ki jankari</p>
              <span className="pc-doc-score">0.91</span>
            </div>
            <motion.div className="pc-doc irrelevant" style={{ y: docY2, opacity: docOpacity2 }}>
              <span className="pc-doc-lang">MR</span>
              <p>शैक्षणिक संस्था</p>
            </motion.div>
            <div className="pc-doc relevant">
              <span className="pc-doc-lang">EN</span>
              <p>college schedule tomorrow</p>
              <span className="pc-doc-score">0.87</span>
            </div>
            <motion.div className="pc-doc fading" style={{ y: docY3, opacity: docOpacity1 }}>
              <span className="pc-doc-lang">TA</span>
              <p>கல்லூரி தகவல்</p>
            </motion.div>
            <div className="pc-doc relevant">
              <span className="pc-doc-lang">HI</span>
              <p>व्याख्यान कार्यक्रम</p>
              <span className="pc-doc-score">0.82</span>
            </div>
          </div>
        </div>
        <div className="pc-flow-label">
          <span>MANY DOCS</span>
          <span className="pc-arrow">→</span>
          <span className="pc-highlight">RELEVANT DOCS</span>
        </div>
      </div>
    </div>
  );
}

function Card03({ progress }: { progress: MotionValue<number> }) {
  const weakScale = useTransform(progress, [0.46, 0.62], [1, 0.82]);
  const weakOpacity = useTransform(progress, [0.46, 0.62], [0.9, 0.18]);
  const weakY = useTransform(progress, [0.46, 0.62], [0, 24]);

  return (
    <div className="pc-card-inner">
      <div className="pc-card-step navy-step-label">03 / INSPECT EVIDENCE</div>
      <div className="pc-card-icon navy-icon"><FileSearch size={22} strokeWidth={1.5} /></div>
      <div className="pc-card-body">
        <h3 className="pc-card-headline">We check<br />the evidence.</h3>
        <div className="pc-evidence-stack">
          <div className="pc-evidence-strong e1">
            <span className="pc-ev-badge">STRONGEST</span>
            <p>"lecture kal subah 10 baje hai"</p>
            <div className="pc-ev-meta"><span>HI</span><span className="pc-ev-bar"><span style={{ width: "91%" }} /></span><span>0.91</span></div>
          </div>
          <div className="pc-evidence-strong e2">
            <span className="pc-ev-badge">STRONG</span>
            <p>"Tomorrow's lecture is confirmed at 10am"</p>
            <div className="pc-ev-meta"><span>EN</span><span className="pc-ev-bar"><span style={{ width: "87%" }} /></span><span>0.87</span></div>
          </div>
          <motion.div
            className="pc-evidence-weak"
            style={{ scale: weakScale, opacity: weakOpacity, y: weakY }}
          >
            <span className="pc-ev-weak-label">DUPLICATE — FILTERED</span>
            <p>व्याख्यान कार्यक्रम…</p>
          </motion.div>
        </div>
        <div className="pc-filter-count">
          <span className="pc-count-item"><span>5</span> sources</span>
          <span className="pc-arrow-sm">→</span>
          <span className="pc-count-item"><span>3</span> relevant</span>
          <span className="pc-arrow-sm">→</span>
          <span className="pc-count-item selected"><span>2</span> strongest</span>
        </div>
      </div>
    </div>
  );
}

function Card04() {
  return (
    <div className="pc-card-inner">
      <div className="pc-card-step leaf-step-label">04 / ANSWER</div>
      <div className="pc-card-icon leaf-icon"><ShieldCheck size={22} strokeWidth={1.5} /></div>
      <div className="pc-card-body">
        <h3 className="pc-card-headline">Answer only<br />when supported.</h3>
        <div className="pc-answer-stage">
          <div className="pc-evidence-sources">
            <div className="pc-src-chip">
              <span className="pc-src-dot coral" />
              <p>"lecture kal subah 10 baje hai"</p>
            </div>
            <div className="pc-src-chip">
              <span className="pc-src-dot mango" />
              <p>"Tomorrow confirmed at 10am"</p>
            </div>
            <div className="pc-connector-lines" aria-hidden="true">
              <svg viewBox="0 0 120 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 14 C 40 14 80 38 120 38" stroke="#ff5f45" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" />
                <path d="M 0 42 C 40 42 80 38 120 38" stroke="#f4b942" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" />
              </svg>
            </div>
          </div>
          <div className="pc-answer-card">
            <div className="pc-answer-grounded">
              <ShieldCheck size={11} strokeWidth={2} />
              <span>Source-backed</span>
            </div>
            <p className="pc-answer-text">"Yes, the lecture is scheduled for tomorrow at 10am."</p>
          </div>
          <div className="pc-abstain-alt">
            <span className="pc-abstain-label">if no evidence →</span>
            <span className="pc-abstain-badge">ABSTAIN</span>
            <span className="pc-abstain-sub">No hallucination.</span>
          </div>
        </div>
        <div className="pc-flow-label">
          <span>EVIDENCE</span>
          <span className="pc-arrow">→</span>
          <span className="pc-highlight">GROUNDED ANSWER</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineCards() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Shared ultra-smooth spring physics
  const smooth = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.2,
    restDelta: 0.0001,
  });

  // Each card's scroll window (0→1 mapped to scroll position of this section)
  const c1 = useCardTransform(smooth, 0.00, 0.00, 0.30);
  const c2 = useCardTransform(smooth, 0.18, 0.38, 0.62);
  const c3 = useCardTransform(smooth, 0.46, 0.65, 0.84);
  const c4 = useCardTransform(smooth, 0.70, 0.88, 1.00);

  // Progress bar (which step is active label)
  const stepIndex = useTransform(smooth, [0, 0.3, 0.6, 0.84, 1], [1, 2, 3, 4, 4]);

  return (
    <section
      ref={containerRef}
      className="pc-section"
      id="how-it-works"
      aria-labelledby="pc-title"
    >
      {/* Top transition: solid cream -> blur -> black */}
      <div className="pc-transition-top" aria-hidden="true" />

      {/* Sticky viewport */}
      <div className="pc-sticky">
        {/* Left editorial column — stable */}
        <div className="pc-left-col">
          <span className="pc-eyebrow-num">01—04</span>
          <h2 id="pc-title" className="pc-left-headline">
            A signal becomes<br />a supported answer.
          </h2>
          <p className="pc-left-body">
            Every layer is designed to show its work. The experience is calm on the surface, deterministic underneath.
          </p>
          {/* Step progress indicator */}
          <div className="pc-step-track">
            {[
              { n: "01", label: "Speak" },
              { n: "02", label: "Retrieve" },
              { n: "03", label: "Inspect" },
              { n: "04", label: "Answer" },
            ].map(({ n, label }, i) => (
              <div key={n} className="pc-step-item">
                <div className="pc-step-line" />
                <span className="pc-step-num">{n}</span>
                <span className="pc-step-lbl">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D card stage */}
        <div className="pc-stage" aria-label="Interactive pipeline animation">
          <div className="pc-perspective-wrap">
            {/* Card 01 */}
            <motion.div
              className="pc-card pc-card-01"
              style={{
                z: c1.z,
                scale: c1.scale,
                rotateX: c1.rotateX,
                rotateY: c1.rotateY,
                y: c1.y,
                opacity: c1.opacity,
                zIndex: c1.zIndex,
              }}
              aria-label="Step 1: Speak or Type"
            >
              <Card01 />
            </motion.div>

            {/* Card 02 */}
            <motion.div
              className="pc-card pc-card-02"
              style={{
                z: c2.z,
                scale: c2.scale,
                rotateX: c2.rotateX,
                rotateY: c2.rotateY,
                y: c2.y,
                opacity: c2.opacity,
                zIndex: c2.zIndex,
              }}
              aria-label="Step 2: Retrieve"
            >
              <Card02 progress={scrollYProgress} />
            </motion.div>

            {/* Card 03 */}
            <motion.div
              className="pc-card pc-card-03"
              style={{
                z: c3.z,
                scale: c3.scale,
                rotateX: c3.rotateX,
                rotateY: c3.rotateY,
                y: c3.y,
                opacity: c3.opacity,
                zIndex: c3.zIndex,
              }}
              aria-label="Step 3: Inspect Evidence"
            >
              <Card03 progress={scrollYProgress} />
            </motion.div>

            {/* Card 04 */}
            <motion.div
              className="pc-card pc-card-04"
              style={{
                z: c4.z,
                scale: c4.scale,
                rotateX: c4.rotateX,
                rotateY: c4.rotateY,
                y: c4.y,
                opacity: c4.opacity,
                zIndex: c4.zIndex,
              }}
              aria-label="Step 4: Answer"
            >
              <Card04 />
            </motion.div>
          </div>

          {/* Scroll cue */}
          <div className="pc-scroll-cue" aria-hidden="true">
            <span className="pc-scroll-line" />
            <span>SCROLL</span>
          </div>
        </div>
      </div>

      {/* Bottom transition: black -> blur -> solid cream */}
      <div className="pc-transition-bottom" aria-hidden="true" />
    </section>
  );
}
