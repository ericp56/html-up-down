# Copilot Instructions for html-up-down

## Project Purpose
- Build a browser-based teaching aid that helps an autistic child learn gamepad up/down actions using clear visual targets and positive reinforcement.
- Core loop: highlight target square, listen for controller input via Gamepad API, flash "Correct!" toast for 3s on success, then flip target.
- Prioritize predictable animations, high-contrast visuals, and short instructional copy; avoid sensory overload.

## Tech Stack & Project Layout
- React + Vite + TypeScript (default `npm create vite@latest html-up-down -- --template react-swc-ts`).
- Functional components only; prefer hooks for state/side-effects.
- Suggested structure: `src/components/GameBoard.tsx`, `src/components/ActionPanel.tsx`, `src/components/FeedbackToast.tsx`, `src/hooks/useGamepad.ts`, `src/styles/*.css`.
- Keep assets (icons/audio) under `public/` for Vite static serving.

## State & Data Flow
- Single source of truth via `useReducer` or `useState` in `App`: `{selectedBox: 'top'|'bottom', target: 'up'|'down', toastMessage?: string}`.
- Transition rules: pressing `up` when `target === 'up'` flips both `selectedBox` and `target` to `down`; same for `down`.
- Use a `setTimeout` (stored ref) to clear the "Correct!" toast after 3000 ms; ensure cleanup on unmount to avoid memory leaks.

## Gamepad Integration Patterns
- Follow MDN Gamepad API guidance: poll `navigator.getGamepads()` inside `requestAnimationFrame`, not `setInterval`.
- Normalize axes/buttons: D-pad up/down usually map to `buttons[12]`/`buttons[13]`; fallback to `axes[1]` threshold when buttons unavailable.
- Register `window.addEventListener('gamepadconnected', ...)` and `gamepaddisconnected` to start/stop the polling loop.
- Expose gamepad state through `useGamepad` hook that returns the latest directional intent plus a timestamp to debounce repeats.
- Provide keyboard fallback (ArrowUp/ArrowDown) for development and accessibility.

## UI & Styling Conventions
- Layout: vertical flex column for the two squares, side panel for Action box + instructions; rely on CSS custom properties for colors.
- Squares: 1:1 aspect, black fill, 4px white focus ring on `selectedBox`; animate highlight with CSS transitions <150ms.
- Action box: text label showing next required direction; update ARIA live region (`role="status"`) when it changes.
- Toast: positioned fixed near bottom, green background (`#28a745`), large readable text; hide via opacity transition while keeping it in DOM for screen readers.

## Accessibility & UX Guardrails
- Maintain WCAG AA contrast; avoid flashing faster than 3 Hz.
- Announce successes via visually rendered toast plus `aria-live="polite"` text so screen readers hear "Correct!".
- Keep instructions concise and consistent; never randomize target order to avoid confusion.

## Development Workflow
- Install deps: `npm install` (after Vite scaffold).
- Start dev server with `npm run dev`; Vite provides hot reload at `http://localhost:5173`.
- Lint/format via `npm run lint` (ESLint) and `npm run format` (Prettier) if configured by Vite template.
- Run unit tests (Vitest) with `npm run test`; focus on reducer logic and hook behavior.

## Testing Focus
- Unit-test reducer/state transitions given `direction` inputs.
- Mock Gamepad API in tests using `@vitest/browser` or manual stubs to verify `useGamepad` debouncing.
- Add Playwright or Cypress smoke test to ensure DOM highlights and toast timing behave when simulating keyboard arrows.

## When Adding Features
- Keep new components pure; drive side effects (audio cues, timers) from hooks.
- Verify both controller and keyboard paths remain in sync, especially when adjusting timing.
- Update this document whenever workflows or key components change.
