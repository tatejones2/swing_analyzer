# Baseball Swing Analyzer

## Product and Implementation Specification

This document is intended to be provided directly to Codex or another coding agent as the primary build specification for a baseball swing-analysis web application.

---

## 1. Project Overview

Build a free, clean, organized, and easy-to-use web application for baseball players and coaches.

The application should allow a user to upload a video of a baseball swing, analyze the hitter's body movement, identify possible mechanical issues, explain what may be improved, and recommend practical drills or adjustments.

The first version should focus on reliable, measurable body-movement analysis rather than claiming to provide perfect professional swing diagnosis.

The application should run primarily in the browser, require no account, avoid permanent video storage, and be deployable as a static site on GitHub Pages.

### Core Product Promise

> Upload an open-side video of a baseball swing and receive an estimated analysis of balance, posture, stride, rotation, sequencing, head movement, and lower-body stability.

---

## 2. Primary Goals

The product should:

1. Make swing analysis accessible to players and coaches.
2. Produce useful, understandable feedback from an uploaded swing video.
3. Keep the initial product free to host and use.
4. Perform as much processing as possible locally in the browser.
5. Protect user privacy by avoiding unnecessary video uploads.
6. Present results in a clean Swiss International design system.
7. Be structured so more advanced AI, accounts, team dashboards, and cloud analysis can be added later.

---

## 3. Non-Goals for the Initial Version

Do not attempt to deliver these features in the MVP:

- Exact bat speed
- Exact exit velocity
- Accurate pitch tracking
- Accurate ball-flight analysis
- Precise bat-path reconstruction
- Exact contact-point detection
- Full three-dimensional biomechanical analysis
- Automatic analysis from every camera angle
- Permanent cloud video storage
- Player accounts
- Team management
- Paid subscriptions
- Social features
- Medical or injury diagnosis

The MVP must not claim that it replaces a qualified hitting coach.

---

## 4. Target Users

### Players

Players should be able to upload a swing, understand the most important observations, and receive drills they can immediately use.

### Coaches

Coaches should be able to review measurements, examine key frames, and use the results as a supporting tool during instruction.

### Initial Player Levels

The first version should support:

- Youth players
- High school players
- College players
- Adult recreational players

The user should select the player level before analysis so feedback language and thresholds can be adjusted later.

---

## 5. Recommended Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- MediaPipe Tasks Vision
- Zustand for lightweight application state
- Dexie for IndexedDB storage
- Zod for runtime validation
- Plain CSS, CSS Modules, or a small design-token system

Avoid using a large UI component framework unless clearly necessary.

### Testing

- Vitest
- React Testing Library
- Playwright

### Code Quality

- TypeScript strict mode
- ESLint
- Prettier
- Husky optional
- lint-staged optional

### Hosting

- GitHub Pages
- GitHub Actions

### Optional Future Backend

Do not require a backend for the MVP.

Future backend options may include:

- Cloudflare Workers
- Supabase Edge Functions
- Vercel Functions
- Netlify Functions

A future backend may be used for protected AI API calls, shared accounts, team workspaces, and optional cloud storage.

---

## 6. Technical Architecture

The MVP should use a client-side processing pipeline.

```text
Uploaded video
    ↓
Browser video decoder
    ↓
Frame sampling
    ↓
MediaPipe Pose Landmarker
    ↓
Normalized body landmarks
    ↓
Swing phase detection or manual phase confirmation
    ↓
Biomechanical measurements
    ↓
Rule-based analysis engine
    ↓
Findings, confidence scores, explanations, and drills
    ↓
Results interface and exportable report
```

### Primary Architectural Rule

Do not send the uploaded video to a remote server in the MVP.

All pose detection and measurement calculations should run locally in the browser whenever technically possible.

---

## 7. User Experience Flow

### Main Flow

```text
Landing page
    ↓
Start analysis
    ↓
Recording instructions
    ↓
Upload swing video
    ↓
Enter player and video information
    ↓
Process video locally
    ↓
Review detected swing phases
    ↓
Manually correct key frames if needed
    ↓
View results
    ↓
Review top findings and recommended drills
    ↓
Save locally or export report
```

### Required Screens

1. Landing page
2. Recording guide
3. Upload page
4. Player and swing information form
5. Processing screen
6. Frame-review workspace
7. Results dashboard
8. Finding details page or panel
9. Drill library page or panel
10. Local analysis history
11. Privacy and limitations page
12. Not-found page

---

## 8. Video Requirements

The first version should support one primary camera angle.

### Supported Camera Angle

Use an open-side view.

For a right-handed hitter, the camera should generally be positioned toward the first-base side. For a left-handed hitter, the opposite orientation applies.

### Recording Guidance

Before upload, display a visual checklist:

- Entire body visible
- Bat visible when possible
- Both feet visible
- Camera remains stationary
- Landscape orientation preferred
- Camera near waist or chest height
- Hitter centered in frame
- Good lighting
- Minimal background movement
- Only one hitter in the frame
- One swing per video preferred
- Short video preferred

### Initial File Support

Support common browser-compatible video formats:

- MP4
- WebM
- MOV when the user's browser can decode it

Display an understandable error when the browser cannot decode a selected file.

### Suggested Limits

- Maximum file size: 150 MB
- Recommended length: 3 to 15 seconds
- Maximum length: 30 seconds

Do not silently reject a video. Explain the reason and provide a correction.

---

## 9. Player and Swing Information

Collect the following before analysis:

- Player name or optional label
- Hitting side: right or left
- Player level
- Swing type
- Camera angle
- Player height, optional
- Main concern, optional

### Swing Type Options

- Tee
- Front toss
- Soft toss
- Batting practice
- Machine
- Live pitch
- Game swing

### Camera Angle Options

For the MVP:

- Open side, supported
- Closed side, experimental or unsupported
- Behind hitter, unsupported
- Behind pitcher, unsupported
- Unknown, unsupported

The interface should clearly communicate whether the selected angle is supported.

---

## 10. Video Processing

### Processing Strategy

Use the browser's video element and canvas APIs to sample frames from the video.

Do not process every frame by default if that creates poor performance.

Recommended initial sampling approach:

- Detect source frame rate when possible
- Sample between 15 and 30 frames per second
- Lower sampling rate for large videos or weak devices
- Preserve the original timestamps

### Worker Architecture

Use a Web Worker when practical for:

- Pose estimation
- Landmark normalization
- Measurement calculations
- Phase detection

Keep the main UI responsive during analysis.

### Progress Reporting

Display stages such as:

1. Loading video
2. Preparing analysis model
3. Detecting body movement
4. Identifying swing phases
5. Calculating measurements
6. Creating feedback

Show real progress when possible rather than fake timers.

### Cancellation

The user should be able to cancel processing and return to the upload page.

---

## 11. Pose Detection

Use MediaPipe Pose Landmarker for Web.

Store pose landmarks for each sampled frame using a structure similar to:

```ts
interface PoseFrame {
  timestampMs: number;
  landmarks: NormalizedLandmark[];
  worldLandmarks?: Landmark[];
  averageVisibility: number;
}
```

### Important Landmarks

Prioritize:

- Nose
- Ears
- Shoulders
- Elbows
- Wrists
- Index fingers when available
- Hips
- Knees
- Ankles
- Heels
- Foot indices

### Confidence Handling

For every frame:

- Track landmark visibility
- Track presence confidence
- Identify occluded or unreliable joints
- Avoid calculating measurements when required landmarks are unreliable
- Mark low-confidence measurements in the results

Do not fabricate a measurement when landmark confidence is insufficient.

---

## 12. Coordinate Normalization

Raw pixel distances must not be used as final biomechanical measurements.

Normalize position and distance values using one or more of the following:

- Estimated body height
- Shoulder width
- Hip width
- Distance between ankles during setup
- MediaPipe world landmarks when reliable

Store both raw and normalized measurements where useful.

Example:

```ts
interface NormalizedMeasurement {
  rawPixels?: number;
  normalizedValue: number;
  normalizationBasis: "body-height" | "shoulder-width" | "hip-width";
  confidence: number;
}
```

---

## 13. Swing Phase Model

The analysis should divide the swing into phases.

### Required Phases

1. Setup
2. Load
3. Stride
4. Front-foot plant
5. Launch
6. Rotation
7. Approximate contact
8. Extension
9. Finish

### MVP Phase Strategy

Use a hybrid approach:

- Attempt automatic phase detection
- Allow the user to manually confirm or correct important frames

At minimum, allow manual selection of:

- Setup
- Maximum load
- Front-foot plant
- Approximate contact
- Finish

### Automatic Detection Signals

Possible signals include:

- Wrist velocity
- Hip rotation velocity
- Shoulder rotation velocity
- Front ankle movement
- Front heel movement
- Pelvis displacement
- Hand direction changes
- Maximum hand acceleration

Automatic detection should be treated as an estimate.

---

## 14. Frame Review Workspace

The frame-review screen is a critical MVP feature.

### Required Features

- Video player
- Play and pause
- Frame-by-frame stepping
- Timeline scrubber
- Current timestamp
- Pose overlay toggle
- Joint-angle overlay toggle
- Body-center trail toggle
- Swing-phase markers
- Manual phase reassignment
- Zoom or fit-to-view
- Reset selections

### Overlay Design

Use clean overlays:

- Small joint points
- Thin skeleton lines
- Angle arcs
- Center-of-body marker
- Head-position trail
- Hip and shoulder axis lines

Avoid visually overwhelming the video.

---

## 15. Initial Measurements

The MVP should calculate a focused set of measurements.

### Setup Measurements

- Stance width relative to body height
- Initial knee flexion
- Torso tilt
- Shoulder tilt
- Hip tilt
- Head position relative to stance center
- Estimated weight-distribution proxy

### Load and Stride Measurements

- Head displacement
- Pelvis displacement
- Rear-hip movement
- Front-foot movement
- Stride length
- Stride direction
- Front-knee lift, if applicable
- Torso drift
- Hand movement relative to torso

### Rotation Measurements

- Hip angle over time
- Shoulder angle over time
- Hip-to-shoulder separation
- Hip rotational velocity proxy
- Shoulder rotational velocity proxy
- Sequence timing between hips and shoulders
- Torso side bend

### Contact-Frame Measurements

- Head position
- Front-knee angle
- Rear-knee angle
- Torso tilt
- Shoulder tilt
- Hip orientation
- Shoulder orientation
- Hand position relative to body
- Balance over base of support

### Finish Measurements

- Balance at finish
- Head movement after contact
- Torso control
- Front-leg stability
- Rear-foot position

---

## 16. Mathematical Utilities

Create reusable functions for:

- Distance between points
- Midpoint between points
- Joint angle from three points
- Segment angle relative to horizontal
- Angular difference
- Linear velocity
- Angular velocity
- Acceleration estimate
- Smoothing noisy time-series data
- Normalized displacement
- Confidence aggregation

Example:

```ts
export function calculateJointAngle(
  a: Point,
  vertex: Point,
  c: Point
): number | null;
```

Use smoothing carefully. Preserve meaningful movement while reducing frame-to-frame landmark noise.

A simple moving average, exponential smoothing, or Savitzky-Golay-style approach may be used.

---

## 17. Rule-Based Analysis Engine

The MVP should use a deterministic rules engine.

Do not rely on a general-purpose AI model to directly determine whether a swing is mechanically good or bad.

### Rule Structure

```ts
interface AnalysisRule {
  id: string;
  title: string;
  category: AnalysisCategory;
  requiredCameraAngles: CameraAngle[];
  requiredPhases: SwingPhase[];
  requiredMeasurements: string[];
  evaluate: (context: AnalysisContext) => RuleResult;
}
```

```ts
interface RuleResult {
  status: "positive" | "attention" | "neutral" | "insufficient-data";
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  summary: string;
  explanation: string;
  evidence: EvidenceItem[];
  recommendations: string[];
  drillIds: string[];
}
```

### Analysis Categories

- Setup
- Balance
- Load
- Stride
- Lower body
- Rotation
- Sequencing
- Posture
- Head movement
- Front-side stability
- Finish

### Example Rule

```text
Rule: Excessive forward head movement

Required phases:
- Setup
- Maximum load
- Approximate contact

Measurement:
- Head displacement as a percentage of estimated body height

Possible result:
- Attention when displacement exceeds the initial configurable threshold

Feedback:
- The player's head moved forward more than expected from load to contact.
- Excessive drift may reduce adjustability and barrel consistency.

Recommendations:
- Load into the rear hip without allowing the upper body to continue forward.
- Maintain the head near the center of the stance through launch.

Drills:
- No-stride tee drill
- Chair-behind-rear-hip drill
- Balance-point swings
```

### Configurable Thresholds

Do not permanently hard-code all thresholds inside rule functions.

Store thresholds in structured configuration files so they can be changed after coach validation.

```ts
interface ThresholdRange {
  min?: number;
  max?: number;
  idealMin?: number;
  idealMax?: number;
}
```

Label early thresholds as experimental.

---

## 18. Feedback Prioritization

Do not show the user a long list of every detected issue as the primary result.

The main results screen should prioritize:

1. Highest-impact opportunity
2. Secondary opportunity
3. Positive movement pattern to maintain

Additional observations can appear under a detailed analysis section.

### Ranking Inputs

Rank findings by:

- Severity
- Confidence
- Estimated effect on overall movement
- Whether the finding appears across multiple phases
- Whether the camera angle supports the finding

Low-confidence issues should not outrank high-confidence observations.

---

## 19. Coaching Language

Feedback should be clear and measured.

Preferred language:

- Possible issue
- Observed movement pattern
- Estimated angle
- The video suggests
- This may affect
- Consider working on
- Moderate-confidence observation

Avoid absolute claims such as:

- Your swing is wrong
- This is definitely causing strikeouts
- This will prevent injury
- This guarantees more power

### Feedback Structure

Every finding should include:

- What was observed
- Why it may matter
- Supporting measurement
- Confidence level
- How to improve it
- Suggested drills
- A positive or neutral coaching tone

---

## 20. Drill Library

Create a local drill library stored as typed JSON or TypeScript data.

### Drill Schema

```ts
interface Drill {
  id: string;
  name: string;
  categories: AnalysisCategory[];
  purpose: string;
  instructions: string[];
  cues: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  commonMistakes: string[];
  relatedRuleIds: string[];
}
```

### Initial Drill Examples

- No-stride tee drill
- Walk-through drill
- Step-back drill
- Chair-behind-rear-hip drill
- Balance-point swings
- Slow-motion dry swings
- Separation drill
- Front-side stability drill
- Top-hand and bottom-hand tee work
- Connection-ball drill
- Offset open-stance drill
- Pause-at-launch drill

Do not include drills that require unsafe or specialized equipment without warnings.

---

## 21. Results Dashboard

### Summary Header

Display:

- Player label
- Hitting side
- Swing type
- Analysis date
- Overall analysis confidence
- Camera-angle quality

### Primary Results

Show three prominent cards:

- Primary opportunity
- Secondary opportunity
- Strength to maintain

### Detailed Sections

- Setup and balance
- Load and stride
- Rotation and sequencing
- Contact position
- Finish
- Measurements
- Confidence and limitations
- Recommended drills

### Measurement Presentation

Use large numeric typography and clear labels.

Example:

```text
21°
Hip–shoulder separation
Moderate confidence
```

Include short explanations rather than displaying unexplained numbers.

---

## 22. Confidence System

Every analysis should include confidence.

### Confidence Levels

- High
- Moderate
- Low
- Insufficient data

### Inputs

Confidence may depend on:

- Average landmark visibility
- Number of usable frames
- Camera-angle match
- Video resolution
- Motion blur
- Body visibility
- Phase-detection confidence
- Measurement consistency

### Important Behavior

When confidence is low:

- Clearly label it
- Explain why
- Avoid strong recommendations
- Suggest how to record a better video

---

## 23. Local Storage

Use IndexedDB through Dexie for optional local analysis history.

### Store

- Analysis metadata
- Selected key-frame timestamps
- Measurement results
- Findings
- Drill recommendations
- User-created label
- Small preview image, optional

### Avoid Storing by Default

- Full original videos
- Large extracted frame sets

Provide a clear option to save the full video locally only if practical and explicitly selected.

### Privacy Controls

Allow the user to:

- Delete one analysis
- Delete all local data
- Export analysis data
- Continue without saving

---

## 24. Exporting Results

The MVP should allow export as:

- JSON
- Printable HTML report
- PDF through the browser print dialog

The report should include:

- Player information
- Analysis date
- Key frames
- Top findings
- Important measurements
- Confidence notes
- Recommended drills
- Product disclaimer

Do not require a server to generate the report.

---

## 25. Swiss International Design System

Use Swiss International design principles.

### Visual Characteristics

- Strong grid
- Left-aligned typography
- Large headings
- Bold sans-serif type
- Generous white space
- Functional hierarchy
- Minimal decoration
- Thin rules and separators
- Mostly black, white, and neutral gray
- One restrained accent color
- No gradients
- Minimal shadows
- Clear data visualization

### Suggested Font Stack

```css
font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
```

### Suggested Color Tokens

```css
:root {
  --color-background: #f4f3ef;
  --color-surface: #ffffff;
  --color-text: #111111;
  --color-muted: #666666;
  --color-border: #d7d5ce;
  --color-accent: #e23d28;
  --color-positive: #1f6f4a;
  --color-warning: #a45b00;
  --color-error: #a52424;
}
```

The exact values may be refined, but maintain a restrained visual system.

### Layout

- Desktop-first analysis workspace
- Responsive upload and results pages
- Maximum content width around 1280 to 1440 pixels
- Twelve-column grid where appropriate
- Persistent utility header on analysis screens
- Large, readable numbers
- Compact labels

### Accessibility

- WCAG AA contrast
- Keyboard-accessible controls
- Visible focus states
- Proper labels for all controls
- Reduced-motion support
- Captions or text descriptions for instructional graphics
- Do not use color as the only indicator of status

---

## 26. Responsive Behavior

The upload and results experiences should work on mobile devices.

The detailed frame-analysis workspace should be optimized for desktop and tablet.

On small screens:

- Stack panels vertically
- Keep video controls usable
- Use collapsible measurement sections
- Use bottom sheets or drawers for phase editing
- Avoid tiny timeline controls

Display a recommendation that detailed analysis is easier on a larger screen, but do not block mobile users.

---

## 27. Application State

Suggested Zustand stores:

```text
useUploadStore
useVideoStore
usePoseStore
usePhaseStore
useAnalysisStore
useHistoryStore
useSettingsStore
```

Avoid placing all application state into one large global store.

Persist only settings and analysis history that benefit from persistence.

---

## 28. Suggested Data Models

```ts
type HittingSide = "right" | "left";

type PlayerLevel =
  | "youth"
  | "middle-school"
  | "high-school"
  | "college"
  | "adult";

type SwingType =
  | "tee"
  | "front-toss"
  | "soft-toss"
  | "batting-practice"
  | "machine"
  | "live-pitch"
  | "game";

type SwingPhase =
  | "setup"
  | "load"
  | "stride"
  | "foot-plant"
  | "launch"
  | "rotation"
  | "contact"
  | "extension"
  | "finish";
```

```ts
interface AnalysisSession {
  id: string;
  createdAt: string;
  player: PlayerProfile;
  video: VideoMetadata;
  phases: PhaseSelection[];
  measurements: MeasurementResult[];
  findings: AnalysisFinding[];
  overallConfidence: number;
  version: string;
}
```

Use schema versioning so saved analyses can be migrated later.

---

## 29. Error Handling

Create user-friendly error states for:

- Unsupported video format
- Video too large
- Video too long
- Browser cannot decode video
- Pose model fails to load
- No person detected
- Multiple people detected
- Body not fully visible
- Poor landmark confidence
- Processing canceled
- Out-of-memory error
- IndexedDB unavailable
- Export failure

Every error should explain the next action the user can take.

---

## 30. Performance Requirements

### Goals

- Initial page should load quickly
- Pose model should load only when needed
- Large processing dependencies should be code-split
- UI must remain responsive during analysis
- Avoid storing large duplicate frame images
- Revoke object URLs when no longer needed
- Release canvases and video resources after analysis

### Techniques

- Dynamic import of MediaPipe modules
- Web Workers
- RequestIdleCallback where appropriate
- Memoized derived measurements
- Frame downscaling before pose inference
- Adaptive sampling
- IndexedDB rather than localStorage for larger data

---

## 31. Privacy and Security

### MVP Privacy Policy

The application should state:

- Videos are processed locally in the browser
- Videos are not uploaded by default
- Analysis history remains on the user's device
- Clearing browser data may delete saved analyses
- Users can delete saved analysis data at any time

### Security Requirements

- Never expose private API keys in the frontend
- Never place secrets in Vite environment variables that are shipped to the client
- Validate all imported JSON
- Escape user-provided labels
- Use a strict Content Security Policy where practical
- Do not execute content from uploaded files

---

## 32. Disclaimer

Include a visible disclaimer:

> This tool provides estimated movement observations from video and is intended for educational and coaching support. Results may be affected by camera angle, video quality, occlusion, and model limitations. It is not a substitute for professional coaching, medical advice, or injury evaluation.

Require no legal agreement for normal use, but make the limitation easy to find.

---

## 33. Suggested Repository Structure

```text
baseball-swing-analyzer/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-pages.yml
├── public/
│   ├── models/
│   ├── icons/
│   └── sample-videos/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── video/
│   │   ├── analysis/
│   │   ├── results/
│   │   ├── drills/
│   │   └── common/
│   ├── features/
│   │   ├── upload/
│   │   ├── pose-detection/
│   │   ├── phase-detection/
│   │   ├── measurements/
│   │   ├── rules-engine/
│   │   ├── reports/
│   │   └── history/
│   ├── workers/
│   │   └── pose.worker.ts
│   ├── data/
│   │   ├── drills.ts
│   │   ├── rules.ts
│   │   └── thresholds.ts
│   ├── hooks/
│   ├── lib/
│   │   ├── geometry.ts
│   │   ├── smoothing.ts
│   │   ├── confidence.ts
│   │   ├── video.ts
│   │   └── storage.ts
│   ├── stores/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   ├── types/
│   └── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── README.md
└── LICENSE
```

---

## 34. Routing

Suggested routes:

```text
/
/recording-guide
/analyze
/analyze/setup
/analyze/process
/analyze/review
/results/:analysisId
/history
/drills
/privacy
/about
```

GitHub Pages does not provide normal server-side fallback routing.

Either:

1. Use `HashRouter`, or
2. Add a GitHub Pages single-page application fallback strategy.

Use `HashRouter` for the simplest and most reliable MVP deployment.

---

## 35. GitHub Pages Configuration

### Vite Base Path

Configure the Vite base path using the repository name.

Example:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/baseball-swing-analyzer/",
});
```

If deployed to a custom domain or a user root site, update the base path accordingly.

### GitHub Pages Deployment Workflow

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run checks
        run: npm run check

      - name: Build
        run: npm run build

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

### Continuous Integration Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test -- --run

      - name: Build
        run: npm run build
```

### Suggested Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "check": "npm run typecheck && npm run lint && npm run test -- --run"
  }
}
```

---

## 36. Testing Strategy

### Unit Tests

Test:

- Geometry utilities
- Joint-angle calculations
- Normalization
- Smoothing
- Velocity calculations
- Phase-detection utilities
- Rule evaluation
- Confidence calculations
- Threshold configuration

### Component Tests

Test:

- Upload form
- Video validation
- Phase marker controls
- Finding cards
- Confidence labels
- Error states
- Local history controls

### End-to-End Tests

Test:

1. User opens the application
2. User reads recording guide
3. User uploads a supported sample video
4. User enters player details
5. Processing completes using mocked pose results
6. User reviews phases
7. Results appear
8. User exports a report
9. User saves and deletes local analysis history

Use mocked pose data for reliable automated tests.

---

## 37. Validation with Coaches

The numerical thresholds and coaching interpretations must be reviewed by qualified baseball coaches.

Create a validation process:

1. Collect representative swing videos with permission
2. Have multiple coaches independently review the swings
3. Run the application analysis
4. Compare findings
5. Identify false positives and false negatives
6. Update thresholds
7. Document which rules are validated
8. Version analysis rules

Do not present unvalidated thresholds as established biomechanical truth.

---

## 38. Development Milestones

### Milestone 1: Foundation

- Initialize React, TypeScript, and Vite
- Add routing
- Add Swiss design tokens
- Add linting, tests, and CI
- Add GitHub Pages deployment
- Build landing page and recording guide

### Milestone 2: Video Workspace

- Add video upload
- Validate video files
- Add player information form
- Add video playback
- Add timeline scrubbing
- Add frame stepping

### Milestone 3: Pose Detection

- Integrate MediaPipe Pose Landmarker
- Process sampled video frames
- Render pose overlay
- Add confidence handling
- Add cancellation and progress

### Milestone 4: Swing Phases

- Add automatic phase estimates
- Add manual key-frame selection
- Add phase markers to timeline
- Persist phase selections

### Milestone 5: Measurements

- Add geometry utilities
- Calculate body angles and displacement
- Add smoothing
- Add normalized measurements
- Add measurement confidence

### Milestone 6: Rules Engine

- Define analysis rules
- Add configurable thresholds
- Add finding ranking
- Add drill mappings
- Add insufficient-data handling

### Milestone 7: Results

- Build summary dashboard
- Show top two opportunities and one strength
- Add detailed measurement sections
- Add drill recommendations
- Add limitations and confidence explanations

### Milestone 8: Local History and Export

- Save analyses with IndexedDB
- Add history page
- Add deletion controls
- Add JSON export
- Add printable report

### Milestone 9: Quality and Launch

- Add sample swing
- Complete accessibility review
- Optimize performance
- Test mobile behavior
- Validate GitHub Pages deployment
- Add privacy and disclaimer pages
- Add coach-review notes for experimental rules

---

## 39. Future Enhancements

After the MVP is stable, consider:

- Custom bat-detection model
- Hand Landmarker integration
- Ball detection
- Side-by-side swing comparison
- Before-and-after analysis
- Coach annotations
- Voice notes
- Team workspaces
- Player profiles
- Cloud synchronization
- Shared reports
- Coach dashboards
- AI-generated coaching summaries
- AI-generated practice plans
- Mobile capture guidance
- Real-time camera analysis
- Three-dimensional multi-camera analysis
- Integration with bat sensors
- Integration with TrackMan or Rapsodo exports

---

## 40. Optional AI Integration

AI should be added only after the deterministic analysis pipeline works.

### Appropriate AI Uses

- Rewrite structured findings into player-friendly language
- Rewrite findings into coach-level detail
- Generate practice plans from approved drills
- Summarize an analysis
- Answer questions about measurements
- Compare two saved analyses

### Inappropriate AI Uses

Do not ask a general-purpose model to invent measurements from the video.

Do not trust a model to independently provide precise biomechanics without the structured measurement pipeline.

### Secure Architecture

Never expose an AI API key in the frontend.

Use a serverless function:

```text
Frontend sends structured measurements and findings
    ↓
Serverless function validates the request
    ↓
Serverless function calls AI provider
    ↓
AI returns coaching-language summary
    ↓
Frontend displays summary
```

Send structured analysis data rather than the full video whenever possible.

---

## 41. Definition of Done for MVP

The MVP is complete when:

- A user can upload a supported open-side swing video
- The app processes the video locally
- A pose overlay is visible
- The app identifies or allows manual selection of key swing phases
- The app calculates a focused set of movement measurements
- The app generates deterministic findings
- The app shows confidence for every important finding
- The app recommends relevant drills
- The user can save analysis data locally
- The user can export a printable report
- The app is accessible and responsive
- Automated tests pass
- GitHub Actions deploys the app to GitHub Pages
- No private key or backend is required
- The app clearly communicates its limitations

---

## 42. Instructions to Codex

Use this document as the source of truth.

### Coding Priorities

1. Correctness
2. Privacy
3. Maintainability
4. Clear user experience
5. Performance
6. Visual polish

### Implementation Expectations

- Use TypeScript strict mode
- Keep components small and focused
- Keep mathematical logic outside React components
- Add tests for analysis utilities
- Use typed schemas for persisted data
- Do not add unnecessary dependencies
- Do not add a backend to the MVP
- Do not expose secrets
- Use semantic HTML
- Maintain accessibility
- Handle errors explicitly
- Clearly mark experimental thresholds
- Keep all analysis logic explainable and deterministic

### Build Sequence

Do not attempt to build the entire product in one large pass.

Implement one milestone at a time. After each milestone:

1. Run type checks
2. Run linting
3. Run tests
4. Build the application
5. Fix all errors before continuing
6. Update the README with completed functionality

### Initial Codex Task

Begin with Milestone 1 only:

- Create the React, TypeScript, and Vite project
- Configure the repository structure
- Add React Router using HashRouter
- Add Swiss International design tokens
- Build the landing page
- Build the recording guide
- Add ESLint, Prettier, Vitest, and React Testing Library
- Add the CI workflow
- Add the GitHub Pages workflow
- Add a clear README
- Confirm `npm run check` and `npm run build` pass

Do not implement video analysis until the foundation is complete.

---

## 43. Product Name Placeholder

Use `SwingLab` as a temporary working name unless the repository already has a different name.

The name should be isolated in a central configuration file so it can be changed easily.

---

## 44. License

Use the MIT License unless the project owner specifies otherwise.

---

## Final Product Principle

The product should feel like a professional baseball performance tool, not a novelty AI demo.

Every measurement should be explainable. Every recommendation should be connected to visible evidence. Every limitation should be communicated honestly.
