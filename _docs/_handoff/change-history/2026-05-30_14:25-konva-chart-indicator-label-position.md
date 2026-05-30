# 2026-05-30 14:25 — konva-chart: bottom-positioned indicator labels (#483)
- **Author:** ubuntu
- **Packages touched:** konva-chart
- **Concepts / docs:** ChartIndicator label placement

- Added optional `ChartIndicator.labelPosition` (`'top' | 'bottom'`, default `'top'` — fully backward compatible).
- Horizontal-axis indicator labels can now render at the bottom of the data area (`indicatorLabelY` returns `plotBottom - fontSize - 3`) instead of overlapping chart content at the top.
- Extracted `indicatorLabelY` into a runtime-free module (`indicator-label.ts`, no react-konva import) so the placement logic is unit-testable under node (`src/test/indicator-label-position.test.ts`).
- Consumed by `market/youtube/sampler` boundary indicators.
