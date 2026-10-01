import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { motionBlocked } from "@/lib/motion-prefs";
import { scrollState, writeScroll } from "@/lib/scroll-store";

/**
 * ---------------------------------------------------------------------------
 *  One clock
 * ---------------------------------------------------------------------------
 *  GSAP's ticker is the single rAF for the entire site. Lenis steps inside it,
 *  every ScrollTrigger evaluates inside it, and R3F's render loop is added to
 *  it from `gl/scene.tsx`. That is what makes the DOM and the GPU frame-locked:
 *  a scrubbed timeline, a Lenis scroll step and a WebGL draw all happen in the
 *  same tick in the same order. Without it you get up to a frame of skew
 *  between the text and the scene behind it, which the eye reads as jank even
 *  at 120Hz.
 *
 *  Plugins are separate entry points in GSAP's ESM build, not named exports of
 *  the root, so they are imported from their own paths. Registration happens at
 *  module scope, never inside an effect: React 19 StrictMode double-invokes
 *  effects, and re-registering ScrollTrigger leaks trigger instances that keep
 *  firing against dead elements.
 * ---------------------------------------------------------------------------
 */

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

const ScrollContext = createContext<Lenis | null>(null);

/**
 * Module ref rather than context: the provider mounts once for the life of the
 * page and nothing below it ever re-renders, so a context would be a provider
 * and two consumers for no benefit.
 */
const ScrollContextRef: { current: Lenis | null } = { current: null };

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Reduced motion: Lenis is not merely disabled, it is never constructed.
    // A smoothed scroll position is an animation, and honouring the preference
    // properly means the scroll position is the browser's own.
    if (motionBlocked) {
      const onScroll = () => {
        const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        writeScroll({
          y: window.scrollY,
          progress: window.scrollY / limit,
          velocity: 0,
          speed: 0,
          direction: 0,
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      ScrollTrigger.refresh();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      // Slightly under the library default. The default overshoots enough that
      // long-form reading feels like the page is drifting away from you.
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      // `autoRaf: false` is mandatory. Lenis starts its own rAF by default, which
      // would give the site two loops and double the scroll speed.
      autoRaf: false,
      // Covers every <a href="#id"> in the nav without a click handler, so the
      // links keep native semantics, middle-click and keyboard activation.
      anchors: { offset: -72 },
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
    });

    const onScroll = ({
      scroll,
      velocity,
      progress,
    }: {
      scroll: number;
      velocity: number;
      progress: number;
    }) => {
      // `Math.abs(velocity)` is raw px/frame and spikes hard. Normalising it to
      // 0..1 with a curve is what lets shaders respond to it without flaring.
      const magnitude = Math.min(1, Math.abs(velocity) / 24);
      writeScroll({
        y: scroll,
        progress,
        velocity,
        speed: magnitude * magnitude,
        direction: velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : 0,
      });
    };

    lenis.on("scroll", onScroll);
    // Named so the cleanup removes the exact same function reference. Passing a
    // fresh arrow to `remove()` silently does nothing and leaks the ticker entry
    // on every StrictMode remount.
    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Anchor links are handled by Lenis, but a bare `#id` on first paint still
    // needs the offset applied or the browser's native jump lands under the nav.
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) lenis.scrollTo(target as HTMLElement, { immediate: true });
    }

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (value === undefined) return lenis.scroll;
        lenis.scrollTo(value, { immediate: true });
        return lenis.scroll;
      },
    });

    // Late-loading fonts and the lazy WebGL chunk change document height. Without
    // this, pinned and pinned-adjacent triggers compute against a stale height.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(refresh);
    window.addEventListener("load", refresh);

    ScrollContextRef.current = lenis;
    onScroll({ scroll: lenis.scroll, velocity: 0, progress: 0 });

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      ScrollContextRef.current = null;
    };
  }, []);

  return <>{children}</>;
}

export function scrollTo(target: string | HTMLElement, offset = -72): void {
  const lenis = ScrollContextRef.current;
  if (lenis) {
    lenis.scrollTo(target, { offset });
    return;
  }
  // Reduced-motion path, and the no-JS path.
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  } else {
    target.scrollIntoView({ behavior: "auto", block: "start" });
  }
}

export function useIsSmooth(): boolean {
  return !motionBlocked;
}

/** Read-only access for anything that needs the current animated scroll value. */
export function getScrollState() {
  return scrollState;
}

export function useScrollContext(): Lenis | null {
  return useContext(ScrollContext);
}
