/**
 * AUTH LAYOUT
 *
 * The shared two-column shell behind sign-in, account activation and password
 * reset, so all three read as one product rather than three separate screens.
 *
 * Deliberately flat: solid surfaces, ordinary borders, no glassmorphism and no
 * 3D scene. The previous version floated a translucent blurred card over an
 * animated Spline model, which read as a consumer app and — being a remote
 * scene fetched at runtime — put a third-party request on the critical path of
 * the one page users must reach in order to work.
 *
 * The brand panel shows the product itself, in whichever theme the visitor is
 * using. Both mockups are mounted at once and cross-faded, so toggling the
 * theme from the control in the corner morphs the artwork in place instead of
 * swapping it abruptly.
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import darkMockup from '@/assets/DARK-MODE.png';
import lightMockup from '@/assets/LIGHT-MODE.png';
import AuthPreferences from './AuthPreferences';

interface Props {
  children: React.ReactNode;
}

/**
 * The mockups are transparent PNGs, so the panel behind them is what creates
 * the contrast — against both the artwork and the form panel opposite.
 *
 * A single violet ramp serves both themes, and has to, because the form panel
 * flips from near-white to dark navy between them: anything tuned to contrast
 * with one would collide with the other. Violet is far enough from both to
 * stay distinct either way, and it is the one hue neither theme uses for
 * surfaces, so the split never reads as two shades of the same colour.
 */
const PANEL_GRADIENT =
  'linear-gradient(155deg, #4c1d95 0%, #35127a 38%, #1e0b4d 72%, #140733 100%)';

const AuthLayout: React.FC<Props> = ({ children }) => {
  const { mode } = useTheme();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel — hidden on mobile, where the form should own the screen. */}
      <aside
        className="relative hidden w-1/2 shrink-0 items-center justify-center overflow-hidden lg:flex"
        style={{ backgroundImage: PANEL_GRADIENT }}
      >
        {/* Soft light source behind the artwork, so it reads as lit rather
            than pasted onto a flat field. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/4 top-1/2 h-[130%] w-[150%] -translate-y-1/2 opacity-70"
          style={{
            background:
              'radial-gradient(closest-side, rgba(167,139,250,0.45), rgba(167,139,250,0.12) 55%, transparent 100%)',
          }}
        />

        {/*
          Sized to the *artwork*, not the file.

          Both PNGs carry ~14.6% transparent margin on each side, so the visible
          composition is only 70.7% of the canvas width. At `w-full` it would
          render far smaller than the panel allows, ringed by empty space.
          Widening the canvas to 124% puts the composition at ~88% of the panel
          — the largest it can be while staying fully visible — and the excess
          that overflows is transparent margin, so nothing is ever cut off.

          The 176vh cap keeps the same true on short, wide windows, where the
          height rather than the width would otherwise be the binding limit.

          shrink-0 because a flex child would otherwise be compressed straight
          back to the panel width, undoing all of the above.
        */}
        <div className="relative w-[min(124%,176vh)] max-w-none shrink-0 animate-auth-float">
          {[
            { src: lightMockup, visible: mode === 'light' },
            { src: darkMockup, visible: mode === 'dark' },
          ].map(({ src, visible }, i) => (
            <img
              key={src}
              src={src}
              alt=""
              /* Decorative: the panel carries nothing the form does not. */
              aria-hidden="true"
              className={cn(
                'w-full drop-shadow-2xl transition-opacity duration-700 ease-standard',
                // The first is in flow and sets the height; the second stacks
                // on top so the two cross-fade rather than reflowing.
                i === 1 && 'absolute inset-0',
                visible ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2">
        {/*
          Absolutely positioned so switching language — which changes the length
          of every label — never nudges the vertically centred form.
        */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <AuthPreferences />
        </div>

        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
