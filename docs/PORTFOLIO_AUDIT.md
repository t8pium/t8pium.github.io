# Portfolio audit — September 2026

## Scope and baseline

Reviewed all 87 tracked files at `959743bb676984b724735b712af1d82191e7fab9`: 26 HTML routes, shared and obsolete CSS/JavaScript, project illustrations, research Python scripts and frozen CSV outputs, documentation, and repository configuration. Inspected the original live homepage before changing its design. There was no frontend framework, package manifest, production build, or continuous validation workflow.

## Main problems

- The oversized, densely wrapped hero pushed useful work down the page. Academic scores appeared before the engineering evidence.
- Several overlapping stylesheets and old mobile/animation overrides made the visual system inconsistent. Some subpages did not load the same styles or fonts.
- The robotic-hand illustration implied a live demo and fetched an unrelated external model thumbnail. The portfolio supplied no public demonstration video.
- Repeated project tiles gave very different projects the same weight. The research was substantial but difficult to enter and scan.
- Six writing pages were short topic outlines, not completed essays. Their old presentation did not make that distinction clear.
- Research source links referenced obsolete directories; CSV links pointed to files absent from the maintained repository. Copied setup commands contained literal newline escapes and an incorrect directory name.
- Fonts depended on a third-party service; mobile menus, focus handling, motion preferences, image sizing, table access, social metadata and direct-route consistency needed attention.
- An incomplete duplicate Instagram archiver directory contained tests for a missing application module. Its maintained public repository already existed separately.

## Changes and design decisions

Retained the dark background, warm accent, existing identity mark, technical interests, personal voice, academic record, and all original public routes. Reduced the hero to two short lines with a clear explanation of the work. Moved selected projects above the background material.

The research gets an editorial feature with actual published evidence, two visual projects share a smaller comparison row, and utility projects use concise text rows. This hierarchy follows the available substance. It avoids turning everything into a card or inventing project screenshots.

The robotic hand now has an explicitly labeled signal-flow sketch. Existing dice artwork was simplified. Small borders, modest radii, restrained type sizes and short hover transitions replace decorative effects. The homepage has no entrance animations, particles, counters, live-stat API or generic slogan about innovation.

Project and experiment pages share navigation, spacing, accessible table regions and metadata. Research numbers and methods remain unchanged; broken links now reach verified source files or the frozen local CSVs. Writing remains available and is honestly marked as working outlines.

Removed obsolete presentation files and the incomplete duplicate archiver staging directory. Added local licensed fonts, a designed social image, a custom 404, canonical/social metadata, robots and sitemap files, a dependency-free static exporter, regression checks and a GitHub Actions validation workflow.

## Accessibility and performance

- Semantic headings, skip links, visible keyboard focus, descriptive links and image alternatives.
- Mobile disclosure navigation: Escape, outside-click, focus departure, resize and destination focus handling.
- Content and navigation remain usable without JavaScript. Academic detail uses native `details`.
- Explicit image dimensions, lazy secondary images, self-hosted WOFF2 fonts and no automatic third-party requests.
- Readable table text with keyboard-focusable horizontal scrolling, avoiding whole-page overflow.
- Reduced-motion CSS disables transitions and smooth scrolling.
- No runtime packages, framework hydration or data-fetch dependency. JavaScript only enhances navigation.

## Verification

Structural checks cover every HTML route, local links and anchors, metadata, image attributes, ARIA references, SVG parsing and CSS asset URLs. Regression checks verify preserved deep links, static content access and SHA-256 equality of original research scripts and CSVs. Production export and JavaScript syntax are checked separately.

Browser review results will be recorded here after the live deployment is inspected. The local HTTP server runs, but the provided remote browser cannot access local addresses; rendered testing uses the public GitHub Pages deployment.

## Deliberately unchanged and remaining limits

- Published research algorithms and results were not recalculated or rewritten. The original snapshot is preserved byte for byte and protected by a hash manifest. Raw market data is not part of this portfolio.
- The public Nasdaq proxy replication remains separate and pending review. It is not presented as a validated replacement for the MNQ study.
- No experience, qualifications, project adoption, stars, testimonials or performance claims were invented.
- Private keyboard source remains private. Robotics has no linked public source or demonstration video. Six writing outlines remain outlines; completing them requires the author's work.
- Plain static HTML and GitHub Pages remain the architecture. A framework migration would add cost without solving the actual problems.
