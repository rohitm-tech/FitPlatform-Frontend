import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type SceneSlide = {
  id: string;
  label: string;
  hold?: number;
  content: ReactNode;
};

/**
 * Plays product scenes in order. The loop pauses offscreen, while the pointer
 * is over it, and while a scene button is focused. Reduced motion shows every
 * scene at once, with no movement.
 */
export function ScenePlayer({
  slides,
  label,
  footnote,
}: {
  slides: SceneSlide[];
  label: string;
  footnote?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const sceneRef = useRef(0);
  const [scene, setScene] = useState(0);
  const [sequenced, setSequenced] = useState(false);

  const show = (index: number) => {
    if (sceneRef.current === index) return;
    sceneRef.current = index;
    setScene(index);
  };

  const { contextSafe } = useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const stage = root.querySelector<HTMLElement>(".scene-stage");
        const scenes = gsap.utils.toArray<HTMLElement>(".theater-scene", root);
        if (!stage || scenes.length === 0) return;

        const beatsOf = (el: HTMLElement) =>
          gsap.utils.toArray<HTMLElement>(".beat", el);
        const measure = () => {
          let height = 0;
          scenes.forEach((scene) => {
            const previous = scene.style.height;
            scene.style.height = "auto";
            height = Math.max(height, scene.scrollHeight);
            scene.style.height = previous;
          });
          if (height <= 0) return;
          const next = `${Math.ceil(height) + 12}px`;
          if (stage.style.minHeight !== next) stage.style.minHeight = next;
        };
        measure();

        gsap.set(scenes, { autoAlpha: 0 });
        scenes.forEach((item) => gsap.set(beatsOf(item), { autoAlpha: 0, y: 8 }));
        gsap.set(scenes[0], { autoAlpha: 1 });
        setSequenced(true);

        const clock = { n: 0 };
        const tl = gsap.timeline({
          repeat: -1,
          paused: true,
          defaults: { ease: "power3.out" },
        });
        tlRef.current = tl;

        scenes.forEach((el, index) => {
          const beats = beatsOf(el);
          const hold = Number(el.dataset.hold) || 2.8;
          if (index > 0) {
            tl.to(scenes[index - 1], { autoAlpha: 0, duration: 0.28 });
          }
          tl.set(el, { autoAlpha: 1 });
          tl.call(() => show(index));
          if (beats.length) {
            tl.set(beats, { autoAlpha: 0, y: 8 });
            tl.to(beats, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.08 }, "+=0.02");
          }
          tl.addLabel(el.dataset.scene || `scene-${index}`);
          tl.to(clock, { n: index + 1, duration: hold, ease: "none" });
        });
        tl.to(scenes[scenes.length - 1], { autoAlpha: 0, duration: 0.28 });
        tl.set(scenes, { autoAlpha: 0 });
        scenes.forEach((item) => tl.set(beatsOf(item), { autoAlpha: 0, y: 8 }));
        tl.set(scenes[0], { autoAlpha: 1 });

        let alive = true;
        let inView = false;
        let pointing = false;
        let focused = false;
        const gate = () => {
          const tl = tlRef.current;
          if (!tl) return;
          if (pointing || focused) {
            const current = scenes[sceneRef.current];
            const label = current?.dataset.scene;
            if (label) tl.seek(label);
            tl.pause();
            return;
          }
          if (inView && !document.hidden) tl.play();
          else tl.pause();
        };
        const trigger = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            inView = self.isActive;
            gate();
          },
        });
        inView = trigger.isActive;

        const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const onEnter = () => {
          pointing = true;
          gate();
        };
        const onLeave = () => {
          pointing = false;
          gate();
        };
        const onFocusIn = (event: FocusEvent) => {
          const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
            "button[data-index]",
          );
          focused = true;
          if (button) show(Number(button.dataset.index));
          gate();
        };
        const onFocusOut = (event: FocusEvent) => {
          if (!root.contains(event.relatedTarget as Node | null)) {
            focused = false;
            gate();
          }
        };
        const onVis = () => gate();
        if (finePointer) {
          root.addEventListener("pointerenter", onEnter);
          root.addEventListener("pointerleave", onLeave);
        }
        root.addEventListener("focusin", onFocusIn);
        root.addEventListener("focusout", onFocusOut);
        document.addEventListener("visibilitychange", onVis);

        let lastWidth = stage.clientWidth;
        const observer = new ResizeObserver(() => {
          const width = stage.clientWidth;
          if (width === lastWidth) return;
          lastWidth = width;
          measure();
        });
        observer.observe(stage);
        document.fonts?.ready.then(() => {
          if (alive) measure();
        });
        gate();

        return () => {
          alive = false;
          observer.disconnect();
          root.removeEventListener("pointerenter", onEnter);
          root.removeEventListener("pointerleave", onLeave);
          root.removeEventListener("focusin", onFocusIn);
          root.removeEventListener("focusout", onFocusOut);
          document.removeEventListener("visibilitychange", onVis);
          tlRef.current = null;
          setSequenced(false);
          sceneRef.current = 0;
          setScene(0);
        };
      });
      return () => media.revert();
    },
    { scope: rootRef },
  );

  const choose = contextSafe((index: number) => {
    const root = rootRef.current;
    const target = root?.querySelectorAll<HTMLElement>(".theater-scene")[index];
    show(index);
    const tl = tlRef.current;
    if (!tl || !target) return;
    tl.pause();
    tl.seek(target.dataset.scene || `scene-${index}`);
  });

  return (
    <div
      ref={rootRef}
      className={sequenced ? "scene-player is-sequenced" : "scene-player"}
    >
      <div className="scene-stage">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="theater-scene"
            data-scene={slide.id}
            data-hold={slide.hold ?? 2.8}
            aria-hidden={sequenced ? scene !== index : undefined}
          >
            {slide.content}
          </div>
        ))}
      </div>
      <div className="scene-tabs" role="group" aria-label={label}>
        {sequenced && (
          <p className="sr-only">
            Plays through each scene. Choosing one holds it there.
          </p>
        )}
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            data-index={index}
            aria-pressed={scene === index}
            onClick={() => choose(index)}
          >
            {slide.label}
          </button>
        ))}
      </div>
      {footnote && <p className="scene-footnote">{footnote}</p>}
    </div>
  );
}
