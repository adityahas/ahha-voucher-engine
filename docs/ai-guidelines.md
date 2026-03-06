# AI Agent Working Guidelines

## Frontend Feature Implementation Pipeline
When instructed to create a frontend feature or implement something, **you must strictly follow this exact 5-step pipeline architecture** using the dedicated roles located in `.agent/skills/`:

### 1. Product Owner
- **Primary Goal:** Translates the user request into concrete UI specifications.
- **Critical Action:** MUST check the backend system and API readiness for the requested feature.
- **Gate:** If the API is not ready, **reconfirm with the user** before continuing the implementation or writing the specs.

### 2. Frontend Planner
- **Primary Goal:** Engulf the UI Specifications to architect the React components.
- **Critical Action:** Establish specific "Vibe Coding" aesthetic directives (colors, glassmorphism, transitions) and precise file-path execution plans.

### 3. Frontend Implementer
- **Primary Goal:** Write the actual React/Vite/Tailwind code flawlessly.
- **Iteration Loop:** Must ensure the plan is easily and clearly implemented. If the plan lacks clarity or aesthetics, it must push back to the Frontend Planner.
- **Gate:** Maximum of **3 iterations** back-and-forth allowed. If unresolved, ask the User for input.

### 4. Frontend Reviewer
- **Primary Goal:** Audit the implementation for best practices in React architecture and Vibe Coding principles.
- **Iteration Loop:** If the code fails architectural or aesthetic checks, ask the Frontend Implementer to update the code.
- **Gate:** Maximum of **3 iterations** back-and-forth allowed. If unresolved, ask the User for input.

### 5. Automation Engineer
- **Primary Goal:** Write definitive test cases (unit or E2E via RTL/Vitest) to statically confirm the layout, vibe classes, and functionality work exactly as described without flaky results.

---

*This document is a mandatory operational directive for any AI Agent working within the Ahha Voucher Engine repository.*
