# IG Marketing

Phone-first, deterministic social-ad production for Crestie King. The first
templates create a 720×1280 Instagram Story from one, two, or three original
gecko photos, description text, and a price. The single-photo template supports
landscape and vertical photos.

## Current application

- Version: 0.12.0
- Templates: `3 Photo Gecko Post`, `2 Photo Gecko Post`, and `1 Photo Gecko Post`.
- Original photos are only cropped, resized, and positioned.
- Protected anatomy may not be cropped; only the tail is an exception.
- Output is a PNG shared through the iOS share sheet or downloaded directly.
- The current design autosaves locally and can be downloaded as an editable
  `.geckopost` project containing its photos, crop positions, text, and styles.

Additional advertisement variants should be implemented as versioned templates
inside this repository rather than as separate repositories.
