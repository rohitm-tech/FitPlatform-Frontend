# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Users
Athletes and coaches are equally important. Gym owners manage attendance and kiosks; admins approve staff access.
## Product Purpose
A connected coaching platform that turns workout, sleep and recovery data into daily athlete guidance and an actionable coach review queue.
## Operating Context
Athletes see today's plan, recovery context and a photo-capable AI coach. Assigned workouts are reviewed automatically on submission. Incoming recovery data triggers assessment. Coaches approve any proposed plan changes; AI never silently changes a coach-assigned plan.
## Capabilities and Constraints
React/Vite web application and separate Express/Mongoose API. Use Gemini backend-only, following JiraProj's structured AI response and validation patterns. User authorized reusing relevant AI environment credentials from JiraProj. Preserve Fitness database and authentication settings. Wearable connections require provider consent. Imported and seeded demo data must show provenance; do not pretend they are live device sync. Medical diagnoses are outside scope.
## Evidence on Hand
Fitness Platform Business & Technical Plan.pdf, supplied by user on 2026-10-31. Existing JiraProj backend AI implementation. GymBuddy real anatomy and skin GLBs already integrated into explorer. User rejects the incumbent UI and requests a substantial product redesign with purposeful animation.
## Product Principles
- Ground every metric and AI review in stored records.
- Rules constrain model output; coach approval controls plan changes.
- Make source, freshness, missing data and AI status visible.
- Give athlete next actions and coach exceptions equal priority.
