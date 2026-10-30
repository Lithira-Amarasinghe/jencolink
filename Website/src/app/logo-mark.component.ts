import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Chain mark traced from the brand logo. Fill follows currentColor. */
@Component({
  selector: 'app-logo-mark',
  template: `
    <svg viewBox="0 0 346 320" fill="currentColor" aria-hidden="true">
      <g transform="translate(0 320) scale(1 -1)">
        <path
          d="M235 313 c-12 -3 -18 -6 -27 -11 -14 -10 -23 -18 -30 -32 -3 -7 -8 -18 -8 -21 0 0 4 -1 9 -1 7 -1 15 -3 24 -6 1 0 2 0 2 1 0 3 7 14 12 20 6 7 12 11 21 14 34 11 68 -14 68 -51 0 -6 -3 -19 -7 -25 -4 -6 -14 -16 -20 -19 -7 -4 -15 -6 -20 -6 l-3 0 0 -5 c1 -3 1 -11 1 -18 l0 -13 7 0 c12 2 19 4 28 9 11 5 19 11 26 19 9 9 15 19 19 32 6 17 5 39 -1 57 -9 27 -30 46 -58 55 -10 3 -33 4 -43 1z M160 240 c-25 -5 -44 -20 -55 -42 -8 -16 -8 -20 -9 -58 0 -37 0 -44 3 -48 8 -11 24 -10 30 1 l3 5 0 38 c0 23 1 39 2 41 4 10 11 19 22 24 6 3 7 4 17 4 10 0 11 -1 17 -4 8 -3 13 -8 18 -15 6 -10 6 -12 7 -54 0 -36 1 -38 3 -41 7 -10 24 -9 30 2 1 3 2 7 2 35 0 37 -1 49 -5 61 -12 36 -49 57 -85 51z M76 180 c-42 -8 -71 -43 -71 -85 0 -28 13 -54 36 -71 8 -6 23 -13 34 -16 35 -9 75 5 96 34 8 9 13 20 17 32 l2 9 1 41 c0 28 0 42 -1 44 -1 5 -5 10 -9 12 -6 3 -17 1 -21 -5 -5 -5 -5 -7 -5 -48 0 -24 0 -40 -1 -42 -6 -22 -22 -37 -44 -43 -8 -1 -22 -1 -29 1 -13 4 -26 14 -33 25 -12 19 -10 44 5 60 8 9 20 16 31 17 l5 1 0 15 c1 8 1 16 2 18 l0 3 -4 0 c-3 0 -7 -1 -11 -2z"
        />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
      height: clamp(28px, 3.4vw, 40px);
      width: auto;
      aspect-ratio: 346 / 320;
      flex: 0 0 auto;
      color: var(--text-hi);
    }

    :host-context(.brand--footer) {
      height: clamp(26px, 3vw, 34px);
    }

    :host-context(.hero-emblem) {
      width: 100%;
      height: auto;
      flex: none;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoMarkComponent {}
