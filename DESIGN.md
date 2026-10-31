---
name: FitPlatform
description: Connected training, recovery, and human coaching
colors:
  primary: "#d32f2f"
  canvas: "#ffffff"
  canvas-dark: "#000000"
  surface: "#ffffff"
  surface-dark: "#0c0c0c"
  ink: "#161616"
  ink-dark: "#ffffff"
  muted: "#5a5a5a"
  muted-dark: "#b5b5b5"
  border: "rgba(0, 0, 0, 0.10)"
  border-dark: "rgba(255, 255, 255, 0.14)"
  attention: "#8a4e1d"
  ready: "#1b6b43"
typography:
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.7px"
  body:
    fontFamily: "Bricolage Grotesque, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "8px"
  surface: "16px"
spacing:
  compact: "8px"
  control: "16px"
  panel: "24px"
  desktop-gutter: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: FitPlatform

## Overview

**Creative North Star: "The Connected Training Day"**

The product connects the athlete’s recorded recovery, assigned session and automatic review. Coaches receive an evidence and approval workspace. This follows the user-selected timeline sketch at `.impeccable/reference/approved-timeline.html`.

**Key Characteristics:**
- White or black fields, with red reserved for the primary action.
- Visible data provenance, freshness and missing states.
- Human approval remains a distinct action.

## Colors

Light mode is a white field with near-black type. Dark mode is a black field with white type. Red owns the primary action, focus, and the main chart series. Muted green communicates readiness and warm brown communicates attention. Status always includes text. A Light / Dark control in the header and in Account settings stores the choice.

**The Evidence Rule.** Never let color substitute for a source, date or written state.

## Typography

Fraunces carries headlines and the wordmark. Bricolage Grotesque carries interface text. Workspace headings use the headline token; the marketing headline scales from 44px to 78px. Labels are smaller than body text, while mobile text inputs use 16px to avoid browser zoom.

## Layout

Workspaces have a 1440px maximum and 28px desktop gutters; phone gutters reduce to 20px. The athlete day is a single column: the next session, recovery chart and assigned sessions. The training companion opens from a button fixed at the bottom right, and is also reachable through the AI coach navigation. Coach roster and selected review sit side by side, then stack below 850px. Native horizontal scrolling is allowed within tables and navigation.

The landing page has a short headline, an illustrative product workflow, three connected scroll moments, AI examples and concise feature rows. It does not render a 3D body or claim live wearable authorization. Scroll-linked audience navigation follows athlete, coach, gym and marketplace sections. Catalogue previews come from the database, with demo content identified.

## Elevation & Depth

The working interface is mostly flat, separated by borders and tonal surfaces. Marketing uses one soft ambient shadow under the illustrative product preview. No glass blur, neon halo or hard-offset shadows.

## Shapes

Use gently rounded controls and larger surface corners from the token scale. Avatars are circular; status tags are compact, text-bearing shapes. Avoid nested decorative cards.

## Components

Athlete day: the next session, a recovery score with a 14-day sleep chart and session marks, assigned-session shortcuts, and the latest review. Missing readings use dashes. Demo data is labeled. The chart does not invent a strain score.

Coach review: roster, evidence, target session and concrete proposed set changes before approval. Weekly AI drafts are approved into templates; assignment is explicit in the builder.

Recovery form: manual entry and import are separated. Raw export JSON sits in an advanced disclosure. Errors are persistent, announced and focusable; typed values survive failures.

Training companion: persisted live conversation, camera/upload controls, image preview and authenticated private gallery. Photos carry descriptions. The user can remove a photo before sending.

Authentication: a quiet two-column lavender story and white form. Phones show the form first, with generous inputs, visible password controls, persistent focused errors and explicit demo credentials. Public registration creates athletes; staff access is approved by an admin.

Anatomy: dark studio canvas within the light shell; real GymBuddy GLBs, keyboard-accessible muscle selection, Muscles/Skin views, teal selection and warm-red heat-map tinting. It appears in the explorer and kiosk only.

Motion: GSAP ScrollTrigger drives the landing workflow; ScrollToPlugin handles pointer anchor scrolling with autoKill. useGSAP scopes and reverts effects. matchMedia disables the sequence for reduced motion. Native scrolling is preserved. Workspace arrivals are brief; tables and metrics stay still.

## Do's and Don'ts

- Do show source and date alongside recovery data.
- Do preserve native focus, keyboard controls and at least 44px mobile tap targets.
- Do show the concrete session affected before coach approval.
- Don't label imported or demo data as a live watch connection.
- Don't silently change a coach-assigned workout.
- Don't add anatomy imagery to the landing page.


## Shared header and workspaces

The header and product pages share a 1440px outer width, 28px desktop gutters and 20px phone gutters. Workspace headings use 28px/750 Manrope (25px on phones); controls have a 44px minimum. The compact white header keeps athlete destinations in the bar, including Muscle explorer. Explore exercises sits on that page, at the top right of the model. Other roles keep secondary tools under Tools. Recovery and account actions sit in the avatar menu. Mobile navigation expands into a labelled panel; Escape closes menus. Notifications use a bounded inbox with read state, timestamps and destination links.

The full AI workspace has a 260px conversation rail and a flexible message pane, with a single-pane history view on phones. Questions enter the transcript immediately and answers have their own pending/failed states. Search, archived conversations and gallery are useful work tools, not decorative card content.

Marketplace cards use flat typographic covers, clear price/scope and provider attribution. Demo badges stay visible. Paid, accepted and fulfilled are distinct states. Near you lists coaches and demo venues (pools, cricket grounds, turf, tracks) inside a radius, with package or slot rates and an OpenStreetMap view. A single coach result still opens the public profile. Demo rates stay labelled as a catalogue, not a live booking.

The muscle detail panel is a 360px content-height aside with a lavender identity header, clear close button, primary/supporting filter counts and separated exercise rows. Rows expose database equipment/difficulty and link to technique pages. On phones it flows below the model at full width. Empty, loading and retry states remain useful. Frequent filter actions do not animate.
