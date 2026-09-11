// Galleries advance automatically while the page is open.
document.querySelectorAll('.work-gallery').forEach((element, galleryIndex) => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewport = element.querySelector('.work-gallery__viewport');
  const count = viewport.children.length;
  const duplicate = viewport.firstElementChild.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.inert = true;
  viewport.append(duplicate);
  let selected = 0;
  let timer;
  let resizeFrame;

  function schedule() {
    const running = !reduced.matches && !document.hidden;
    clearTimeout(timer);
    timer = undefined;
    if (running) timer = setTimeout(() => go(selected + 1), 2400 + galleryIndex * 500);
  }

  function go(index, immediate = false) {
    const destination = Math.max(0, Math.min(count, index));
    selected = destination % count;
    viewport.scrollTo({
      left: viewport.clientWidth * destination,
      behavior: immediate || reduced.matches ? 'instant' : 'smooth',
    });
    schedule();
  }

  let settling;
  function settled() {
    clearTimeout(settling);
    if (!viewport.clientWidth) return;
    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    // The duplicate makes the wrap a forward slide, followed by an invisible reset.
    if (index === count) viewport.scrollTo({ left: 0, behavior: 'instant' });
  }
  viewport.addEventListener('scroll', () => {
    clearTimeout(settling);
    settling = setTimeout(settled, 160);
  }, { passive: true });
  viewport.addEventListener('scrollend', settled);
  const alignToViewport = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => go(selected, true));
  };
  if ('ResizeObserver' in window) {
    new ResizeObserver(alignToViewport).observe(viewport);
  } else {
    window.addEventListener('resize', alignToViewport, { passive: true });
  }
  document.addEventListener('visibilitychange', schedule);
  const handleMotionChange = () => go(selected, true);
  if ('addEventListener' in reduced) reduced.addEventListener('change', handleMotionChange);
  else reduced.addListener(handleMotionChange);
  schedule();
});
