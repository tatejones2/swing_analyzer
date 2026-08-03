# SwingLab

A private, browser-based baseball swing movement analyzer. SwingLab uses MediaPipe Pose Landmarker to track the hitter, estimate key swing phases, calculate focused 2D movement measurements, and present confidence-aware coaching observations.

## Features

- Local video processing—uploaded swings are not sent to an application server
- Multi-person detection with hitter identity tracking
- Live pose preview during analysis
- Manual confirmation of setup, load, foot plant, contact, and finish
- Head displacement, stance width, knee angle, torso tilt, and hip–shoulder separation estimates
- Confidence-aware findings, drills, printable reports, JSON export, and local history
- Responsive Swiss-inspired interface

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run typecheck
npm run build
```

## Accuracy and limitations

SwingLab is an experimental 2D movement-observation tool. It does not track the bat or ball, reconstruct full 3D biomechanics, or replace qualified coaching. Contact and phase detection are estimates, and the initial coaching thresholds have not yet been validated against a labeled dataset or expert consensus.

The MediaPipe model and WebAssembly runtime are downloaded when analysis is first used, but uploaded video remains inside the browser.

