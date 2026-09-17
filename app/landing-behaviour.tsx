'use client';

import { useEffect } from 'react';

type Pair = { from: [number, number]; to: [number, number]; tier: string; n?: string };

const NS = 'http://www.w3.org/2000/svg';

// Ties each flag's string to its source sentence, lights a tag and its sentence together,
// and runs the copy buttons. The page markup is server-rendered; this only adds behaviour.
function tie(svgEl: SVGSVGElement, pairs: Pair[]) {
  const box = svgEl.getBoundingClientRect();
  if (svgEl.childElementCount !== pairs.length) {
    svgEl.replaceChildren(...pairs.map(({ tier, n }, i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'string');
      if (n) g.dataset.tag = n;
      g.dataset.tier = tier;
      g.style.setProperty('--i', String(i));
      for (const cls of ['under', 'over']) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', cls);
        p.setAttribute('pathLength', '1');
        g.append(p);
      }
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '5');
      c.setAttribute('class', 'grommet');
      g.append(c);
      return g;
    }));
  }
  pairs.forEach(({ from, to }, i) => {
    const g = svgEl.children[i] as SVGGElement;
    const [gx, gy] = [from[0] - box.left, from[1] - box.top];
    const [ex, ey] = [to[0] - box.left, to[1] - box.top];
    const dx = ex - gx, sag = 16 + Math.abs(ey - gy) * .08;
    const d = `M${gx},${gy} C${gx + dx * .6},${gy + sag} ${ex - dx * .45},${ey + sag} ${ex},${ey}`;
    g.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    const c = g.querySelector('circle')!;
    c.setAttribute('cx', String(gx));
    c.setAttribute('cy', String(gy));
    c.style.transformOrigin = `${gx}px ${gy}px`;
  });
}

export default function LandingBehaviour() {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('[data-stage]');
    if (!stage) return;
    const svg = stage.querySelector<SVGSVGElement>('.strings')!;
    const sheet = stage.querySelector<HTMLElement>('.sheet')!;
    const rail = stage.querySelector<HTMLElement>('.rail')!;
    const tags = [...rail.querySelectorAll<HTMLElement>('[data-for]')];
    const tiesSvg = document.querySelector<SVGSVGElement>('.ties');
    const flagRows = [...document.querySelectorAll<HTMLElement>('.flag[data-tier]')];
    const wide = matchMedia('(min-width: 860px)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const cleanups: (() => void)[] = [];
    const on = (target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };

    const draw = () => {
      const sh = sheet.getBoundingClientRect();
      tie(svg, tags.map(tag => {
        const line = document.getElementById(tag.dataset.for!)!.getClientRects()[0];
        const eye = tag.querySelector('.eye')!.getBoundingClientRect();
        return { from: [sh.right - 26, line.top + line.height / 2], to: [eye.left, eye.top], tier: tag.dataset.tier!, n: tag.dataset.tag };
      }));
      if (tiesSvg) {
        tie(tiesSvg, flagRows.map(row => {
          const q = row.querySelector('.quote')!.getBoundingClientRect();
          const eye = row.querySelector('.eye')!.getBoundingClientRect();
          return { from: [q.left + 14, q.top + 22], to: [eye.left, eye.top], tier: row.dataset.tier! };
        }));
      }
    };

    const light = (n: string, lit: boolean) => {
      document.querySelectorAll(`[data-tag="${n}"]`).forEach(el => {
        el.classList.toggle('is-lit', lit);
        el.querySelector('.tag')?.classList.toggle('is-lit', lit);
      });
    };
    document.querySelectorAll<HTMLElement>('.m[data-tag], .chip[data-tag], .rail [data-tag]').forEach(el => {
      const n = el.dataset.tag!;
      on(el, 'pointerenter', () => light(n, true));
      on(el, 'pointerleave', () => light(n, false));
      on(el, 'focus', () => light(n, true));
      on(el, 'blur', () => light(n, false));
    });

    const timers: number[] = [];
    document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn => {
      on(btn, 'click', async () => {
        const text = document.getElementById(btn.dataset.copy!)!.textContent!.trim();
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Copied';
        } catch {
          btn.textContent = 'Select the text to copy';
        }
        btn.dataset.state = 'done';
        timers.push(window.setTimeout(() => { btn.textContent = 'Copy counter-offer'; delete btn.dataset.state; }, 2200));
      });
    });

    let queued = false;
    let lastSize = '';
    const sizeKey = () => `${innerWidth}x${stage.offsetWidth}x${stage.offsetHeight}`;
    const redraw = () => {
      if (queued || sizeKey() === lastSize) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; lastSize = sizeKey(); draw(); });
    };
    const start = () => {
      lastSize = sizeKey();
      draw();
      if (!still.matches && wide.matches) {
        svg.classList.add('is-tying');
        rail.classList.add('is-tying');
        timers.push(window.setTimeout(() => { svg.classList.remove('is-tying'); rail.classList.remove('is-tying'); }, 3200));
      }
      on(window, 'resize', redraw);
    };
    if (document.readyState === 'complete') start();
    else on(window, 'load', start, { once: true });

    return () => {
      cleanups.forEach(fn => fn());
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  return null;
}
