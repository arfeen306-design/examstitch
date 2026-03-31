# Metallic Shine Transition

A crossfade with a diagonal gradient shine band that sweeps across the frame. Looks like a metallic light reflection wiping between scenes.

## Key Design Decision

Do **NOT** use `clipPath` for this transition. Earlier attempts used diagonal clip-path polygons to wipe one scene away while revealing the next. This consistently produced black slivers/gaps at the edges where the two clip regions didn't perfectly meet. The geometry is error-prone, especially with diagonal skew.

Instead, use a **simple crossfade + shine overlay**:
- Exiting scene fades out via opacity
- Entering scene fades in via opacity
- A gradient shine band sweeps left-to-right on top of the entering scene

This is visually indistinguishable from a true wipe at quick speeds (0.4s) and has zero clipping artifacts.

## Implementation

```tsx
import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { interpolate } from "remotion";

const MetallicSwooshPresentation: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
  const isEntering = presentationDirection === "entering";

  // Shine band position sweeps left to right
  const pos = interpolate(presentationProgress, [0, 1], [-20, 120]);

  // Simple crossfade: entering fades in, exiting fades out
  const opacity = isEntering
    ? interpolate(presentationProgress, [0, 0.4, 1], [0, 1, 1])
    : interpolate(presentationProgress, [0, 0.6, 1], [1, 1, 0]);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {children}
      {/* Metallic shine band — only on the entering scene */}
      {isEntering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(
              105deg,
              transparent ${pos - 14}%,
              rgba(255,255,255,0.0) ${pos - 9}%,
              rgba(255,255,255,0.15) ${pos - 5}%,
              rgba(200,218,240,0.5) ${pos - 2}%,
              rgba(255,255,255,0.85) ${pos}%,
              rgba(210,225,245,0.5) ${pos + 2}%,
              rgba(255,255,255,0.15) ${pos + 5}%,
              rgba(255,255,255,0.0) ${pos + 9}%,
              transparent ${pos + 14}%
            )`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export const metallicSwoosh = (): TransitionPresentation<Record<string, never>> => {
  return { component: MetallicSwooshPresentation, props: {} };
};
```

## How it works

1. **Crossfade timing is asymmetric** — entering scene reaches full opacity at 40% progress, exiting scene starts fading at 60%. This overlap keeps the frame fully covered at all times.
2. **Shine band** is a multi-stop linear-gradient at 105deg (slight diagonal). The center is near-white (0.85 opacity), flanked by soft blue-tinted highlights (`rgba(200,218,240)`) that taper to transparent. This creates the metallic/chrome reflection look.
3. **Sweep range is -20 to 120** so the band fully enters and exits the frame (not just 0-100 which would clip the gradient at edges).
4. **Shine only on entering scene** — putting it on both would double the intensity and look wrong.

## Usage

> **IMPORTANT:** Do NOT use `TransitionSeries` from `@remotion/transitions`. It crashes
> in Remotion 4.x with `TypeError: Cannot read properties of null (reading 'stack')` due
> to a bundler bug with null JSX props. Use the manual overlapping `Sequence` approach below.

### Working pattern — manual overlapping Sequences

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";

const T = 12; // transition overlap in frames (0.4s at 30fps)

// Crossfade wrapper — fades in for first T frames, out for last T frames
const Crossfade: React.FC<{
  children: React.ReactNode;
  duration: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}> = ({ children, duration, fadeIn = true, fadeOut = true }) => {
  const frame = useCurrentFrame();
  const inOpacity  = fadeIn  ? interpolate(frame, [0, T], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const outOpacity = fadeOut ? interpolate(frame, [duration - T, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inOpacity, outOpacity) }}>
      {children}
    </AbsoluteFill>
  );
};

// Metallic shine overlay — render in a separate Sequence at each transition point
const MetallicOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const pos = interpolate(frame, [0, T], [-20, 120]);
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(
        105deg,
        transparent ${pos - 14}%,
        rgba(255,255,255,0.0) ${pos - 9}%,
        rgba(255,255,255,0.15) ${pos - 5}%,
        rgba(200,218,240,0.5) ${pos - 2}%,
        rgba(255,255,255,0.85) ${pos}%,
        rgba(210,225,245,0.5) ${pos + 2}%,
        rgba(255,255,255,0.15) ${pos + 5}%,
        rgba(255,255,255,0.0) ${pos + 9}%,
        transparent ${pos + 14}%
      )`,
      pointerEvents: "none",
      zIndex: 100,
    }} />
  );
};

// In your main composition — scenes overlap by T frames, MetallicOverlay plays at each join
const D = { sceneA: 300, sceneB: 270 };
const S = { sceneA: 0, sceneB: D.sceneA - T };

export const MainPromo: React.FC = () => (
  <AbsoluteFill>
    {/* Scene A — no fade-in on first scene */}
    <Sequence from={S.sceneA} durationInFrames={D.sceneA} premountFor={30}>
      <Crossfade duration={D.sceneA} fadeIn={false}>
        <SceneA />
      </Crossfade>
    </Sequence>

    {/* Scene B — fades in / fades out */}
    <Sequence from={S.sceneB} durationInFrames={D.sceneB} premountFor={30}>
      <Crossfade duration={D.sceneB}>
        <SceneB />
      </Crossfade>
    </Sequence>

    {/* Metallic shine overlay — plays only during the T-frame transition window */}
    <Sequence from={S.sceneB} durationInFrames={T}>
      <MetallicOverlay />
    </Sequence>
  </AbsoluteFill>
);
```

## Recommended speed

Works best at **0.4s (12 frames at 30fps)**. At this speed the crossfade is barely noticeable and the shine band is the dominant visual. Slower speeds (0.7s+) make the crossfade more obvious.
