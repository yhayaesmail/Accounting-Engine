import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface TransitionContextValue {
  /** Covers the screen with the navy liquid wave, navigates, then reveals. */
  playTransition: (to: string) => Promise<void>;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(
  undefined
);

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Resolve when the animation ends, or after a timeout. Background tabs pause
 * Web Animations, which would otherwise leave the navigation stuck behind the
 * overlay if the user switches tabs mid-login.
 */
function settle(animation: Animation, fallbackMs: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, fallbackMs);
    animation.finished.then(finish).catch(finish);
  });
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const layerRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(false);
  const [active, setActive] = useState(false);

  const playTransition = useCallback(
    async (to: string) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setActive(true);

      // Wait until the layer is mounted before animating it.
      await nextFrame();

      const layer = layerRef.current;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (
        !layer ||
        reduceMotion ||
        document.visibilityState === "hidden" ||
        typeof layer.animate !== "function"
      ) {
        // Hidden tabs pause animations and timers; skip straight to the page.
        navigate(to);
        setActive(false);
        runningRef.current = false;
        return;
      }

      layer.style.transform = "translateX(100%)";

      // Phase 1 — the navy liquid sheet sweeps right → left over the form.
      const cover = layer.animate(
        [
          { transform: "translateX(100%)" },
          { transform: "translateX(0%)" },
        ],
        {
          duration: 720,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          fill: "forwards",
        }
      );

      try {
        await settle(cover, 950);

        // The dashboard mounts underneath while the sheet fully covers it.
        navigate(to);
        await nextFrame();

        // Phase 2 — the sheet continues left, revealing the dashboard with
        // an organic ease-out.
        const reveal = layer.animate(
          [
            { transform: "translateX(0%)" },
            { transform: "translateX(-100%)" },
          ],
          {
            duration: 820,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards",
          }
        );

        await settle(reveal, 1050);
        reveal.cancel();
      } finally {
        cover.cancel();
        layer.style.transform = "";
        setActive(false);
        runningRef.current = false;
      }
    },
    [navigate]
  );

  return (
    <TransitionContext.Provider value={{ playTransition }}>
      {children}

      {active && (
        <div className="transition-layer" ref={layerRef} aria-hidden="true">
          {/* Wavy leading edge (right → left sweep) */}
          <svg
            className="transition-wave transition-wave--left"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M100,0 L100,100 L55,100 C20,88 80,74 50,60 C20,46 80,32 50,18 C30,8 48,4 55,0 Z" />
          </svg>

          {/* Solid navy sheet */}
          <div className="transition-sheet" />

          {/* Wavy trailing edge (reveals the dashboard) */}
          <svg
            className="transition-wave transition-wave--right"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0,0 L0,100 L45,100 C80,88 20,74 50,60 C80,46 20,32 50,18 C70,8 52,4 45,0 Z" />
          </svg>
        </div>
      )}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("usePageTransition must be used within a TransitionProvider");
  }
  return ctx;
}
