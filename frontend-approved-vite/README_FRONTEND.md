# HH Goa Voice RAG — Approved Frontend Source

This folder contains the approved **Field Notes / Signal** frontend created for HH Goa 2026 Task 2. It includes the frozen React/Vite source, the 100-frame microphone scroll experience, the editorial voice station interface, and the associated local configuration files.

The source is intentionally delivered separately as `frontend-approved-vite` so it does not overwrite the existing Next.js frontend already present in the Windows project folder. The original live frontend remains unchanged.

## Included

The package contains `client/` with all React pages, components, styles, hooks, frame references, and public configuration. It also contains the Vite, TypeScript, component, package, and lockfile configuration that belongs to the approved frontend source.

## Important runtime note

The visual frontend uses remote `/manus-storage/...` image URLs for the user-supplied microphone-frame sequence. Those assets are referenced directly in the source and are not duplicated inside this package. The frozen frontend is a presentation/UI source package; the paused local Python RAG backend is not included or modified by this delivery.
