## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Working rules: do not break existing functionality

This is an existing production web application. Golden rule: **do not break existing functionality to implement a new feature.** Make the smallest safe change, preserve everything unrelated, and test the affected feature plus related existing features before declaring a task complete.

### 1. Change only what is required
- Inspect the code first and understand how the relevant component works. Identify the exact files, components and dependencies the change needs, and modify only those.
- Do not refactor, rewrite, rename, reorganise or "clean up" unrelated code. Do not replace a working implementation with a preferred architecture unless asked.
- Treat all working functionality as protected. Do not change shared components, global styles, APIs, database logic, authentication, routing or configuration unless the request genuinely requires it.
- If you find an unrelated bug, do not fix it. Report it separately.
- Prefer the smallest diff that correctly solves the problem, isolated and easy to review or revert.

### 2. Before coding, decide
What is requested, which components are directly affected, which files change, which dependencies are affected, whether existing behaviour could change, and what needs regression testing. If a component can stay untouched, leave it.

### 3. Preserve existing behaviour
UI behaviour, API behaviour, database behaviour, authentication/authorisation, routes and responsive behaviour must stay unchanged unless the request requires otherwise. Do not modify or migrate existing data unnecessarily.

### 4. UI and styling
New or modified UI must work from phones to wide screens. Test at minimum ~320, ~375, ~768, ~1024, ~1440 px and a large/wide display. Avoid unintended horizontal scroll, overflowing text, broken layouts, elements outside the viewport, fixed widths that break small screens, tiny touch targets, and hover-only functionality.

### 5. Cross-platform
Consider Chrome, Safari, Firefox, Edge, iOS Safari and Android browsers. Avoid browser-specific code unless necessary; use progressive enhancement and graceful fallbacks.

### 6. Performance
Optimise new or modified code without changing the architecture: avoid unnecessary or duplicate requests and queries, excess re-renders, large bundles or images, needless DOM work, leaks and uncleaned listeners; cache, debounce, throttle or lazy-load where appropriate. Do not optimise prematurely or rewrite working code without evidence.

### 7. Accessibility
New or modified UI needs keyboard navigation, visible focus states, proper labels, semantic HTML, sufficient contrast, screen-reader-friendly controls, correct button/link semantics and touch-friendly controls.

### 8. Security
No hardcoded secrets, API keys in frontend code, unsafe HTML injection, unvalidated input, exposed credentials, unnecessary permissions or insecure storage of sensitive data. Preserve the existing security model.

### 9. Test before finishing
Verify the requested feature, related existing features, forms, buttons, navigation, API calls, error states and loading states; check mobile, tablet, laptop and desktop layouts and major browsers where practical; confirm no new JavaScript errors, unhandled promise rejections, framework warnings, failed network requests or CSS/layout errors, and no obvious performance regression.

### 10. Do not claim testing that was not done
Never say "everything works" unless it was tested. Report what was tested, where, what passed, what could not be tested and the remaining risks.

### 11. Dependencies
Do not add a dependency unless it is genuinely required and the existing stack or native browser functionality cannot solve the problem.

### 12. Database and API safety
Do not change schemas, API contracts, authentication or backend behaviour unless explicitly required. If required: identify all consumers, keep backward compatibility where possible, update affected consumers, test existing functionality and report the change clearly.

### 13. When something breaks
Stop. Identify the regression, revert or correct it, restore the previous behaviour, then implement the request with a safer approach. Do not build on top of a broken state.

### 14. Final response format
End every task with a concise summary:
- **Changed**: files/components modified and what changed.
- **Not changed**: important components intentionally left untouched.
- **Tested**: features tested, responsive testing, browser testing, console/errors.
- **Issues**: remaining problems or limitations.
