(() => {
  const timeline = document.querySelector('#timeline');
  const line = timeline?.querySelector('.timeline__line');
  const route = line?.querySelector('.timeline__route');
  const items = [...(timeline?.querySelectorAll('.timeline-item') ?? [])];
  const projects = document.querySelector('#projects');
  const viewport = projects?.querySelector('.projects__viewport');
  const track = projects?.querySelector('.projects__track');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 650px)');
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

  const lifeMarquee = document.querySelector('.life-marquee');
  const lifeTrack = lifeMarquee?.querySelector('.life-marquee__track');
  const lifeGroup = lifeTrack?.querySelector('.life-marquee__group');
  if (lifeTrack && lifeGroup) {
    const duplicate = lifeGroup.cloneNode(true);
    duplicate.setAttribute('aria-hidden', 'true');
    lifeTrack.append(duplicate);
    lifeTrack.classList.add('is-ready');
    lifeMarquee.querySelector('.life-marquee__toggle')?.removeAttribute('hidden');
  }
  lifeMarquee?.querySelector('.life-marquee__toggle')?.addEventListener('click', (event) => {
    const paused = lifeMarquee.classList.toggle('is-paused');
    event.currentTarget.setAttribute('aria-pressed', String(paused));
    event.currentTarget.textContent = paused ? 'Resume carousel' : 'Pause carousel';
  });

  document.querySelector('#return-to-top')?.addEventListener('click', () => {
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
