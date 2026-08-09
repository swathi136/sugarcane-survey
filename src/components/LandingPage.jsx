import React, { useEffect } from 'react';

export default function LandingPage({ onViewDashboard }) {
  useEffect(() => {
    // Save original body background & overflow settings
    const origBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#F6F3EA';
    window.scrollTo(0, 0);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------
       1. Combined frame sequence — Journey + Exploration + Discovery
          loaded as ONE continuous sequence, in order.
    --------------------------------------------------------- */
    function pad(n) { return String(n).padStart(3, '0'); }

    const PARTS = [
      { key: 'journey', count: 85 },
      { key: 'exploration', count: 86 },
      { key: 'discovery', count: 98 },
    ];
    const TOTAL_FRAMES = PARTS.reduce((s, p) => s + p.count, 0);

    let cursor = 0;
    const RANGES = {};
    PARTS.forEach((p) => {
      const start = cursor / TOTAL_FRAMES;
      cursor += p.count;
      const end = cursor / TOTAL_FRAMES;
      RANGES[p.key] = { start, end };
    });

    const combined = { images: new Array(TOTAL_FRAMES), loaded: 0, ready: false };

    let isMounted = true;

    function loadPart(partIndex, offset) {
      const part = PARTS[partIndex];
      for (let i = 1; i <= part.count; i++) {
        const img = new Image();
        img.src = `/assets/frames/${part.key}/frame_${pad(i)}.jpg`;
        img.onload = () => {
          if (!isMounted) return;
          combined.loaded++;
          if (combined.loaded === TOTAL_FRAMES) combined.ready = true;
        };
        combined.images[offset + i - 1] = img;
      }
    }

    loadPart(0, 0);
    const t1 = setTimeout(() => loadPart(1, PARTS[0].count), 150);
    const t2 = setTimeout(() => loadPart(2, PARTS[0].count + PARTS[1].count), 400);

    /* ---------------------------------------------------------
       2. Single canvas scrubber for the whole combined journey
    --------------------------------------------------------- */
    const section = document.getElementById('actCombined');
    const canvas = document.getElementById('canvasCombined');
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');
    let progress = 0;
    let lastIndex = -1;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastIndex = -1;
    }
    resizeCanvas();

    function computeProgress(scrollY, viewportH) {
      const top = section.offsetTop;
      const pinDuration = section.offsetHeight - viewportH;
      let p = (scrollY - top) / pinDuration;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      progress = p;
      return p;
    }

    function nearestLoadedIndex(idx) {
      if (combined.images[idx] && combined.images[idx].complete && combined.images[idx].naturalWidth) return idx;
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const a = idx - d, b = idx + d;
        if (a >= 0 && combined.images[a] && combined.images[a].complete && combined.images[a].naturalWidth) return a;
        if (b < TOTAL_FRAMES && combined.images[b] && combined.images[b].complete && combined.images[b].naturalWidth) return b;
      }
      return -1;
    }

    function drawFrame() {
      const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
      if (idx === lastIndex) return;
      const useIdx = nearestLoadedIndex(idx);
      if (useIdx === -1) return;
      const img = combined.images[useIdx];
      lastIndex = idx;

      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    /* ---------------------------------------------------------
       3. Hero overlay — fades smoothly as soon as scrolling begins
    --------------------------------------------------------- */
    const heroOverlay = document.getElementById('heroOverlay');
    const HERO_FADE_END = 0.07;

    function updateHero() {
      if (!heroOverlay) return;
      const t = Math.min(1, progress / HERO_FADE_END);
      const opacity = 1 - t;
      heroOverlay.style.opacity = opacity;
      heroOverlay.style.transform = `translateY(${t * -24}px)`;
      heroOverlay.style.pointerEvents = opacity < 0.05 ? 'none' : 'auto';
    }

    /* ---------------------------------------------------------
       4. Caption overlays — each act's caption appears once the
          hero has cleared, and its own act has begun.
    --------------------------------------------------------- */
    const copyEls = {
      journey: document.getElementById('copyJourney'),
      exploration: document.getElementById('copyExploration'),
      discovery: document.getElementById('copyDiscovery'),
    };

    const COPY_WINDOWS = {
      journey: { from: HERO_FADE_END + 0.02, to: HERO_FADE_END + 0.13 },
      exploration: { from: RANGES.exploration.start, to: RANGES.exploration.start + 0.09 },
      discovery: { from: RANGES.discovery.start, to: RANGES.discovery.start + 0.09 },
    };

    function updateCopy() {
      Object.keys(COPY_WINDOWS).forEach((key) => {
        const el = copyEls[key];
        if (!el) return;
        const { from, to } = COPY_WINDOWS[key];
        const on = progress >= from && progress <= to;
        el.classList.toggle('in', on);
      });
    }

    /* ---------------------------------------------------------
       4b. Info windows — real report figures, paired left/right,
           timed to the plant part/data view on screen.
    --------------------------------------------------------- */
    const infoWindowEls = {
      windowLeaves: document.getElementById('windowLeaves'),
      windowStem: document.getElementById('windowStem'),
      windowSoil: document.getElementById('windowSoil'),
      windowDiscovery: document.getElementById('windowDiscovery'),
    };

    function makeWindows(rangeStart, rangeEnd, captionSpan, count) {
      const contentStart = rangeStart + captionSpan;
      const span = (rangeEnd - contentStart) / count;
      const windows = [];
      for (let i = 0; i < count; i++) {
        const from = contentStart + span * i;
        const to = from + span * 0.92;
        windows.push({ from, to });
      }
      return windows;
    }

    const explorationWindows = makeWindows(RANGES.exploration.start, RANGES.exploration.end, 0.10, 3);

    const INFO_WINDOWS = {
      windowLeaves: explorationWindows[0],
      windowStem: explorationWindows[1],
      windowSoil: explorationWindows[2],
      windowDiscovery: { from: RANGES.discovery.start + 0.10, to: RANGES.discovery.end },
    };

    function updateInfoWindows() {
      Object.keys(INFO_WINDOWS).forEach((key) => {
        const el = infoWindowEls[key];
        if (!el) return;
        const { from, to } = INFO_WINDOWS[key];
        const on = progress >= from && progress <= to;
        el.classList.toggle('in', on);
      });
    }

    /* ---------------------------------------------------------
       5. Growth-stalk progress — mirrors combined progress 1:1
    --------------------------------------------------------- */
    const stalk = document.getElementById('stalk');
    const stalkFill = document.getElementById('stalkFill');
    const node1 = document.getElementById('node1');
    const node2 = document.getElementById('node2');
    const node3 = document.getElementById('node3');

    function updateStalk(scrollY, viewportH) {
      if (!stalk || !stalkFill) return;
      const hideAfter = section.offsetTop + section.offsetHeight + viewportH * 0.2;
      const visible = progress > HERO_FADE_END * 0.6 && scrollY < hideAfter;
      stalk.classList.toggle('visible', visible);

      stalkFill.style.height = (progress * 100) + '%';
      if (node1) node1.classList.toggle('active', progress >= RANGES.journey.start);
      if (node2) node2.classList.toggle('active', progress >= RANGES.exploration.start);
      if (node3) node3.classList.toggle('active', progress >= RANGES.discovery.start);
    }

    /* ---------------------------------------------------------
       6. Nav bar — subtle solidify on scroll
    --------------------------------------------------------- */
    const nav = document.querySelector('.nav');
    function updateNav(scrollY) {
      if (nav) {
        nav.classList.toggle('scrolled', scrollY > 40);
      }
    }

    /* ---------------------------------------------------------
       7. Main scroll loop (rAF-batched, passive listener)
    --------------------------------------------------------- */
    let ticking = false;

    function onFrame() {
      ticking = false;
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      computeProgress(scrollY, viewportH);
      drawFrame();
      updateHero();
      updateCopy();
      updateInfoWindows();
      updateStalk(scrollY, viewportH);
      updateNav(scrollY);
    }

    function requestTick() {
      if (!ticking && isMounted) {
        ticking = true;
        requestAnimationFrame(onFrame);
      }
    }

    const handleScroll = () => requestTick();
    const handleResize = () => {
      resizeCanvas();
      requestTick();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    const paintInterval = setInterval(() => {
      lastIndex = -1;
      requestTick();
      if (combined.ready) clearInterval(paintInterval);
    }, 500);

    requestTick();

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(paintInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.body.style.backgroundColor = origBg;
    };
  }, []);

  const handleDashboardClick = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    if (onViewDashboard) onViewDashboard();
  };

  const handleJourneyClick = (e) => {
    e.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <nav className="nav">
        <a href="#dashboard" onClick={handleDashboardClick} className="nav-cta" id="navDashboardBtn">
          View Dashboard
        </a>
      </nav>

      {/* Growth stalk scroll progress */}
      <div className="stalk" id="stalk">
        <div className="stalk-track"></div>
        <div className="stalk-fill" id="stalkFill"></div>
        <div className="stalk-node" id="node1" style={{ bottom: '100%' }}>
          <span className="stalk-node-label">Journey</span>
        </div>
        <div className="stalk-node" id="node2" style={{ bottom: '50%' }}>
          <span className="stalk-node-label">Exploration</span>
        </div>
        <div className="stalk-node" id="node3" style={{ bottom: '0%' }}>
          <span className="stalk-node-label">Discovery</span>
        </div>
      </div>

      {/* ONE CONTINUOUS SCROLL-SCRUBBED JOURNEY */}
      <section className="act act-combined" id="actCombined">
        <div className="act-pin">
          <canvas id="canvasCombined"></canvas>
          <div className="act-vignette"></div>
          <div className="act-grain"></div>
          <div className="act-scrim"></div>

          <div className="hero-overlay" id="heroOverlay">
            <div className="hero-inner">
              <h1>Agricultural Research Center</h1>
              <div className="scroll-cue"><span className="line"></span></div>
            </div>
          </div>

          <div className="act-copy" id="copyJourney">
            <span className="act-index">01</span>
            <span className="eyebrow">Journey</span>
            <h2>Into the field.</h2>
            <p>The story begins at ground level — moving deeper among rows of growing cane, where every research question starts.</p>
          </div>

          <div className="act-copy" id="copyExploration">
            <span className="act-index">02</span>
            <span className="eyebrow">Exploration</span>
            <h2>Looking closer.</h2>
            <p>Leaves, stems, soil, roots — the crop examined the way our researchers examine it: up close, and in detail.</p>
          </div>

          {/* Info windows */}
          <div className="info-window" id="windowLeaves">
            <div className="info-card card-left">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15Z"/><path d="M6 18c3-4 6-7 11-10"/></svg>
              </span>
              <span className="info-card-tag">Leaves</span>
              <ul>
                <li>Leaves per plant — vegetative growth indicator</li>
                <li>Logged at every stage, Day 30 through Day 120</li>
                <li>Higher counts signal stronger early establishment</li>
              </ul>
            </div>
            <div className="info-card card-right">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3c5 2 7 6 7 11-5-1-8-4-9-9"/><path d="M12 3c-5 2-7 6-7 11 5-1 8-4 9-9"/><path d="M12 3v18"/></svg>
              </span>
              <span className="info-card-tag">Leaf Structure</span>
              <ul>
                <li>Leaf length &amp; breadth — canopy development</li>
                <li>Wider canopy improves light capture per plant</li>
                <li>Compared treatment-wise across all 14 groups</li>
              </ul>
            </div>
          </div>

          <div className="info-window" id="windowStem">
            <div className="info-card card-left">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 21V3"/><path d="M8 7h8M8 12h8M8 17h8"/></svg>
              </span>
              <span className="info-card-tag">Stem</span>
              <ul>
                <li>Plant height — main growth comparison metric</li>
                <li>Measured at every observation day, 30 to 120</li>
                <li>T14 leads at 289.8 cm by Day 100</li>
              </ul>
            </div>
            <div className="info-card card-right">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="18" r="1.6"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </span>
              <span className="info-card-tag">Node &amp; Tillers</span>
              <ul>
                <li>Tillers per clump — crop establishment indicator</li>
                <li>Node number &amp; length — later-stage growth signal</li>
                <li>T14 also leads tillering at 14.5 per clump</li>
              </ul>
            </div>
          </div>

          <div className="info-window" id="windowSoil">
            <div className="info-card card-left">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 9h18M3 14h18"/><path d="M6 9V6h12v3M6 18v-4h12v4"/></svg>
              </span>
              <span className="info-card-tag">Soil</span>
              <ul>
                <li>FYM, bio slurry &amp; treated pressmud, by treatment</li>
                <li>Urea, DAP, MAP &amp; potash on a 10-day fertigation cycle</li>
                <li>Quantities scaled across 14 and 28 plot layouts</li>
              </ul>
            </div>
            <div className="info-card card-right">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v7"/><path d="M12 11c-3 1-4 4-5 8M12 11c3 1 4 4 5 8M12 11c-1.5 2-2 5-1 8M12 11c1.5 2 2 5 1 8"/></svg>
              </span>
              <span className="info-card-tag">Roots</span>
              <ul>
                <li>Germination % — initial crop establishment measure</li>
                <li>Recorded early, before canopy closes in</li>
                <li>Feeds directly into treatment comparison scoring</li>
              </ul>
            </div>
          </div>

          <div className="act-copy" id="copyDiscovery">
            <span className="act-index">03</span>
            <span className="eyebrow">Discovery</span>
            <h2>From observation<br />to insight.</h2>
            <p>What the eye sees in the field becomes patterns in the data — growth curves, treatment outcomes, and answers.</p>
          </div>

          <div className="info-window" id="windowDiscovery">
            <div className="info-card card-left">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>
              </span>
              <span className="info-card-tag">Day 100 — Top Treatments</span>
              <ul>
                <li>T14 leads at 289.8 cm, 14.5 tillers</li>
                <li>T8 &amp; T5 follow at 284.6 cm and 283.8 cm</li>
                <li>Ranked by height, tillers &amp; growth rate together</li>
              </ul>
            </div>
            <div className="info-card card-right">
              <span className="info-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/><circle cx="12" cy="12" r="5"/></svg>
              </span>
              <span className="info-card-tag">Smart Alerts</span>
              <ul>
                <li>Flags low-growth &amp; underperforming treatments</li>
                <li>Tracks pending fertilizer &amp; delayed fertigation</li>
                <li>Highlights plots that need a field recheck</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INSIGHTS / FEATURES */}
      <section className="insights">
        <div className="insights-head">
          <span className="eyebrow">Inside the dashboard</span>
          <h2>The research, made visible.</h2>
          <p>Everything observed in the field is organized into a single working view — built for researchers, not spreadsheets.</p>
        </div>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 20V10"/><path d="M12 10c0-4-3-6-7-6 0 4 3 6 7 6Z"/><path d="M12 14c0-3 3-5 7-5 0 3-3 5-7 5Z"/></svg>
            </span>
            <div className="insight-num">Crop</div>
            <h3>Crop Growth</h3>
            <p>Track height, tillering, and canopy development across every plot, over the full season.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>
            </span>
            <div className="insight-num">Field</div>
            <h3>Field Observations</h3>
            <p>Log and review on-ground notes, photos, and conditions exactly as researchers recorded them.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10Z"/></svg>
            </span>
            <div className="insight-num">Water</div>
            <h3>Fertigation</h3>
            <p>See irrigation and nutrient delivery schedules alongside real crop response.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 8 12 4l8 4-8 4-8-4Z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/></svg>
            </span>
            <div className="insight-num">Inputs</div>
            <h3>Fertilizer Requirements</h3>
            <p>Compare recommended versus applied nutrient loads, plot by plot.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>
            </span>
            <div className="insight-num">Compare</div>
            <h3>Treatment Comparisons</h3>
            <p>Set treatments side by side to see what actually moved the outcome.</p>
          </div>
          <div className="insight-card">
            <span className="insight-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            <div className="insight-num">AI</div>
            <h3>AI-Powered Insights</h3>
            <p>Surface patterns across seasons and plots that would take weeks to find by hand.</p>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="closing">
        <div className="closing-inner">
          <span className="eyebrow">Where to next</span>
          <h2>Walk the field again,<br />or step into the data.</h2>
          <p>Revisit the cinematic journey from the beginning, or head straight into the research dashboard.</p>
          <div className="cta-row">
            <a href="#top" onClick={handleJourneyClick} className="btn btn-secondary" id="journeyBtn">↑ Journey</a>
            <a href="#dashboard" onClick={handleDashboardClick} className="btn btn-primary" id="dashboardBtn">View Dashboard →</a>
          </div>
        </div>
      </section>

      <footer>Agricultural Research Center — Field to Insight</footer>
    </>
  );
}
