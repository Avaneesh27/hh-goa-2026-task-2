/**
 * SignalStory — Scroll-driven choreography for TRACE / 01 "The answer should leave a trail."
 *
 * Sequence:
 * 1. Initial (0 - 0.15):
 *    - Covers 85%+ of the screen (large stage grid).
 *    - Centered spanned text with multi-font, colorful accent styling.
 * 2. Scroll 1 (0.15 - 0.35):
 *    - Editorial block shrinks to left 44% width.
 *    - Font smoothly crossfades to the standard/normal resting typography.
 * 3. Scroll 2 (0.35 - 0.78):
 *    - 3 right blocks (Live intent, Retrieval signals, Evidence selected)
 *      slide in one by one from the right edge.
 * 4. Scroll 3 (0.82 - 1.00):
 *    - The whole arranged block (left + 3 right cards) slides out to the left.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Mic, Search, ShieldCheck, Check, ArrowDownRight, Sparkles } from "lucide-react";

interface SignalStoryProps {
  queryWords?: string[];
}

export default function SignalStory({ queryWords = ["about", "world", "language"] }: SignalStoryProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Spring smoothing for natural, responsive scroll movement
  const smooth = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.2,
    restDelta: 0.0001,
  });

  // ── 1. Editorial block width: 100% (covers whole stage) -> 44% (left column) ─
  const editorialWidth = useTransform(smooth, [0.10, 0.32], ["100%", "44%"]);
  const editorialScale = useTransform(smooth, [0.10, 0.32], [1.02, 1]);

  // ── 2. Crossfade between Centered/Multi-Font Hero Mode & Normal Resting Mode ──
  const heroOpacity = useTransform(smooth, [0.08, 0.22], [1, 0]);
  const restingOpacity = useTransform(smooth, [0.18, 0.32], [0, 1]);

  // ── 3. Right 3 cards: enter sequentially from right (+130% -> 0%) ───────────
  // Card 1: Live intent (enters 0.34 -> 0.48)
  const card1X = useTransform(smooth, [0.32, 0.48], ["130%", "0%"]);
  const card1Opacity = useTransform(smooth, [0.32, 0.46], [0, 1]);

  // Card 2: Retrieval signals (enters 0.48 -> 0.64)
  const card2X = useTransform(smooth, [0.46, 0.62], ["130%", "0%"]);
  const card2Opacity = useTransform(smooth, [0.46, 0.60], [0, 1]);

  // Card 3: Evidence selected (enters 0.64 -> 0.78)
  const card3X = useTransform(smooth, [0.60, 0.76], ["130%", "0%"]);
  const card3Opacity = useTransform(smooth, [0.60, 0.74], [0, 1]);

  // ── 4. Exit phase: Entire stage slides out to the left (0.82 -> 1.00) ────────
  const stageX = useTransform(smooth, [0.82, 0.98], ["0%", "-112%"]);
  const stageOpacity = useTransform(smooth, [0.90, 0.99], [1, 0.1]);

  const displayWords = queryWords.length ? queryWords : ["about", "world", "language"];

  return (
    <section
      ref={containerRef}
      className="ss-section"
      id="evidence"
      aria-labelledby="signal-story-title"
    >
      {/* Sticky full-screen viewport */}
      <div className="ss-sticky">
        {/* Top rail */}
        <motion.div className="ss-rail" style={{ x: stageX }} aria-hidden="true">
          <span>VOICE INPUT</span>
          <b />
          <span>RETRIEVAL</span>
          <b />
          <span>GROUNDING</span>
        </motion.div>

        {/* Main interactive stage container (85%+ screen coverage) */}
        <motion.div
          className="ss-stage-wrap"
          style={{
            x: stageX,
            opacity: stageOpacity,
          }}
        >
          <div className="ss-stage-grid">
            {/* Left Editorial Card / Main Block */}
            <motion.div
              className="ss-editorial-card"
              style={{
                width: editorialWidth,
                scale: editorialScale,
              }}
            >
              {/* ── A: INITIAL HERO MODE (Centered, Spanned, Multi-Font & Colorful) ── */}
              <motion.div
                className="ss-hero-view"
                style={{
                  opacity: heroOpacity,
                }}
              >
                <div className="ss-hero-eyebrow">
                  <span className="ss-badge-coral">TRACE / 01</span>
                  <span className="ss-eyebrow-sep">/</span>
                  <span>SCROLL THE EVIDENCE PATH</span>
                  <Sparkles size={14} className="ss-sparkle-icon" />
                </div>

                <h2 className="ss-hero-headline">
                  The <span className="ss-word-mono">answer</span> should{" "}
                  <em className="ss-word-serif-coral">leave</em> a{" "}
                  <span className="ss-word-display-mango">trail.</span>
                </h2>

                <p className="ss-hero-lede">
                  The product experience makes the{" "}
                  <span className="ss-hl-pill coral">invisible stages</span> of retrieval
                  feel <span className="ss-hl-pill mango">inspectable</span>. As the page moves,
                  query intent becomes{" "}
                  <span className="ss-hl-pill leaf">ranked context</span>—not a black box.
                </p>

                <div className="ss-hero-checks">
                  <div className="ss-hero-check-pill">
                    <Check size={15} />
                    <span>Preserve the spoken query</span>
                  </div>
                  <div className="ss-hero-check-pill">
                    <Check size={15} />
                    <span>Compare multiple retrieval signals</span>
                  </div>
                  <div className="ss-hero-check-pill">
                    <Check size={15} />
                    <span>Surface only useful context</span>
                  </div>
                </div>
              </motion.div>

              {/* ── B: RESTING MODE (Left-aligned, standard clean typography) ── */}
              <motion.div
                className="ss-resting-view"
                style={{
                  opacity: restingOpacity,
                }}
              >
                <div className="eyebrow">
                  <span className="eyebrow-number">TRACE / 01</span>
                  <span>Scroll the evidence path</span>
                </div>
                <h2 id="signal-story-title" className="ss-resting-title">
                  The answer should<br />leave a trail.
                </h2>
                <p className="ss-resting-lede">
                  The product experience makes the invisible stages of retrieval feel
                  inspectable. As the page moves, query intent becomes ranked context—not
                  a black box.
                </p>
                <div className="ss-resting-checks">
                  <span>
                    <Check size={16} /> Preserve the spoken query
                  </span>
                  <span>
                    <Check size={16} /> Compare multiple retrieval signals
                  </span>
                  <span>
                    <Check size={16} /> Surface only useful context
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right 3 Stacked Cards (Live Intent, Retrieval, Evidence) */}
            <div className="ss-cards-column">
              {/* Card 1: Live Intent */}
              <motion.article
                className="ss-card ss-card-intent"
                style={{
                  x: card1X,
                  opacity: card1Opacity,
                }}
              >
                <div className="ss-card-eyebrow">
                  <span className="ss-icon-wrap"><Mic size={14} /></span>
                  <span>Live intent</span>
                </div>
                <div className="ss-query-fragments">
                  {displayWords.map((word) => (
                    <span key={word}>{word}</span>
                  ))}
                </div>
                <div className="ss-card-footer">
                  <span>Original words stay intact</span>
                  <ArrowDownRight size={15} />
                </div>
              </motion.article>

              {/* Card 2: Retrieval Signals */}
              <motion.article
                className="ss-card ss-card-signals"
                style={{
                  x: card2X,
                  opacity: card2Opacity,
                }}
              >
                <div className="ss-card-eyebrow">
                  <span className="ss-icon-wrap"><Search size={14} /></span>
                  <span>Retrieval signals</span>
                </div>
                <div className="ss-signals-list">
                  <div className="ss-signal-row">
                    <span>Dense match</span>
                    <div className="ss-signal-bar">
                      <b style={{ width: "82%" }} />
                    </div>
                    <strong>0.82</strong>
                  </div>
                  <div className="ss-signal-row">
                    <span>Keyword match</span>
                    <div className="ss-signal-bar">
                      <b style={{ width: "67%" }} />
                    </div>
                    <strong>0.67</strong>
                  </div>
                  <div className="ss-signal-row">
                    <span>Language fit</span>
                    <div className="ss-signal-bar">
                      <b style={{ width: "91%" }} />
                    </div>
                    <strong>0.91</strong>
                  </div>
                </div>
                <div className="ss-card-footer">
                  <span>Fuse, deduplicate, rerank</span>
                  <ArrowDownRight size={15} />
                </div>
              </motion.article>

              {/* Card 3: Evidence Selected */}
              <motion.article
                className="ss-card ss-card-evidence"
                style={{
                  x: card3X,
                  opacity: card3Opacity,
                }}
              >
                <div className="ss-card-eyebrow ss-evidence-eyebrow">
                  <span className="ss-icon-wrap"><ShieldCheck size={15} /></span>
                  <span>Evidence selected</span>
                  <span className="ss-evidence-count">02 / 05</span>
                </div>
                <p className="ss-evidence-quote">
                  “A legal entity independent of its owners, with its own rights and obligations.”
                </p>
                <div className="ss-evidence-source">
                  <span>MSMARCO-XI</span>
                  <span>MR + EN</span>
                </div>
              </motion.article>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
