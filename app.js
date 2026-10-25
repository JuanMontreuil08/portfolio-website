(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clearSectionHash = () => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    }
  };
  const nav = document.querySelector('.hero__nav');
  const navPill = nav?.querySelector('.hero__nav-pill');
  const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') ?? [])];
  if (navPill && navLinks.length) {
    const linkForHash = () => navLinks.find((link) => link.hash === window.location.hash) ?? navLinks[0];
    const navSections = navLinks.map((link) => document.querySelector(link.hash));
    let activeLink = linkForHash();
    let previewLink = null;
    let navFrame = 0;

    function setActiveLink(link) {
      activeLink = link;
      navLinks.forEach((item) => {
        if (item === link) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    }

    function moveNavPill(link, instant = false) {
      if (instant) navPill.style.transition = 'none';
      navPill.style.width = `${link.offsetWidth}px`;
      navPill.style.height = `${link.offsetHeight}px`;
      navPill.style.transform = `translate3d(${link.offsetLeft}px, ${link.offsetTop}px, 0)`;
      nav.classList.add('is-ready');
      if (instant) requestAnimationFrame(() => { navPill.style.transition = ''; });
    }

    function syncNavToScroll() {
      navFrame = 0;
      const cursor = window.innerHeight * .45;
      let visibleLink = navLinks[0];
      navSections.forEach((section, index) => {
        if (section?.getBoundingClientRect().top <= cursor) visibleLink = navLinks[index];
      });
      if (visibleLink !== activeLink) {
        previewLink = null;
        setActiveLink(visibleLink);
        moveNavPill(visibleLink);
      }
    }

    function requestNavSync() {
      if (!navFrame) navFrame = requestAnimationFrame(syncNavToScroll);
    }

    setActiveLink(activeLink);
    moveNavPill(activeLink, true);
    navLinks.forEach((link) => {
      link.addEventListener('pointerenter', () => {
        previewLink = link;
        moveNavPill(link);
      });
      link.addEventListener('focus', () => {
        previewLink = link;
        moveNavPill(link);
      });
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const section = document.querySelector(link.hash);
        if (!section) return;
        event.preventDefault();
        clearSectionHash();
        setActiveLink(link);
        moveNavPill(link);
        section.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      });
    });
    nav.addEventListener('pointerleave', () => {
      previewLink = null;
      moveNavPill(activeLink);
    });
    nav.addEventListener('focusout', (event) => {
      if (!nav.contains(event.relatedTarget)) {
        previewLink = null;
        moveNavPill(activeLink);
      }
    });
    window.addEventListener('hashchange', () => {
      setActiveLink(linkForHash());
      if (!previewLink) moveNavPill(activeLink);
    });
    window.addEventListener('scroll', requestNavSync, { passive: true });
    window.addEventListener('resize', () => {
      requestNavSync();
      moveNavPill(previewLink ?? activeLink, true);
    }, { passive: true });
    document.fonts?.ready.then(() => moveNavPill(previewLink ?? activeLink, true));
    requestNavSync();
  }

  // A scripted Claude Code session: reserve its final layout before revealing anything.
  function createHeroTerminal() {
    const stage = document.querySelector('.hero-terminal');
    if (!stage) return { start() {}, finish() {} };
    const terminal = stage.querySelector('.terminal');
    const dock = stage.querySelector('.hero-terminal__dock');
    const launcher = stage.querySelector('.hero-terminal__launcher');
    const log = stage.querySelector('.terminal__log');
    const glyph = stage.querySelector('.terminal__glyph');
    const meta = stage.querySelector('.terminal__meta');
    const frames = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];
    let state = 'waiting';
    let timer = 0;
    let ticker = 0;
    let frame = 0;
    let tokens = 0;
    let startedAt = 0;
    const setState = (next) => { state = stage.dataset.state = next; };
    const prepare = (element, byWord) => {
      const copy = element.textContent;
      const accessible = document.createElement('span');
      accessible.className = 'hero__accessible-copy';
      accessible.textContent = copy;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      const pieces = (byWord ? copy.match(/\S+\s*/g) : [...copy]) ?? [];
      const spans = pieces.map((piece) => {
        const span = document.createElement('span');
        span.className = 'terminal__token';
        span.textContent = piece;
        visual.append(span);
        return span;
      });
      element.replaceChildren(accessible, visual);
      return spans;
    };
    const draftTokens = prepare(stage.querySelector('.terminal__draft'), false);
    const answerTokens = [...stage.querySelectorAll('.terminal__answer p')].flatMap(p => prepare(p, true));
    const later = (callback, delay) => { timer = window.setTimeout(callback, delay); };
    const between = (min, max) => min + Math.random() * (max - min);
    const endsSentence = token => /[.!?:]["”]?\s*$/.test(token.textContent);
    const endsParagraph = token => token === token.parentElement.lastElementChild;
    const formatTokens = count => (count < 1000 ? String(count) : `${(count / 1000).toFixed(1)}k`);
    // Keep the newest line in view, the way a terminal follows its output.
    const follow = (element) => {
      const overflow = element.getBoundingClientRect().bottom + 4 - log.getBoundingClientRect().bottom;
      if (overflow > 0) log.scrollTop += Math.ceil(overflow);
    };
    log.addEventListener('scroll', () => log.classList.toggle('is-clipped', log.scrollTop > 0));
    setState(state);
    terminal.inert = true;

    function tick() {
      glyph.textContent = frames[frame++ % frames.length];
      if (state === 'thinking') tokens += Math.round(between(18, 46));
      const seconds = Math.floor((performance.now() - startedAt) / 1000);
      meta.textContent = `(${seconds}s · ↓ ${formatTokens(tokens)} tokens · esc to interrupt)`;
    }

    function finish() {
      if (state === 'done') return;
      clearTimeout(timer);
      clearInterval(ticker);
      const moveFocus = document.activeElement === launcher;
      setState('done');
      dock.hidden = true;
      terminal.inert = false;
      draftTokens.forEach(token => token.classList.remove('is-visible'));
      answerTokens.forEach(token => token.classList.add('is-visible'));
      log.scrollTop = log.scrollHeight;
      if (moveFocus) terminal.focus({ preventScroll: true });
    }

    // Arrive in uneven chunks, the way a model's tokens do.
    function streamAnswer(index = 0) {
      setState('streaming');
      const size = 1 + Math.floor(Math.random() * 4);
      let end = index;
      while (end < answerTokens.length && end - index < size) {
        end += 1;
        if (endsSentence(answerTokens[end - 1])) break;
      }
      answerTokens.slice(index, end).forEach(token => token.classList.add('is-visible'));
      follow(answerTokens[end - 1]);
      tokens +=Math.round((end - index) * 1.4);
      if (end === answerTokens.length) {
        later(finish, 450);
        return;
      }
      const last = answerTokens[end - 1];
      later(() => streamAnswer(end), endsParagraph(last) ? 420 : endsSentence(last) ? 170 : between(35, 90));
    }

    function submit() {
      draftTokens.forEach(token => token.classList.remove('is-visible'));
      setState('thinking');
      follow(stage.querySelector('.terminal__prompt'));
      startedAt = performance.now();
      tick();
      ticker = window.setInterval(tick, 120);
      later(streamAnswer, 3600);
    }

    function typeDraft(index = 0) {
      setState('typing');
      draftTokens[index].classList.add('is-visible');
      if (index + 1 < draftTokens.length) later(() => typeDraft(index + 1), between(45, 115));
      else later(submit, 550);
    }

    function open() {
      if (state !== 'notifying') return;
      const moveFocus = document.activeElement === launcher;
      setState('opening');
      terminal.inert = false;
      if (moveFocus) terminal.focus({ preventScroll: true });
      later(() => {
        dock.hidden = true;
        typeDraft();
      }, 450);
    }

    launcher.addEventListener('click', open);
    return {
      finish,
      start() {
        if (state !== 'waiting') return;
        setState('notifying');
        dock.hidden = false;
      }
    };
  }
  const heroTerminal = createHeroTerminal();
  const heroLines = [...document.querySelectorAll('.hero__type')];
  if (heroLines.length) {
    // Lay out complete words first so revealing letters never changes wrapping.
    const tracks = heroLines.map((line) => {
      const copy = line.textContent;
      const accessible = document.createElement('span');
      accessible.className = 'hero__accessible-copy';
      accessible.textContent = copy;
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      const characters = [];
      for (const token of copy.match(/\S+|\s+/g) ?? []) {
        if (/^\s+$/.test(token)) {
          visual.append(document.createTextNode(token));
          continue;
        }
        const word = document.createElement('span');
        word.className = 'hero__word';
        for (const letter of token) {
          const character = document.createElement('span');
          character.className = 'hero__character';
          const ink = document.createElement('span');
          ink.className = 'hero__ink';
          ink.textContent = letter;
          character.append(ink);
          word.append(character);
          characters.push(character);
        }
        visual.append(word);
      }
      line.replaceChildren(accessible, visual);
      return characters;
    });
    const speeds = [150, 65, 42];
    let lineIndex = 0;
    let characterIndex = 0;
    let timer = 0;
    let caret = tracks[0][0];
    caret.classList.add('is-caret', 'is-leading');

    function finish() {
      clearTimeout(timer);
      caret?.classList.remove('is-leading', 'is-caret', 'is-paused');
      tracks.flat().forEach((character) => character.classList.add('is-visible'));
      heroTerminal.start();
    }
    function typeNext() {
      caret?.classList.remove('is-caret', 'is-leading', 'is-paused');
      caret = tracks[lineIndex][characterIndex];
      caret.classList.add('is-visible', 'is-caret');
      characterIndex += 1;
      const punctuation = /[,.!?]/.test(caret.textContent);
      if (characterIndex < tracks[lineIndex].length) {
        timer = window.setTimeout(typeNext, speeds[lineIndex] + (punctuation ? 160 : 0));
      } else if (lineIndex < tracks.length - 1) {
        lineIndex += 1;
        characterIndex = 0;
        caret.classList.add('is-paused');
        timer = window.setTimeout(typeNext, 320);
      } else {
        caret.classList.add('is-paused');
        timer = window.setTimeout(finish, 700);
      }
    }
    timer = window.setTimeout(typeNext, 300);
  } else heroTerminal.start();

  const timeline = document.querySelector('#timeline');
  const line = timeline?.querySelector('.timeline__line');
  const route = line?.querySelector('.timeline__route');
  const items = [...(timeline?.querySelectorAll('.timeline-item') ?? [])];
  const projects = document.querySelector('#projects');
  const viewport = projects?.querySelector('.projects__viewport');
  const track = projects?.querySelector('.projects__track');
  const narrowScreen = window.matchMedia('(max-width: 900px)');
  const markers = items.map(() => {
    const marker = document.createElement('span');
    marker.className = 'timeline__marker';
    marker.setAttribute('aria-hidden', 'true');
    timeline.append(marker);
    return marker;
  });
  const tip = line?.querySelector('.timeline__tip');
  let markerProgress = [];
  let lineTop = 0;
  let lineHeight = 1;
  let timelineProgress = 0;
  let timelineTarget = 0;
  let timelineFrame = 0;
  let timelineTime = 0;
  let distance = 0;
  let travel = 0;
  let frame = 0;
  const clamp = (value) => Math.max(0, Math.min(1, value));

  function measureTimeline() {
    if (!timeline || !line || !route) return;
    const timelineRect = timeline.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    lineTop = lineRect.top + window.scrollY;
    lineHeight = Math.max(1, lineRect.height);
    // Read geometry together, then position the decorative milestones.
    const centers = items.map((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    markerProgress = centers.map((center) => clamp((center - lineRect.top) / lineHeight));
    markers.forEach((marker, index) => {
      marker.style.left = `${lineRect.left + lineRect.width / 2 - timelineRect.left - timeline.clientLeft}px`;
      marker.style.top = `${centers[index] - timelineRect.top - timeline.clientTop}px`;
    });
    paintTimeline();
  }

  function paintTimeline() {
    if (!route || !tip) return;
    route.style.transform = `scaleY(${timelineProgress})`;
    tip.style.transform = `translateY(${timelineProgress * lineHeight}px)`;
    tip.style.opacity = timelineProgress > 0 && timelineProgress < 1 ? '1' : '0';
    markerProgress.forEach((milestone, index) => {
      const lit = timelineProgress >= milestone;
      items[index].classList.toggle('is-lit', lit);
      markers[index].classList.toggle('is-lit', lit);
    });
  }

  function animateTimeline(now) {
    timelineFrame = 0;
    const elapsed = timelineTime ? Math.min(now - timelineTime, 64) : 1000 / 60;
    timelineTime = now;
    // Reach about 95% of the scroll target in 140 ms at any refresh rate.
    const follow = 1 - Math.pow(1 - .30, elapsed / (1000 / 60));
    timelineProgress += (timelineTarget - timelineProgress) * follow;
    const settled = Math.abs(timelineTarget - timelineProgress) * lineHeight < .1;
    if (settled) timelineProgress = timelineTarget;
    paintTimeline();
    if (!settled) timelineFrame = requestAnimationFrame(animateTimeline);
    else timelineTime = 0;
  }

  function updateTimeline() {
    if (!line || !route) return;
    // Keep the reading point in the viewport; touch and keyboard scrolling work too.
    timelineTarget = clamp((window.scrollY + window.innerHeight * .55 - lineTop) / lineHeight);
    if (reducedMotion.matches) {
      if (timelineFrame) cancelAnimationFrame(timelineFrame);
      timelineFrame = 0;
      timelineTime = 0;
      timelineProgress = timelineTarget;
      paintTimeline();
      return;
    }
    if (!timelineFrame) timelineFrame = requestAnimationFrame(animateTimeline);
  }

  function measure() {
    measureTimeline();
    if (projects && viewport && track) {
      if (reducedMotion.matches || narrowScreen.matches) {
        distance = 0;
        travel = 0;
        projects.style.setProperty('--travel', '0px');
        track.style.transform = '';
      } else {
        distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
        travel = Math.max(distance * 1.35, window.innerHeight * .9);
        projects.style.setProperty('--travel', `${travel}px`);
      }
    }
    update();
  }

  function update() {
    frame = 0;
    updateTimeline();
    if (projects && track && travel > 0) {
      const progress = clamp(-projects.getBoundingClientRect().top / travel);
      track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
    }
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  document.querySelectorAll('.project__image').forEach((button) => {
    button.addEventListener('click', () => {
      const active = button.classList.toggle('is-active');
      button.setAttribute('aria-pressed', String(active));
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
        button.blur();
      }
    });
  });

  const projectVideos = [...document.querySelectorAll('.project__image video')];
  function syncProjectVideos() {
    projectVideos.forEach((video) => {
      if (reducedMotion.matches) video.pause();
      else video.play().catch(() => {});
    });
  }
  reducedMotion.addEventListener('change', syncProjectVideos);
  syncProjectVideos();

  const lifeMarquee = document.querySelector('.life-marquee');
  const lifeTrack = lifeMarquee?.querySelector('.life-marquee__track');
  const lifeGroup = lifeTrack?.querySelector('.life-marquee__group');
  if (lifeTrack && lifeGroup) {
    const duplicate = lifeGroup.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    lifeTrack.append(duplicate);
    lifeTrack.classList.add('is-ready');
  }

  document.querySelector('#return-to-top')?.addEventListener('click', () => {
    clearSectionHash();
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  reducedMotion.addEventListener('change', measure);
  narrowScreen.addEventListener('change', measure);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    if (track) observer.observe(track);
    if (timeline) observer.observe(timeline);
  }
  document.fonts?.ready.then(measure);
  measure();
})();
