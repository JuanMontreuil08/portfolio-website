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
    const copy = heroLines.map((line) => line.textContent);
    const speeds = [145, 34, 18];
    heroLines.forEach((line) => { line.textContent = ''; });
    let lineIndex = 0;
    let characterIndex = 0;

    function typeNext() {
      const line = heroLines[lineIndex];
      line.classList.add('is-typing');
      if (characterIndex < copy[lineIndex].length) {
        line.textContent += copy[lineIndex][characterIndex];
        characterIndex += 1;
        window.setTimeout(typeNext, speeds[lineIndex]);
      } else if (lineIndex < heroLines.length - 1) {
        line.classList.remove('is-typing');
        lineIndex += 1;
        characterIndex = 0;
        window.setTimeout(typeNext, 180);
      } else {
        line.classList.remove('is-typing');
        line.classList.add('is-complete');
      }
    }

    heroLines[0].classList.add('is-typing');
    window.setTimeout(typeNext, 220);
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
  const routeLength = route?.getTotalLength() ?? 0;
  const viewBox = line?.viewBox.baseVal;
  let markerProgress = [];
  let distance = 0;
  let travel = 0;
  let frame = 0;
  const clamp = (value) => Math.max(0, Math.min(1, value));

  // The route travels downward through its bends, so its drawn length can be
  // found at any vertical point with a short binary search.
  function lengthAtY(y) {
    if (!routeLength || !viewBox || y <= 0) return 0;
    if (y >= viewBox.height) return routeLength;
    let low = 0;
    let high = routeLength;
    for (let step = 0; step < 16; step += 1) {
      const middle = (low + high) / 2;
      if (route.getPointAtLength(middle).y < y) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function measureTimeline() {
    if (!timeline || !line || !routeLength || !viewBox) return;
    const timelineRect = timeline.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    markerProgress = items.map((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const verticalPoint = clamp((itemRect.top + itemRect.height / 2 - lineRect.top) / lineRect.height) * viewBox.height;
      const length = lengthAtY(verticalPoint);
      const point = route.getPointAtLength(length);
      markers[index].style.left = `${lineRect.left - timelineRect.left + point.x / viewBox.width * lineRect.width}px`;
      markers[index].style.top = `${lineRect.top - timelineRect.top + point.y / viewBox.height * lineRect.height}px`;
      return length / routeLength;
    });
  }

  function updateTimeline() {
    if (!timeline || !line || !routeLength || !viewBox) return;
    if (reducedMotion.matches) {
      route.style.strokeDashoffset = '0';
      items.forEach((item, index) => {
        item.classList.add('is-lit');
        markers[index].classList.add('is-lit');
        markers[index].classList.remove('is-current');
      });
      return;
    }
    const lineRect = line.getBoundingClientRect();
    const cursor = (window.innerHeight * .55 - lineRect.top) / lineRect.height * viewBox.height;
    const progress = lengthAtY(cursor) / routeLength;
    route.style.strokeDashoffset = String(1 - progress);
    let current = -1;
    markerProgress.forEach((milestone, index) => {
      const lit = progress >= milestone - .0005;
      items[index].classList.toggle('is-lit', lit);
      markers[index].classList.toggle('is-lit', lit);
      if (lit) current = index;
    });
    markers.forEach((marker, index) => marker.classList.toggle('is-current', index === current));
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
