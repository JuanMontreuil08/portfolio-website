(() => {
  const overlay = document.querySelector('#intro-overlay');
  const content = document.querySelector('#portfolio-content');
  const video = overlay.querySelector('video');
  const fill = document.querySelector('.loader-fill');
  const percentage = document.querySelector('#percentage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let dismissed = false;
  const finish = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(window.introSafetyTimer);
    video.pause();
    content.inert = false;
    document.documentElement.classList.remove('intro-pending');
    overlay.remove();
    reducedMotion.removeEventListener('change', onMotionChange);
  };
  function onMotionChange(event) {
    if (event.matches) finish();
  }
  const enter = () => {
    if (dismissed) return;
    if (reducedMotion.matches) { finish(); return; }
    video.pause();
    overlay.addEventListener('transitionend', event => {
      if (event.target === overlay && event.propertyName === 'transform') finish();
    });
    overlay.classList.add('is-revealing');
    // Also release the page if the browser suppresses transitionend.
    window.setTimeout(finish, 1100);
  };
  // Existing deep links and motion-sensitive visitors go straight to the work.
  if (!document.documentElement.classList.contains('intro-pending')) {
    finish();
    return;
  }
  content.inert = true;
  reducedMotion.addEventListener('change', onMotionChange);

  // Finish visibly before navigating: 4.7 seconds of progress + a 0.3s hold.
  const duration = 4700;
  const start = performance.now();
  let completed = false;
  let previousPercent = -1;

  function render(progress) {
    fill.style.transform = `scaleX(${progress})`;
    const percent = Math.floor(progress * 100);
    if (percent !== previousPercent) {
      percentage.textContent = `${percent}%`;
      previousPercent = percent;
    }
  }

  function complete() {
    if (completed || dismissed) return;
    completed = true;
    render(1);
    window.setTimeout(enter, 300);
  }

  function update(now) {
    if (completed || dismissed) return;
    const progress = Math.min((now - start) / duration, 1);
    render(progress);
    if (progress < 1) requestAnimationFrame(update);
    else complete();
  }
  requestAnimationFrame(update);
  // Slow connections or blocked playback must never trap a visitor here.
  window.setTimeout(complete, duration);
  video.play().catch(() => { /* Keep the poster if autoplay is blocked. */ });
})();
