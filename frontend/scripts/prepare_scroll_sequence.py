from pathlib import Path
from PIL import Image
import json

SOURCE_DIR = Path("/home/ubuntu/upload")
OUTPUT_DIR = Path("/home/ubuntu/webdev-static-assets/hh-goa-full-scroll-sequence")
FRAME_PATHS = sorted(SOURCE_DIR.glob("[0-9][0-9][0-9].png"), key=lambda path: int(path.stem))

if len(FRAME_PATHS) != 149:
    raise RuntimeError(f"Expected 149 numbered source frames, found {len(FRAME_PATHS)}")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
manifest = []

for index, source_path in enumerate(FRAME_PATHS):
    with Image.open(source_path) as image:
        rgb = image.convert("RGB")
        optimized = rgb.resize((1280, 720), Image.Resampling.LANCZOS)
        target_name = f"mic-sequence-{index:03d}.webp"
        target_path = OUTPUT_DIR / target_name
        optimized.save(target_path, "WEBP", quality=76, method=6)
        manifest.append({"source": source_path.stem, "file": target_name})

(OUTPUT_DIR / "sequence-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Prepared {len(manifest)} WebP frames in {OUTPUT_DIR}")
