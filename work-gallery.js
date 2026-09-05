// Each gallery owns its playback state; stagger starts to avoid synchronized motion.
document.querySelectorAll('.work-gallery').forEach((element, galleryIndex) => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewport = element.querySelector('.work-gallery__viewport');
  const count = viewport.children.length;
  const duplicate = viewport.firstElementChild.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.inert = true;
  viewport.append(duplicate);
  const g = { visible: false, hovered: false, focused: false };
  let starting = true;
  let selected = 0;
  let timer;
  let resizeFrame;

  function schedule() {
    const running = !reduced.matches && !document.hidden &&
      g.visible && !g.hovered && !g.focused;
    if (!running) { clearTimeout(timer); timer = undefined; starting = true; }
    else if (timer === undefined) {
      timer = setTimeout(() => { timer = undefined; starting = false; go(selected + 1); }, 2000 + (starting ? galleryIndex * 600 : 0));
    }
  }

  function go(index, immediate = false) {
    const destination = Math.max(0, Math.min(count, index));
    selected = destination % count;
    viewport.scrollTo({
      left: viewport.clientWidth * destination,
      behavior: immediate || reduced.matches ? 'instant' : 'smooth',
    });
    clearTimeout(timer);
    timer = undefined;
    schedule();
  }

    viewport.addEventListener('keydown', event => {
      const targets = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: count - 1 };
      if (!(event.key in targets)) return;
      event.preventDefault();
      go(targets[event.key], true);
    });
    let settling;
    function settled() {
      clearTimeout(settling);
      if (!viewport.clientWidth) return;
      const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
      // The duplicate makes the wrap a forward slide, followed by an invisible reset.
      if (index === count) viewport.scrollTo({ left: 0, behavior: 'instant' });
      // Track manual navigation within this gallery only.
      if (index % count !== selected) go(index % count, true);
    }
    viewport.addEventListener('scroll', () => {
      clearTimeout(settling);
      settling = setTimeout(settled, 160);
    }, { passive: true });
    viewport.addEventListener('scrollend', settled);
    element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { g.hovered = true; schedule(); }
    });
    element.addEventListener('pointerleave', () => { g.hovered = false; schedule(); });
    element.addEventListener('focusin', () => { g.focused = true; schedule(); });
    element.addEventListener('focusout', event => {
      if (!element.contains(event.relatedTarget)) { g.focused = false; schedule(); }
    });

  const visibility = new IntersectionObserver(([entry]) => {
    g.visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    schedule();
  }, { threshold: [0, 0.25] });
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => go(selected, true));
  });
  visibility.observe(element);
  resize.observe(viewport);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', () => go(selected, true));
});
