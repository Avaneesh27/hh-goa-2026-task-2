# HH Goa Voice RAG — Visual Design Direction

## Three possible visual approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Field Notes / Signal | An editorial research desk with warm paper, exacting typographic hierarchy, and visual traces of a voice query becoming evidence. It feels calm, authored, and intellectually trustworthy rather than like an AI SaaS template. | 0.063 |
| Monsoon Instrument Panel | A saturated, rain-soaked physical-interface aesthetic with dark ink surfaces, translucent measurement marks, and color-coded retrieval layers. It would make the product feel fast and highly technical. | 0.017 |
| Public Library After Hours | A quiet, architectural system inspired by bookplates, catalog cards, and reading-room lighting, with language as the central ornament. It would foreground the human value of finding reliable knowledge. | 0.089 |

## Chosen approach — Field Notes / Signal

### Design Movement

**Swiss International Typographic Style, reinterpreted through Indian modernist print ephemera.** The interface should feel like a contemporary research instrument designed by a thoughtful editorial team: a live voice signal enters from one side, traverses a composed evidence field, and returns as an answer with provenance. It is precise but never sterile.

### Core Principles

1. **Evidence has a visible journey.** Every important UI surface should suggest movement from spoken intent to retrieved evidence to grounded response, so the product’s trust model is intuitively legible.
2. **Asymmetry creates focus.** The layout should use a two-column editorial composition and purposeful offsets rather than a single centered hero with floating cards.
3. **Warmth is a trust signal.** Paper-like surfaces, restrained color, and generous breathing room keep the technology approachable without diluting its technical rigor.
4. **Motion reveals state, not decoration.** Animated sound waves, staggered evidence cards, hover parallax, and response transitions should clarify listening, processing, and confidence states.

### Color Philosophy

The palette uses a **warm paper ground** so the product feels authored and approachable; **ink navy** gives copy and system controls durable, editorial authority; **Rekha Coral** carries active voice, retrieval, and call-to-action states; and **Mango yellow** is reserved for confidence markers and signal highlights. Muted leafy green supports successful, grounded states. There will be no generic purple gradients or pervasive glass panes.

### Layout Paradigm

The homepage operates as a **field desk** rather than a conventional landing page. A slim, ruled navigation bar establishes the frame. The main stage pairs a left editorial column—statement, context, and sample language chips—with a right oversized voice console. Under it, a horizontal retrieval strip shows the system’s evidence pathway in tangible stages. The composition intentionally shifts alignments and uses vertical guide lines, not a centered stack of marketing blocks.

### Signature Elements

1. **The Signal Ring:** a coral concentric-ripple mark that appears in the favicon, header, microphone control, and listening state.
2. **Evidence Strips:** horizontal, numbered context slips with colored edge rules and source-language labels, used wherever the product shows retrieval or answer provenance.
3. **Field Lines:** faint dotted/rule-line textures and directional arrows that unite sections and make the composition feel like an annotated research page.

### Interaction Philosophy

The interface should respond with the tactility of a well-made instrument. Buttons compress slightly on press, evidence strips lift only enough to invite inspection, language selection opens from the point of choice, and the main microphone control reacts to pointer proximity without becoming theatrical. Interactions must make the system’s current state clearer: ready, listening, processing, grounded, or unable to answer.

### Animation

Entry motion uses short, staggered upward reveals (30–80 ms offsets) with opacity and transform only. The central microphone has a low-energy breathing halo while idle and a more decisive three-ring pulse while listening. The waveform responds as an abstract live signal, with reduced-motion fallbacks that retain information through color and static rhythm. Evidence strips should travel in from the query side during the simulated processing state, then settle into an ordered, non-looping retrieval path. All frequent controls stay under 200 ms; richer state transitions remain under 500 ms and use `cubic-bezier(0.23, 1, 0.32, 1)`.

### Typography System

**DM Serif Display** supplies the editorial display voice for short, high-impact statements; **Manrope** handles utility copy, controls, metadata, and responsive body text; **IBM Plex Mono** is reserved for technical labels, timings, language codes, and the evidence pathway. Headlines should be compact and left-aligned, with no gradient text or exaggerated highlighted single words. Numeric and system information should use mono type for an instrument-panel feel.

### Brand Essence

**HH Goa Voice RAG turns spoken questions in Indian languages into evidence-led answers, making trustworthy retrieval feel immediate and human.**

Personality: **attentive, exacting, warm**.

### Brand Voice

Headlines are concise, active, and specific. Calls to action sound like invitations to inspect knowledge, not generic software prompts. Microcopy should be lucid enough for a first-time user and precise enough for a technical evaluator.

> “Ask in the language you think in.”

> “Listen. Retrieve. Answer with evidence.”

### Wordmark and Logo

The logo is a **Signal Ring**: three imperfectly concentric coral arcs with a small offset navy kernel, suggesting voice, retrieval, and answer converging around a single grounded point. It uses no text and remains legible at favicon scale. The wordmark is an intentionally tracked, all-caps typographic lockup with a thin signal line running through the two words: `HH / VOICE RAG`.

### Signature Brand Color

**Rekha Coral — `#FF5F45`**. This is the unmistakable active color for voice, a selected language, an evidence link, and a successful grounded answer.

## UI/UX review scope

The first review builds the frontend interaction concept only. It will demonstrate navigation, a listening-state microphone, language selection, example queries, a simulated evidence-and-answer flow, and responsive motion. It will not yet connect speech APIs, retrieval, vector search, LLM generation, or TTS providers.

## Style Decisions — Motion Expansion

The next visual iteration turns the page into a scroll-led product story. The background will use a light, layered **Signal Field**—paper planes, fine dotted maps, and coral wave traces that move at different depths with scroll and subtly tilt with the pointer on devices that support hover. This must remain atmospheric rather than compete with content.

Sections will reveal as the user travels from voice input to evidence: query fragments rise from the signal field, retrieval slips fan into position, and confidence markers resolve into a grounded-answer stamp. Motion will use opacity and transforms only, retain concise durations, and be disabled or simplified for reduced-motion preferences. No decorative 3D object may obscure copy, interfere with keyboard navigation, or affect the mobile reading rhythm.

## Style Decisions

Photorealistic microphone imagery is permitted only as an **annotated research instrument**: field lines, measurement marks, Signal Rings, route labels, and evidence-state annotations must visibly bind it to the product’s retrieval story. It must never become a standalone audio-product hero.

The sequence chapter must advance through visible states—capture, inspect, and resolve—without relying on empty atmosphere. Its height and dark visual weight remain subordinate to the warm-paper editorial system, while the coral Signal Ring recurs as the organizing motif for input, retrieval, confidence, and abstention.

The complete user-supplied microphone sequence is the approved **primary background animation**. Its long pinned scroll duration is intentional and must not be shortened before every frame has played. To maintain the product’s Field Notes / Signal identity, the sequence must carry visible provenance slips, route labels, paper-like evidence dockets, and Rekha Coral Signal Rings; Mango remains a secondary measurement accent.

### Natural Editorial Reset

The interface must now favor **quiet composition over spectacle**. Decorative 3D planes, floating dockets, overlapping cards, unnecessary measurement labels, and any treatment that competes with text are removed or reduced to near-invisible texture. Headlines use plain, high-contrast typesetting with sufficient line-height and no background blocks or text collisions. The microphone sequence remains, but as a clean photographic backdrop with a single readable title and short explanation; retrieval information appears in ordinary, aligned cards rather than layered visual effects.
