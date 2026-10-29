import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LogoMarkComponent } from '../logo-mark.component';
import { SiteContentService } from '../site-content.service';

interface Practice {
  id: 'web' | 'cloud' | 'flow';
  label: string;
  copy: string;
}

interface Wash {
  el: HTMLElement;
  x: number;
  y: number;
  ampX: number;
  ampY: number;
  phase: number;
}

const MISSION = [
  'A',
  'better',
  'and',
  'more',
  'joyous',
  'future',
  'through',
  'the',
  'power',
  'of',
  'computing.',
];

/**
 * Landing lockup: chain on the left, brand name and mission on the right.
 * The name is the CMS brand string. Motion is presentational and stays off
 * when the visitor prefers reduced motion.
 */
@Component({
  selector: 'app-hero',
  imports: [LogoMarkComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly contentStore = inject(SiteContentService);
  private readonly scene = viewChild<ElementRef<HTMLElement>>('scene');
  private readonly aurora = viewChild<ElementRef<HTMLElement>>('aurora');
  private readonly tagButtons = viewChildren<ElementRef<HTMLButtonElement>>('tag');

  readonly lanes: Practice[] = [
    {
      id: 'web',
      label: 'Web Apps',
      copy: 'Websites, portals, and custom web applications, built to stay maintainable.',
    },
    {
      id: 'cloud',
      label: 'Cloud Solutions',
      copy: 'Systems engineered to stay reliable as the business grows.',
    },
    {
      id: 'flow',
      label: 'Digital Automations',
      copy: 'Workflows that remove the manual steps from daily operations.',
    },
  ];

  readonly missionWords = MISSION;
  readonly brandName = computed(() => this.contentStore.companyDetails().brandName);
  readonly brandLetters = computed(() => [...this.brandName()]);
  readonly activeLane = signal<Practice | null>(null);
  readonly noteOpen = signal(false);
  readonly noteText = signal('');
  readonly hintGone = signal(false);

  private reducedMotion = false;
  private noteTimer = 0;
  private raf = 0;
  private turn = 0;
  private turnTarget = 0;
  private dragTilt = 0;
  private dragged = false;
  private pointerOrigin: { x: number; y: number } | null = null;
  private heroVisible = true;
  private observer?: IntersectionObserver;
  private onScenePointer?: (event: PointerEvent) => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const scene = this.scene()?.nativeElement;
    if (!scene) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const washes = this.collectWashes(scene);
    const follow = scene.querySelector<HTMLElement>('[data-wash="follow"]');
    this.placeWashes(scene, washes, null, 0, 0);

    if (this.reducedMotion) return;

    let gx = 0.46;
    let gy = 0.4;
    let gxT = 0.46;
    let gyT = 0.4;
    let wandering = false;
    let wanderX = gx;
    let wanderY = gy;
    let autoVX = 0;
    let autoVY = 0;
    let kickIn = 400 + Math.random() * 700;
    let lastFrame = performance.now();
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const idleResumeMs = coarsePointer ? 700 : 2000;
    let lastRealMoveAt = performance.now();

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.heroVisible = entry.isIntersecting;
        scene.classList.toggle('hero--offscreen', !entry.isIntersecting);
      },
      { threshold: 0 },
    );
    this.observer.observe(scene);

    this.onScenePointer = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.movementX === 0 && event.movementY === 0) return;
      const rect = scene.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      lastRealMoveAt = performance.now();
      wandering = false;
      gxT = Math.min(0.9, Math.max(0.1, (event.clientX - rect.left) / rect.width));
      gyT = Math.min(0.88, Math.max(0.12, (event.clientY - rect.top) / rect.height));
      this.aurora()?.nativeElement.setAttribute('data-lit', 'true');
    };
    scene.addEventListener('pointermove', this.onScenePointer);
    scene.addEventListener('pointerdown', this.onScenePointer);

    const stepWander = (dt: number) => {
      const step = Math.min(dt, 34) / 16.67;
      kickIn -= dt;
      if (kickIn <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const power = 0.004 + Math.random() * 0.008;
        autoVX += Math.cos(angle) * power;
        autoVY += Math.sin(angle) * power;
        kickIn = 520 + Math.random() * 1800;
      }
      autoVX += (Math.random() - 0.5) * 0.0014 * step;
      autoVY += (Math.random() - 0.5) * 0.0014 * step;
      autoVX *= 0.985 ** step;
      autoVY *= 0.985 ** step;
      const speed = Math.hypot(autoVX, autoVY);
      const maxSpeed = 0.006;
      if (speed > maxSpeed) {
        autoVX = (autoVX / speed) * maxSpeed;
        autoVY = (autoVY / speed) * maxSpeed;
      }
      wanderX += autoVX * step;
      wanderY += autoVY * step;
      if (wanderX < 0.12) {
        wanderX = 0.12;
        autoVX = Math.abs(autoVX) * 0.5;
      } else if (wanderX > 0.88) {
        wanderX = 0.88;
        autoVX = -Math.abs(autoVX) * 0.5;
      }
      if (wanderY < 0.14) {
        wanderY = 0.14;
        autoVY = Math.abs(autoVY) * 0.5;
      } else if (wanderY > 0.86) {
        wanderY = 0.86;
        autoVY = -Math.abs(autoVY) * 0.5;
      }
    };

    const loop = () => {
      if (this.heroVisible) {
        const now = performance.now();
        const dt = now - lastFrame;
        lastFrame = now;
        const idle = now - lastRealMoveAt > idleResumeMs;
        if (idle) {
          if (!wandering) {
            wandering = true;
            wanderX = gx;
            wanderY = gy;
            const angle = Math.random() * Math.PI * 2;
            const power = 0.003 + Math.random() * 0.004;
            autoVX = Math.cos(angle) * power;
            autoVY = Math.sin(angle) * power;
            kickIn = 180 + Math.random() * 500;
          }
          stepWander(dt);
          gxT = wanderX;
          gyT = wanderY;
          this.aurora()?.nativeElement.setAttribute('data-lit', 'true');
        }
        const ease = idle ? 0.04 : 0.08;
        gx += (gxT - gx) * ease;
        gy += (gyT - gy) * ease;
        this.placeWashes(scene, washes, now / 1000, (gx - 0.5) * 0.22, (gy - 0.42) * 0.18);
        if (follow) {
          follow.style.transform = `translate3d(${(gx * scene.clientWidth).toFixed(1)}px, ${(gy * scene.clientHeight).toFixed(1)}px, 0) translate(-50%, -50%)`;
        }
        this.turn += (this.turnTarget + this.dragTilt - this.turn) * 0.08;
        scene.style.setProperty('--mark-turn', `${this.turn.toFixed(2)}deg`);
      }
      this.raf = requestAnimationFrame(loop);
    };

    this.ngZone.runOutsideAngular(() => {
      this.raf = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.noteTimer);
    this.observer?.disconnect();
    const scene = this.scene()?.nativeElement;
    if (scene && this.onScenePointer) {
      scene.removeEventListener('pointermove', this.onScenePointer);
      scene.removeEventListener('pointerdown', this.onScenePointer);
    }
  }

  selectLane(lane: Practice): void {
    this.applyLane(this.activeLane()?.id === lane.id ? null : lane);
  }

  private applyLane(next: Practice | null): void {
    this.activeLane.set(next);
    window.clearTimeout(this.noteTimer);
    if (next) {
      this.noteText.set(next.copy);
      this.noteOpen.set(true);
    } else {
      this.noteOpen.set(false);
      this.noteTimer = window.setTimeout(() => {
        if (!this.noteOpen()) this.noteText.set('');
      }, 420);
    }
    this.turnTarget = next?.id === 'web' ? -8 : next?.id === 'flow' ? 8 : 0;
    if (this.reducedMotion) {
      this.scene()?.nativeElement.style.setProperty('--mark-turn', `${this.turnTarget}deg`);
    }
  }

  onTagsKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const buttons = this.tagButtons().map((ref) => ref.nativeElement);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
    const lane = this.lanes[nextIndex];
    if (lane) this.applyLane(lane);
  }

  onMissionMove(event: PointerEvent): void {
    const words = [
      ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.mission-word'),
    ];
    let best = -1;
    let bestDistance = 120;
    words.forEach((word, i) => {
      const rect = word.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (rect.left + rect.width / 2),
        event.clientY - (rect.top + rect.height / 2),
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    this.paintWords(words, best);
  }

  clearMission(): void {
    const scene = this.scene()?.nativeElement;
    if (!scene) return;
    this.paintWords([...scene.querySelectorAll<HTMLElement>('.mission-word')], -1);
  }

  onEmblemDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') this.hintGone.set(true);
    this.dragged = false;
    this.pointerOrigin = { x: event.clientX, y: event.clientY };
  }

  onEmblemMove(event: PointerEvent): void {
    if (!this.pointerOrigin || event.buttons === 0) return;
    const travel = Math.hypot(
      event.clientX - this.pointerOrigin.x,
      event.clientY - this.pointerOrigin.y,
    );
    if (travel > 12) {
      this.dragged = true;
      this.dragTilt = Math.max(-12, Math.min(12, (event.clientX - this.pointerOrigin.x) / 18));
    }
  }

  onEmblemUp(): void {
    this.pointerOrigin = null;
    this.dragTilt = 0;
  }

  onEmblemClick(): void {
    if (this.dragged || this.reducedMotion) {
      this.dragged = false;
      return;
    }
    const scene = this.scene()?.nativeElement;
    scene
      ?.querySelectorAll('.hero-letter, .mission-word, .hero-tags button, .hero-emblem-in')
      .forEach((node) => {
        const el = node as HTMLElement;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      });
  }

  seeServices(): void {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private paintWords(words: HTMLElement[], index: number): void {
    words.forEach((word, i) => {
      const distance = index < 0 ? 99 : Math.abs(i - index);
      const near = distance === 0 ? 1 : distance === 1 ? 0.42 : 0;
      word.style.setProperty('--near', String(near));
    });
  }

  private collectWashes(scene: HTMLElement): Wash[] {
    const specs = [
      { wash: '0', x: 0.2, y: 0.34, ampX: 0.05, ampY: 0.034, phase: 0 },
      { wash: '1', x: 0.78, y: 0.26, ampX: 0.042, ampY: 0.04, phase: 2.1 },
      { wash: '2', x: 0.54, y: 0.82, ampX: 0.036, ampY: 0.044, phase: 4.3 },
    ];
    return specs.flatMap((spec) => {
      const el = scene.querySelector<HTMLElement>(`[data-wash="${spec.wash}"]`);
      return el
        ? [{ el, x: spec.x, y: spec.y, ampX: spec.ampX, ampY: spec.ampY, phase: spec.phase }]
        : [];
    });
  }

  private placeWashes(
    scene: HTMLElement,
    washes: Wash[],
    time: number | null,
    biasX: number,
    biasY: number,
  ): void {
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    for (const wash of washes) {
      const driftX = time == null ? 0 : Math.sin(time * 0.22 + wash.phase) * wash.ampX;
      const driftY = time == null ? 0 : Math.cos(time * 0.18 + wash.phase) * wash.ampY;
      const cx = (wash.x + driftX + biasX) * width;
      const cy = (wash.y + driftY + biasY) * height;
      wash.el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  }
}
