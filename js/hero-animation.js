/**
 * Hero Computer Animation - Randomized Key Press Effects
 * Only runs in boring theme mode.
 *
 * Tweak these values to adjust speed/intensity:
 * - KEY_PRESS_INTERVAL: ms between key presses (lower = faster typing)
 * - KEY_PRESS_DURATION: ms a key stays "pressed" (lower = snappier)
 * - KEYS_PER_BURST: how many keys pressed per interval (1-3 for subtle)
 */

const CONFIG = {
  KEY_PRESS_INTERVAL: 180,   // ms between key press events
  KEY_PRESS_DURATION: 120,   // ms a key stays visually pressed
  KEYS_PER_BURST: 1,         // keys pressed at once (1 = single, 2-3 = burst)
  PAUSE_CHANCE: 0.15,        // probability of a typing pause (0-1)
  PAUSE_DURATION: 600        // ms for typing pause
};

let animationInterval = null;
let isAnimating = false;

/**
 * Initialize the hero keyboard animation
 * Call this when switching to boring theme
 */
export function initHeroAnimation() {
  if (isAnimating) return;

  const keys = document.querySelectorAll('.heroComputer .key');
  if (keys.length === 0) return;

  isAnimating = true;

  const pressRandomKeys = () => {
    // Random pause to simulate thinking
    if (Math.random() < CONFIG.PAUSE_CHANCE) {
      return;
    }

    // Press 1 or more keys
    const numKeys = Math.min(CONFIG.KEYS_PER_BURST, keys.length);
    const pressedIndices = new Set();

    for (let i = 0; i < numKeys; i++) {
      let idx;
      do {
        idx = Math.floor(Math.random() * keys.length);
      } while (pressedIndices.has(idx));

      pressedIndices.add(idx);
      const key = keys[idx];

      // Add pressed class
      key.classList.add('pressed');

      // Remove after duration
      setTimeout(() => {
        key.classList.remove('pressed');
      }, CONFIG.KEY_PRESS_DURATION);
    }
  };

  // Start the typing animation loop
  animationInterval = setInterval(pressRandomKeys, CONFIG.KEY_PRESS_INTERVAL);

  // Initial press after short delay
  setTimeout(pressRandomKeys, 100);
}

/**
 * Stop the hero keyboard animation
 * Call this when switching away from boring theme
 */
export function stopHeroAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  isAnimating = false;

  // Clear any pressed keys
  const keys = document.querySelectorAll('.heroComputer .key.pressed');
  keys.forEach(key => key.classList.remove('pressed'));
}

/**
 * Check if animation should run based on reduced motion preference
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Auto-initialize when DOM is ready and we're in boring mode
 */
export function autoInit() {
  // Don't run if user prefers reduced motion
  if (prefersReducedMotion()) return;

  // Check if we're in boring mode
  if (document.body.classList.contains('mode-boring')) {
    initHeroAnimation();
  }

  // Listen for theme changes via MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isBoring = document.body.classList.contains('mode-boring');

        if (isBoring && !isAnimating && !prefersReducedMotion()) {
          initHeroAnimation();
        } else if (!isBoring && isAnimating) {
          stopHeroAnimation();
        }
      }
    });
  });

  observer.observe(document.body, { attributes: true });
}
