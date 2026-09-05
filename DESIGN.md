# Portfolio design guidance

Source of truth: [Paper — Portfolio](https://app.paper.design/file/01M1A6W3ZWCX9WNC799QRXJGAF/1-0), specifically **mikes.cv — Style Reference** and **mikes.cv — Layout & Patterns**. Read through Paper MCP on September 5, 2026. These boards contain reference values; the file currently has no formal design tokens.

## Typography and palette

- Inter, weights 400 and 500, for headings, roles, and prose. IBM Plex Mono for dates and small metadata. Paper identifies these as the working substitutes for the reference site's private font aliases.
- Body baseline: 16px, approximately 25px line-height; tracking −0.0075em.
- Light background: `#FAF5F5`; dark background: `#191817`.
- Light headings: `#060606`; secondary text: `#434445`. Existing muted body text: `#6C6B67`.
- Dark headings: `#F5F3F0`; secondary text: `#B9B8B6`. Muted body text must remain readable; Work uses `#A09F9C`.
- Reference accent: `#3A53ED`, used sparingly. Work's current label uses `#9CAAFF` in dark mode for legibility.

## Layout and the user's approved Work pattern

- Information lives directly on the page. No decorative experience-card backgrounds, shadows, gradients, or highlight panels.
- Each Work entry stacks: circular company logo, company name with quiet date/current metadata, role, short description. All share the same left edge.
- Use the employer's actual logo; do not invent a second logo to imitate the reference's overlapping marks.
- Paper spacing guidance: 48–64px between groups, 12–16px between distinct elements, 4–6px for closely related metadata. Work uses 56px between desktop entries and 48px on mobile.
- Preserve the existing hero, Projects layout, sidebar, theme toggle, and their alignment unless explicitly asked to change them. Their approved sizes take precedence over a global restyling.
- Mobile uses the existing 24px gutters and the same stacked reading order.
- Work entries start at the same left edge as project videos; the Work heading retains its existing inset. Desktop rows span the same width as Projects, with a 220px media column on the right and a 32px gap. Entries without photos retain the same text width.
- Mibanco, Interbank, and Rappi user-provided photos use a native scroll-snap carousel: 220 × 140px on desktop and full-width × 200px on mobile, matching the project video frames. On mobile the gallery follows the description. Each slideshow has its own timer and slide index, advancing every two seconds while visible. Initial starts are staggered by 600ms per gallery. Hover, keyboard focus, and manual browsing affect only that gallery; a hidden browser tab pauses playback. Show only the photos, without buttons or a counter. Reduced motion disables autoplay and changes photos instantly. Keyboard navigation and native swiping remain available.

## Motion and interaction

- Each Work entry uses the same one-time scroll reveal as Projects: a 16px upward fade over 360ms, with the same easing and intersection threshold. Reduced motion shows entries immediately without transitions. The user requested removal of the footprint trail; do not reintroduce decorative scroll trails without an explicit request.
- Preserve reduced-motion behavior for the existing videos, project reveals, and theme interactions.
- Keep the site dependency-free and apply the mandatory skills from AGENTS.md. Avoid introducing alternate component-library aesthetics.

Future design changes should consult this document and the Paper reference boards together. The user's latest explicit instructions take precedence over earlier explorations on the Paper canvas.
