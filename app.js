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
      caret?.classList.remove('is-caret', 'is-leading', 'is-paused');
      tracks.flat().forEach((character) => character.classList.add('is-visible'));

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
  }

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
    // Equivalent to a 12% catch-up per frame at 60 Hz, consistent at 120 Hz too.
    const follow = 1 - Math.pow(1 - .12, elapsed / (1000 / 60));
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
