import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LogoMarkComponent } from '../logo-mark.component';
import { LenisScrollService } from '../lenis-scroll.service';
import { SiteContentService } from '../site-content.service';

gsap.registerPlugin(ScrollTrigger);

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

interface LockupLayout {
  valid: boolean;
  markX: number;
  markY: number;
  markScale: number;
  wordX: number;
  wordY: number;
  wordScale: number;
  horizonTop: number;
}

interface LetterShift {
  x: number;
  y: number;
  scale: number;
}

/** ViewBox units. Top link, middle link, bottom link. +y is down the screen. */
const LINK_OPEN = [
  { x: 28, y: -34 },
  { x: 0, y: 0 },
  { x: -28, y: 34 },
];

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

/** Scroll distance, in viewport heights, while the hero stays pinned. */
const PIN_VH_DESKTOP = 1.55;
const PIN_VH_MOBILE = 1.2;

const MISSION_START = 0.56;
const MISSION_EACH = 0.12;
const MISSION_STAGGER = 0.02;
const TAG_START = 0.74;
const TAG_EACH = 0.14;
const TAG_STAGGER = 0.045;
const CHROME_START = 0.7;
const CHROME_END = 0.96;

/**
 * Scroll-attached hero. On load the mark and wordmark sit as a centered
 * title card. Scrolling (and scrolling back) scrubs one pinned sequence.
 * The mark keeps its original shape. The wordmark arrives large, then eases
 * down to the headline that sits with the mission. Once the hero is
 * seated, a hover (desktop) or a tap (touch and keyboard) opens the chain.
 * The logo does not tilt.
 * Reduced motion skips the pin and shows the resting hero immediately.
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
  private readonly lenis = inject(LenisScrollService);

  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly pin = viewChild<ElementRef<HTMLElement>>('pin');
  private readonly aurora = viewChild<ElementRef<HTMLElement>>('aurora');
  private readonly mark = viewChild<ElementRef<HTMLElement>>('mark');
  private readonly word = viewChild<ElementRef<HTMLElement>>('word');
  private readonly markFloat = viewChild<ElementRef<HTMLElement>>('markFloat');
  private readonly wordFloat = viewChild<ElementRef<HTMLElement>>('wordFloat');
  private readonly horizon = viewChild<ElementRef<HTMLElement>>('horizon');
  private readonly mission = viewChild<ElementRef<HTMLElement>>('mission');
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
  /** Latched open by click, tap, or keyboard. Hover previews without latching. */
  readonly chainOpen = signal(false);
  readonly chainDiscovered = signal(false);
  readonly chainSeated = signal(false);
  readonly touchHintHidden = computed(() => !this.chainSeated() || this.chainDiscovered());

  private reducedMotion = false;
  private armed = false;
  private lastBrand = '';
  private noteTimer = 0;
  private raf = 0;
  private heroVisible = true;
  private measuring = false;
  private introPlaying = false;
  private introStart = 0;
  private progress = 0;
  private chromeOn = false;
  private headerLocked = false;
  private observer?: IntersectionObserver;
  private trigger?: ScrollTrigger;
  private motionMedia?: MediaQueryList;
  private onScenePointer?: (event: PointerEvent) => void;
  private onMotionChange?: () => void;
  private washes: Wash[] = [];
  private wordNodes: HTMLElement[] = [];
  private tagNodes: HTMLButtonElement[] = [];
  private noteNode: HTMLElement | null = null;
  private moreNode: HTMLElement | null = null;
  private letterNodes: HTMLElement[] = [];
  private letterSlots: HTMLElement[] = [];
  private letterShifts: LetterShift[] = [];
  private linkEls: SVGElement[] = [];
  private linkReveal = [1, 1, 1];
  private userOpen = 0;
  private hoverOpen = false;
  private pointerOver = false;
  private keyFocus = false;
  private pinnedOpen = false;
  private headerEl: HTMLElement | null = null;
  private layout: LockupLayout = {
    valid: false,
    markX: 0,
    markY: 0,
    markScale: 1,
    wordX: 0,
    wordY: 0,
    wordScale: 1,
    horizonTop: 0,
  };

  constructor() {
    effect(() => {
      const name = this.brandName();
      if (!this.armed || name === this.lastBrand) return;
      this.lastBrand = name;
      untracked(() => setTimeout(() => this.bootSequence(), 0));
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const scene = this.pin()?.nativeElement;
    if (!scene) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.headerEl = document.querySelector('.site-header');
    this.washes = this.collectWashes(scene);
    this.placeWashes(scene, null, 0, 0);

    if (this.reducedMotion) {
      this.clearSequenceMode();
      this.cacheLinks();
      this.chainSeated.set(true);
      this.lastBrand = this.brandName();
      this.armed = true;
      return;
    }

    if (document.documentElement.classList.contains('hero-sequencing')) {
      this.lockHeader(true);
    }

    this.observeVisibility(scene);
    this.bindPointer(scene);
    this.ngZone.runOutsideAngular(() => {
      this.raf = requestAnimationFrame((time) => this.frame(time));
    });

    this.lastBrand = this.brandName();
    this.bootSequence();
    this.armed = true;

    this.motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => {
      this.reducedMotion = this.motionMedia?.matches ?? false;
      if (this.reducedMotion) {
        this.destroySequence();
        this.clearMotionStyles();
        this.clearSequenceMode();
        this.introPlaying = false;
        this.pinnedOpen = false;
        this.pointerOver = false;
        this.keyFocus = false;
        this.hoverOpen = false;
        this.progress = 1;
        this.ngZone.run(() => {
          this.chainOpen.set(false);
          this.chainSeated.set(true);
        });
      } else {
        document.documentElement.classList.add('hero-sequencing');
        this.bootSequence();
      }
    };
    this.motionMedia.addEventListener('change', this.onMotionChange);

    void document.fonts?.ready.then(() => {
      if (this.trigger) ScrollTrigger.refresh();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.noteTimer);
    this.observer?.disconnect();
    this.motionMedia?.removeEventListener('change', this.onMotionChange ?? (() => undefined));
    const scene = this.pin()?.nativeElement;
    if (scene && this.onScenePointer) {
      scene.removeEventListener('pointermove', this.onScenePointer);
      scene.removeEventListener('pointerdown', this.onScenePointer);
    }
    this.destroySequence();
    this.clearSequenceMode();
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

  clearMission(event?: PointerEvent): void {
    if (event?.pointerType === 'touch') return;
    const mission = this.mission()?.nativeElement;
    if (!mission) return;
    this.paintWords([...mission.querySelectorAll<HTMLElement>('.mission-word')], -1);
  }

  skipIntro(): void {
    const end = this.trigger?.end;
    if (end == null) return;
    this.snapIntro();
    this.lenis.scrollTo(end, { duration: 1.05, force: true });
  }

  seeServices(): void {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Desktop hover previews the open chain. Touch and keyboard latch it. */
  onMarkEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !this.isSeated()) return;
    this.pointerOver = true;
    this.syncHover();
  }

  onMarkLeave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerOver = false;
    this.syncHover();
  }

  onMarkFocus(): void {
    if (!this.isSeated()) return;
    this.keyFocus = true;
    this.syncHover();
  }

  onMarkBlur(): void {
    this.keyFocus = false;
    this.syncHover();
  }

  onMarkClick(): void {
    if (!this.isSeated()) return;
    this.pinnedOpen = !this.pinnedOpen;
    this.chainOpen.set(this.pinnedOpen);
    this.chainDiscovered.set(true);
    if (this.reducedMotion) this.paintLinks();
  }

  private syncHover(): void {
    const next = (this.pointerOver || this.keyFocus) && this.isSeated();
    if (next === this.hoverOpen) return;
    this.hoverOpen = next;
    if (this.reducedMotion) this.paintLinks();
  }

  private isSeated(): boolean {
    return this.reducedMotion || this.progress > 0.88;
  }

  private cacheLinks(): void {
    const mark = this.mark()?.nativeElement;
    this.linkEls = mark ? [...mark.querySelectorAll<SVGElement>('.logo-link')] : [];
  }

  /** 0.4 is a hover preview. 0.75 stays open after the pointer leaves. */
  private userTarget(): number {
    if (!this.isSeated()) return 0;
    return Math.max(this.hoverOpen ? 0.4 : 0, this.pinnedOpen ? 0.75 : 0);
  }

  private paintLinks(): void {
    const open = Math.min(1, this.reducedMotion ? this.userTarget() : this.userOpen);
    this.linkEls.forEach((el, index) => {
      const reveal = this.linkReveal[index] ?? 1;
      const spec = LINK_OPEN[index] ?? { x: 0, y: 0 };
      const dx = spec.x * open;
      const dy = spec.y * open;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) el.removeAttribute('transform');
      else el.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
      el.style.opacity = reveal.toFixed(3);
    });
  }

  private syncSeat(): void {
    const seated = this.isSeated();
    if (!seated) {
      this.pinnedOpen = false;
      this.pointerOver = false;
    }
    this.hoverOpen = seated && (this.pointerOver || this.keyFocus);
    const latch = seated && this.pinnedOpen;
    if (latch === this.chainOpen() && seated === this.chainSeated()) return;
    this.ngZone.run(() => {
      if (this.chainOpen() !== latch) this.chainOpen.set(latch);
      if (this.chainSeated() !== seated) this.chainSeated.set(seated);
    });
  }

  private stepChain(): void {
    if (this.reducedMotion) return;
    const target = this.userTarget();
    const delta = target - this.userOpen;
    if (Math.abs(delta) < 0.0008) {
      if (this.userOpen !== target) {
        this.userOpen = target;
        this.paintLinks();
      }
      return;
    }
    this.userOpen += delta * (delta < 0 ? 0.18 : 0.12);
    this.paintLinks();
  }

  private bootSequence(): void {
    this.destroySequence();
    if (this.reducedMotion || !isPlatformBrowser(this.platformId)) {
      this.clearSequenceMode();
      if (this.reducedMotion) {
        this.cacheLinks();
        this.chainSeated.set(true);
      }
      return;
    }

    const pin = this.pin()?.nativeElement;
    const stage = this.stage()?.nativeElement;
    const mark = this.mark()?.nativeElement;
    const word = this.word()?.nativeElement;
    if (!pin || !stage || !mark || !word || pin.clientWidth < 8) {
      this.clearSequenceMode();
      return;
    }

    document.documentElement.classList.add('hero-sequencing');
    this.cacheLinks();
    this.wordNodes = [...pin.querySelectorAll<HTMLElement>('.mission-word')];
    this.tagNodes = this.tagButtons().map((ref) => ref.nativeElement);
    this.noteNode = pin.querySelector<HTMLElement>('.hero-note-wrap');
    this.moreNode = pin.querySelector<HTMLElement>('.hero-more');
    this.letterNodes = [...pin.querySelectorAll<HTMLElement>('.hero-letter-in')];
    this.captureLayout();
    if (!this.layout.valid) {
      this.clearSequenceMode();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.trigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: () =>
          `+=${Math.round(window.innerHeight * (window.matchMedia('(max-width: 700px)').matches ? PIN_VH_MOBILE : PIN_VH_DESKTOP))}`,
        pin,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: () => this.captureLayout(),
        onRefresh: (self) => this.apply(self.progress),
        onUpdate: (self) => this.apply(self.progress),
      });
    });

    const atRest = (this.trigger?.progress ?? 0) < 0.01 && window.scrollY < 16;
    if (atRest) {
      this.prepareIntro();
      this.introStart = performance.now();
      this.introPlaying = true;
    } else {
      this.snapIntro();
    }
    this.apply(this.trigger?.progress ?? 0);
    document.documentElement.classList.add('hero-ready');
  }

  private destroySequence(): void {
    this.trigger?.kill();
    this.trigger = undefined;
  }

  private captureLayout(): void {
    if (this.measuring) return;
    const pin = this.pin()?.nativeElement;
    const mark = this.mark()?.nativeElement;
    const word = this.word()?.nativeElement;
    const markFloat = this.markFloat()?.nativeElement;
    const wordFloat = this.wordFloat()?.nativeElement;
    const horizon = this.horizon()?.nativeElement;
    if (!pin || !mark || !word) {
      this.layout.valid = false;
      return;
    }

    this.measuring = true;
    const slots = [...word.querySelectorAll<HTMLElement>('.hero-letter')];
    const previous = {
      mark: mark.style.transform,
      word: word.style.transform,
      markFloat: markFloat?.style.transform ?? '',
      wordFloat: wordFloat?.style.transform ?? '',
      letters: slots.map((el) => el.style.transform),
    };
    mark.style.transform = 'none';
    word.style.transform = 'none';
    if (markFloat) markFloat.style.transform = 'none';
    if (wordFloat) wordFloat.style.transform = 'none';
    slots.forEach((el) => {
      el.style.transform = 'none';
    });
    void pin.offsetWidth;

    const stage = pin.getBoundingClientRect();
    const markBox = mark.getBoundingClientRect();
    const wordBox = word.getBoundingClientRect();
    const letterBoxes = slots.map((el) => el.getBoundingClientRect());
    mark.style.transform = previous.mark;
    word.style.transform = previous.word;
    if (markFloat) markFloat.style.transform = previous.markFloat;
    if (wordFloat) wordFloat.style.transform = previous.wordFloat;
    slots.forEach((el, index) => {
      el.style.transform = previous.letters[index] ?? '';
    });

    if (stage.width < 8 || stage.height < 8 || markBox.width < 8 || wordBox.width < 8) {
      this.layout.valid = false;
      this.measuring = false;
      return;
    }

    const introMarkW = Math.min(stage.width * 0.34, stage.height * 0.36, 300);
    const markScale = clamp(introMarkW / markBox.width, 0.82, 2.15);
    // Larger than the seated headline, but never wider than the stage or so
    // tall that it crowds the mark. Scroll eases this back to scale 1.
    const margin = clamp(stage.width * 0.07, 24, 88);
    const widthCap = Math.max(wordBox.width, stage.width - margin * 2);
    const gap = clamp(stage.height * 0.032, 18, 40);
    const markH = markBox.height * markScale;
    const heightCap = Math.max(wordBox.height, stage.height - markH - gap - stage.height * 0.16);
    let wordScale = Math.min(1.58, widthCap / wordBox.width, heightCap / wordBox.height);
    wordScale = clamp(wordScale, 1, 1.58);
    const wordH = wordBox.height * wordScale;
    const groupH = markH + gap + wordH;
    const top = clamp(
      (stage.height - groupH) / 2 - stage.height * 0.03,
      18,
      stage.height - groupH - 18,
    );
    const midX = stage.left + stage.width / 2;
    const markIntroCy = stage.top + top + markH / 2;
    const wordIntroCy = stage.top + top + markH + gap + wordH / 2;

    this.layout = {
      valid: true,
      markX: midX - (markBox.left + markBox.width / 2),
      markY: markIntroCy - (markBox.top + markBox.height / 2),
      markScale,
      wordX: midX - (wordBox.left + wordBox.width / 2),
      wordY: wordIntroCy - (wordBox.top + wordBox.height / 2),
      wordScale,
      horizonTop: top + markH + gap / 2,
    };
    if (horizon) horizon.style.top = `${this.layout.horizonTop.toFixed(1)}px`;

    const wordCx = wordBox.left + wordBox.width / 2;
    const wordCy = wordBox.top + wordBox.height / 2;
    this.letterSlots = slots;
    this.letterShifts = letterBoxes.map((box) => {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      return {
        x: midX + (cx - wordCx) * wordScale - cx,
        y: wordIntroCy + (cy - wordCy) * wordScale - cy,
        scale: wordScale,
      };
    });
    this.measuring = false;
  }

  /** Map pin progress both directions. Transforms and opacity only. */
  private apply(progress: number): void {
    if (this.measuring || !this.layout.valid) return;
    const pin = this.pin()?.nativeElement;
    const mark = this.mark()?.nativeElement;
    const word = this.word()?.nativeElement;
    const mission = this.mission()?.nativeElement;
    if (!pin || !mark || !word) return;

    const p = clamp(progress, 0, 1);
    this.progress = p;
    pin.style.setProperty('--hero-p', p.toFixed(4));

    // On a wide layout the lockup splits sideways first, then seats vertically,
    // so the wordmark never rises through the mark. A stacked phone layout has
    // almost no horizontal travel, so both axes move together.
    const horizontal = Math.abs(this.layout.markX) + Math.abs(this.layout.wordX);
    const stacked = horizontal < 80;
    const travelX = inOutCubic(span(p, 0.04, stacked ? 0.62 : 0.44));
    const travelY = inOutCubic(span(p, stacked ? 0.04 : 0.32, stacked ? 0.62 : 0.66));
    const markScale = this.layout.markScale + (1 - this.layout.markScale) * travelX;
    mark.style.transform = `translate3d(${(this.layout.markX * (1 - travelX)).toFixed(2)}px, ${(this.layout.markY * (1 - travelY)).toFixed(2)}px, 0) scale(${markScale.toFixed(4)})`;
    // Letters carry their own travel. Transforming the heading as well would move them twice.
    word.style.transform = '';
    const count = Math.min(this.letterSlots.length, this.letterShifts.length);
    for (let i = 0; i < count; i++) {
      const shift = this.letterShifts[i];
      const slot = this.letterSlots[i];
      if (!shift || !slot) continue;
      // Size and horizontal spacing share one clock, so the word shrinks
      // as a single word instead of packing together while still large.
      const fit = inOutCubic(span(p, 0.04, stacked ? 0.62 : 0.58));
      const letterY = inOutCubic(span(p, stacked ? 0.04 : 0.3, stacked ? 0.64 : 0.68));
      if (fit > 0.995 && letterY > 0.995) {
        slot.style.transform = '';
        continue;
      }
      const scale = shift.scale + (1 - shift.scale) * fit;
      const x = shift.x * (1 - fit);
      const y = shift.y * (1 - letterY);
      slot.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    }

    this.syncSeat();
    this.paintLinks();

    this.wordNodes.forEach((node, index) => {
      this.writeReveal(node, reveal(p, MISSION_START + index * MISSION_STAGGER, MISSION_EACH), 18);
    });
    this.tagNodes.forEach((node, index) => {
      const amount = reveal(p, TAG_START + index * TAG_STAGGER, TAG_EACH);
      this.writeReveal(node, amount, 14);
      node.tabIndex = amount > 0.72 ? 0 : -1;
    });
    const assembly = reveal(p, TAG_START, 0.18);
    if (this.noteNode) this.writeReveal(this.noteNode, assembly, 12);
    if (this.moreNode) this.writeReveal(this.moreNode, assembly, 12);
    if (mission) mission.style.pointerEvents = p > MISSION_START + 0.08 ? '' : 'none';

    const chrome = span(p, CHROME_START, CHROME_END);
    document.documentElement.style.setProperty('--hero-chrome', chrome.toFixed(3));
    const chromeOn = chrome > 0.82;
    if (chromeOn !== this.chromeOn) {
      this.chromeOn = chromeOn;
      document.documentElement.classList.toggle('hero-chrome-on', chromeOn);
      this.lockHeader(!chromeOn);
    }
  }

  private writeReveal(el: HTMLElement, amount: number, distance: number): void {
    el.style.opacity = amount.toFixed(3);
    el.style.transform = `translate3d(0, ${((1 - amount) * distance).toFixed(2)}px, 0)`;
    el.style.pointerEvents = amount > 0.45 ? '' : 'none';
  }

  private prepareIntro(): void {
    this.linkReveal = [0, 0, 0];
    this.paintLinks();
    for (const letter of this.letterNodes) {
      letter.style.opacity = '0';
      letter.style.transform = 'translate3d(0, 0.45em, 0)';
    }
  }

  private snapIntro(): void {
    this.introPlaying = false;
    this.linkReveal = [1, 1, 1];
    this.paintLinks();
    const mark = this.mark()?.nativeElement;
    if (mark) mark.style.opacity = '';
    for (const letter of this.letterNodes) {
      letter.style.opacity = '';
      letter.style.transform = '';
    }
  }

  private frame(now: number): void {
    this.raf = requestAnimationFrame((time) => this.frame(time));
    if (document.hidden || !this.heroVisible) return;

    const scene = this.pin()?.nativeElement;
    if (!scene) return;
    this.stepField(scene, now);
    this.stepIntro(now);
    this.stepChain();
    this.stepFloat();
  }

  private floatX = 0;
  private floatY = 0;
  private floatXT = 0;
  private floatYT = 0;
  private pointing = false;
  private gx = 0.46;
  private gy = 0.4;

  private stepIntro(now: number): void {
    if (!this.introPlaying) return;
    if (this.progress > 0.02) {
      this.snapIntro();
      return;
    }
    const t = (now - this.introStart) / 1000;
    const order = [1, 0, 2];
    order.forEach((linkIndex, step) => {
      this.linkReveal[linkIndex] = outCubic(clamp((t - 0.04 - step * 0.09) / 0.55, 0, 1));
    });
    this.paintLinks();
    const count = Math.max(1, this.letterNodes.length);
    const stagger = Math.min(0.045, 0.42 / count);
    this.letterNodes.forEach((letter, index) => {
      const local = outCubic(clamp((t - 0.08 - index * stagger) / 0.72, 0, 1));
      letter.style.opacity = local.toFixed(3);
      letter.style.transform = `translate3d(0, ${((1 - local) * 0.45).toFixed(3)}em, 0)`;
    });
    if (t > 0.2 + count * stagger + 0.8) this.snapIntro();
  }

  private stepFloat(): void {
    const markFloat = this.markFloat()?.nativeElement;
    const wordFloat = this.wordFloat()?.nativeElement;
    if (!markFloat || !wordFloat) return;
    if (!this.pointing) {
      this.floatXT = 0;
      this.floatYT = 0;
    }
    this.floatX += (this.floatXT - this.floatX) * 0.06;
    this.floatY += (this.floatYT - this.floatY) * 0.06;
    if (Math.abs(this.floatX) < 0.001 && Math.abs(this.floatY) < 0.001 && !this.pointing) {
      markFloat.style.transform = '';
      wordFloat.style.transform = '';
      return;
    }
    markFloat.style.transform = `translate3d(${(this.floatX * 11).toFixed(2)}px, ${(this.floatY * 8).toFixed(2)}px, 0)`;
    wordFloat.style.transform = `translate3d(${(this.floatX * -8).toFixed(2)}px, ${(this.floatY * 6).toFixed(2)}px, 0)`;
  }

  private stepField(scene: HTMLElement, now: number): void {
    const spread = 0.84 + this.progress * 0.1 + Math.min(1, this.userOpen) * 0.2;
    this.placeWashes(scene, now / 1000, (this.gx - 0.5) * 0.22, (this.gy - 0.42) * 0.18, spread);
    const follow = scene.querySelector<HTMLElement>('[data-wash="follow"]');
    if (!follow) return;
    follow.style.transform = `translate3d(${(this.gx * scene.clientWidth).toFixed(1)}px, ${(this.gy * scene.clientHeight).toFixed(1)}px, 0) translate(-50%, -50%) scale(${spread.toFixed(3)})`;
  }

  private fieldState = {
    gxT: 0.46,
    gyT: 0.4,
    wandering: false,
    wanderX: 0.46,
    wanderY: 0.4,
    autoVX: 0,
    autoVY: 0,
    kickIn: 400,
    lastFrame: 0,
    lastRealMoveAt: 0,
    ready: false,
    coarse: false,
  };

  private bindPointer(scene: HTMLElement): void {
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    this.fieldState.coarse = coarsePointer;
    this.fieldState.lastFrame = performance.now();
    this.fieldState.lastRealMoveAt = performance.now();
    this.fieldState.kickIn = 400 + Math.random() * 700;
    this.fieldState.ready = true;
    const idleResumeMs = coarsePointer ? 700 : 2000;

    this.onScenePointer = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.movementX === 0 && event.movementY === 0) return;
      const rect = scene.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this.fieldState.lastRealMoveAt = performance.now();
      this.fieldState.wandering = false;
      this.pointing = event.pointerType !== 'touch';
      this.fieldState.gxT = Math.min(0.9, Math.max(0.1, (event.clientX - rect.left) / rect.width));
      this.fieldState.gyT = Math.min(
        0.88,
        Math.max(0.12, (event.clientY - rect.top) / rect.height),
      );
      this.aurora()?.nativeElement.setAttribute('data-lit', 'true');
    };
    scene.addEventListener('pointermove', this.onScenePointer);
    scene.addEventListener('pointerdown', this.onScenePointer);

    const original = this.stepField.bind(this);
    this.stepField = (current, time) => {
      const state = this.fieldState;
      if (!state.ready) return;
      const dt = time - state.lastFrame;
      state.lastFrame = time;
      const idle = time - state.lastRealMoveAt > idleResumeMs;
      if (idle) {
        this.pointing = false;
        if (!state.wandering) {
          state.wandering = true;
          state.wanderX = this.gx;
          state.wanderY = this.gy;
          const angle = Math.random() * Math.PI * 2;
          const power = 0.003 + Math.random() * 0.004;
          state.autoVX = Math.cos(angle) * power;
          state.autoVY = Math.sin(angle) * power;
          state.kickIn = 180 + Math.random() * 500;
        }
        this.stepWander(dt);
        state.gxT = state.wanderX;
        state.gyT = state.wanderY;
        this.aurora()?.nativeElement.setAttribute('data-lit', 'true');
      }
      const ease = idle ? 0.04 : 0.08;
      this.gx += (state.gxT - this.gx) * ease;
      this.gy += (state.gyT - this.gy) * ease;
      if (this.pointing) {
        this.floatXT = (this.gx - 0.5) * 2;
        this.floatYT = (this.gy - 0.42) * 2;
      }
      original(current, time);
    };
  }

  private stepWander(dt: number): void {
    const state = this.fieldState;
    const step = Math.min(dt, 34) / 16.67;
    state.kickIn -= dt;
    if (state.kickIn <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const power = 0.004 + Math.random() * 0.008;
      state.autoVX += Math.cos(angle) * power;
      state.autoVY += Math.sin(angle) * power;
      state.kickIn = 520 + Math.random() * 1800;
    }
    state.autoVX += (Math.random() - 0.5) * 0.0014 * step;
    state.autoVY += (Math.random() - 0.5) * 0.0014 * step;
    state.autoVX *= 0.985 ** step;
    state.autoVY *= 0.985 ** step;
    const speed = Math.hypot(state.autoVX, state.autoVY);
    const maxSpeed = 0.006;
    if (speed > maxSpeed) {
      state.autoVX = (state.autoVX / speed) * maxSpeed;
      state.autoVY = (state.autoVY / speed) * maxSpeed;
    }
    state.wanderX += state.autoVX * step;
    state.wanderY += state.autoVY * step;
    if (state.wanderX < 0.12) {
      state.wanderX = 0.12;
      state.autoVX = Math.abs(state.autoVX) * 0.5;
    } else if (state.wanderX > 0.88) {
      state.wanderX = 0.88;
      state.autoVX = -Math.abs(state.autoVX) * 0.5;
    }
    if (state.wanderY < 0.14) {
      state.wanderY = 0.14;
      state.autoVY = Math.abs(state.autoVY) * 0.5;
    } else if (state.wanderY > 0.86) {
      state.wanderY = 0.86;
      state.autoVY = -Math.abs(state.autoVY) * 0.5;
    }
  }

  private observeVisibility(scene: HTMLElement): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.heroVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    this.observer.observe(scene);
  }

  private paintWords(words: HTMLElement[], index: number): void {
    words.forEach((word, i) => {
      const distance = index < 0 ? 99 : Math.abs(i - index);
      const near = distance === 0 ? 1 : distance === 1 ? 0.42 : 0;
      word.style.setProperty('--near', String(near));
    });
  }

  private lockHeader(locked: boolean): void {
    if (!this.headerEl || locked === this.headerLocked) return;
    this.headerLocked = locked;
    if (locked) this.headerEl.setAttribute('inert', '');
    else this.headerEl.removeAttribute('inert');
  }

  private clearSequenceMode(): void {
    const root = document.documentElement;
    root.classList.remove('hero-sequencing', 'hero-ready', 'hero-chrome-on');
    root.style.removeProperty('--hero-chrome');
    this.chromeOn = false;
    this.lockHeader(false);
  }

  private clearMotionStyles(): void {
    const pin = this.pin()?.nativeElement;
    if (!pin) return;
    pin.style.removeProperty('--hero-p');
    const nodes = pin.querySelectorAll<HTMLElement>(
      '.hero-emblem-in, .hero-word, .hero-emblem-float, .hero-word-float, .hero-letter, .hero-letter-in, .mission-word, .hero-tags button, .hero-mission, .hero-horizon, .hero-note-wrap, .hero-more',
    );
    nodes.forEach((node) => {
      node.style.transform = '';
      node.style.opacity = '';
      node.style.pointerEvents = '';
      node.style.top = '';
      if (node instanceof HTMLButtonElement) node.tabIndex = 0;
    });
    this.cacheLinks();
    for (const link of this.linkEls) {
      link.removeAttribute('transform');
      link.style.opacity = '';
    }
    this.userOpen = 0;
    this.linkReveal = [1, 1, 1];
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
    time: number | null,
    biasX: number,
    biasY: number,
    spread = 1,
  ): void {
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    const scale = spread.toFixed(3);
    for (const wash of this.washes) {
      const driftX = time == null ? 0 : Math.sin(time * 0.22 + wash.phase) * wash.ampX;
      const driftY = time == null ? 0 : Math.cos(time * 0.18 + wash.phase) * wash.ampY;
      const cx = (wash.x + driftX + biasX) * width;
      const cy = (wash.y + driftY + biasY) * height;
      wash.el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale})`;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function span(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp((progress - start) / (end - start), 0, 1);
}

function reveal(progress: number, start: number, duration: number): number {
  return outCubic(span(progress, start, start + duration));
}

function outCubic(t: number): number {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function inOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
