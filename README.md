## Testing

- `pnpm test` starts Vitest in watch mode.
- `pnpm test:run` runs Vitest once for unit, integration, and React component tests.
- `pnpm test:e2e` runs Playwright tests from `e2e/` in Chromium.
- `pnpm test:e2e:update` updates Playwright screenshot baselines.

Install the Playwright browser once after installing dependencies:

```sh
pnpm exec playwright install chromium
```

Vitest runs in jsdom and loads `src/test/setup.ts` for React Testing Library matchers and cleanup. Playwright is configured for screenshot assertions with `toHaveScreenshot`.
