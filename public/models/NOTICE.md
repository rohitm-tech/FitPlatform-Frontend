# Anatomy model provenance

body.glb and skin.glb were copied unchanged from the supplied GymBuddy reference project's frontend/public/models on 2026-10-31.

GymBuddy identifies body.glb as Z-Anatomy human anatomy, CC BY-SA 4.0. Attribution: Z-Anatomy contributors, https://www.z-anatomy.com/ ; license: https://creativecommons.org/licenses/by-sa/4.0/ . skin.glb is GymBuddy's generated skin wrapper (frontend/scripts/build-skin.mjs).

Rhythm changes the rendering and muscle-key mapping in source code; the GLB bytes remain unchanged. The renderer splits the rectus-abdominis geometry into upper and lower regions in memory. No distinct female model was present in the reference; the UI offers muscle and skin layers of the supplied body instead.

The local Draco decoder files under /draco are copied from the installed three.js distribution (examples/jsm/libs/draco/gltf). Their embedded copyright and license notices are retained.
