# RAVO campaign assets

Generated with the built-in image_gen tool, September 2026. Fictional adult subjects; illustrative scenes, not customer testimonials.

- `public/images/ravo-shopping-ai.png`: Wide 3:1 photorealistic editorial hero. Two adult Middle Eastern women in their late twenties at a sunlit modern boutique, one holding a smartphone and shopping bag, smiling after earning a reward. Modest contemporary clothing, sky-blue accents, natural anatomy, faces inside frame. No text, logos or watermark.
- `public/images/ravo-reward-ai.png`: Landscape 3:2 photorealistic editorial photograph. Adult Middle Eastern woman about 28 at a sunny boutique checkout receiving a wrapped loyalty gift from an adult woman shopkeeper. Natural joy, smartphone back toward camera, warm wood, ceramics, plants, soft daylight. No text, logos, watermark or graphic overlays.

The hero is a responsive square, up to 600 × 600 CSS pixels. Its two photographs are framed using object-fit cover. The old wallet panel and floating cards were removed. A GSAP timeline creates an 11-second motion-graphics sequence using camera scaling, crossfades, SVG stroke drawing and text reveals. It is a browser-rendered motion graphic rather than an exported video file.

Playback pauses outside the viewport and in hidden tabs. A control below the square disables page motion. Reduced-motion preference renders the static first frame. GSAP matchMedia reverts animations on cleanup and preference changes.

Two additional CSS 3D scenes use GSAP ScrollTrigger: a two-sided loyalty coin and layered store panels. Section entrances also use ScrollTrigger. No WebGL runtime or extra dependencies were installed; the project already includes GSAP 3.15.0.

Implementation reference: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ and https://gsap.com/docs/v3/Plugins/ScrollTrigger/.

Validation: TypeScript and Vite production build passed; local homepage returned HTTP 200. Browser surfaces were unavailable, so desktop/mobile visual playback was not directly verified.
