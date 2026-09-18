#!/usr/bin/env python3
"""Bring photos dropped in images/upload/ into the site.

The filename is the caption. Each photo becomes a full-resolution master
in images/, a 2400px copy in images/web/ that the pages actually load,
and a 400px thumbnail in images/thumb/ for the grid. The PHOTOS list in
script.js is then regenerated from what is on disk.

    python3 tools/import.py                      # newest photo goes first
    python3 tools/import.py --value 49           # or place it explicitly
    python3 tools/import.py --slot 3             # or by position in the gallery
    python3 tools/import.py --replace 49 --file Replace.png
                                                 # swap one photo's picture,
                                                 # keeping its value and caption

Needs Pillow with WebP support.
"""

import argparse
import hashlib
import os
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required: pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTERS = os.path.join(ROOT, "images")
UPLOAD = os.path.join(MASTERS, "upload")
WEB = os.path.join(MASTERS, "web")
THUMB = os.path.join(MASTERS, "thumb")
SCRIPT = os.path.join(ROOT, "script.js")

VALUE = re.compile(r"Value\((\d+)\)(.+)\.webp$")
SOURCES = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp", ".gif"}

WEB_MAX, WEB_Q = 2400, 82
THUMB_MAX, THUMB_Q = 400, 78
MASTER_Q = 90


def masters():
    out = []
    for f in os.listdir(MASTERS):
        m = VALUE.match(f)
        if m:
            out.append((int(m.group(1)), f, m.group(2)))
    return sorted(out, key=lambda x: -x[0])


def pick_value(existing, args):
    used = {v for v, _, _ in existing}
    if args.value is not None:
        if args.value in used:
            sys.exit("Value %d is already taken." % args.value)
        return args.value

    if args.slot is not None:
        # Land between the photos either side of the requested position.
        vals = [v for v, _, _ in existing]
        slot = max(1, min(args.slot, len(vals) + 1))
        upper = vals[slot - 2] if slot >= 2 else None
        lower = vals[slot - 1] if slot - 1 < len(vals) else None
        if upper is None:
            return vals[0] + 1
        if lower is None:
            return max(1, upper - 1)
        gap = [n for n in range(lower + 1, upper) if n not in used]
        if not gap:
            sys.exit(
                "No free value between %d and %d — renumber a neighbour first."
                % (lower, upper)
            )
        return gap[len(gap) // 2]

    return (max(used) + 1) if used else 1


def derive(path, value):
    caption = os.path.splitext(os.path.basename(path))[0].strip()
    if not caption:
        sys.exit("Cannot read a caption from %r" % path)
    return "Value(%d)%s.webp" % (value, caption), caption


def load(path):
    img = ImageOps.exif_transpose(Image.open(path))
    if img.mode in ("RGBA", "LA", "P"):
        # Flatten onto white, matching the page. Converting straight to
        # RGB would composite any transparency onto black instead.
        img = img.convert("RGBA")
        flat = Image.new("RGB", img.size, (255, 255, 255))
        flat.paste(img, mask=img.getchannel("A"))
        return flat
    return img.convert("RGB")


def write_sizes(src_img, name):
    master = os.path.join(MASTERS, name)
    src_img.save(master, "WEBP", quality=MASTER_Q, method=6)

    for folder, cap, q in ((WEB, WEB_MAX, WEB_Q), (THUMB, THUMB_MAX, THUMB_Q)):
        os.makedirs(folder, exist_ok=True)
        copy = src_img.copy()
        copy.thumbnail((cap, cap), Image.LANCZOS)
        copy.save(os.path.join(folder, name), "WEBP", quality=q, method=6)

    return master


def regenerate_photo_list():
    lines = ["const PHOTOS = ["]
    for value, name, caption in masters():
        path = os.path.join(WEB, name)
        w, h = Image.open(path).size
        # Tag each photo with a hash of its own bytes. Replacing a picture
        # keeps its filename, so without this the browser and the CDN would
        # go on serving the old one from cache.
        with open(path, "rb") as fh:
            tag = hashlib.md5(fh.read()).hexdigest()[:8]
        lines.append(
            '  { src: "images/web/%s?v=%s", title: "%s", ar: %.4f },'
            % (name, tag, caption, w / h)
        )
    lines.append("];")

    source = open(SCRIPT).read()
    updated = re.sub(r"const PHOTOS = \[.*?\n\];", "\n".join(lines), source, flags=re.S)
    open(SCRIPT, "w").write(updated)
    return len(lines) - 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--value", type=int, help="exact Value(n) to assign")
    ap.add_argument("--slot", type=int, help="position in the gallery, 1 = first")
    ap.add_argument("--replace", type=int, metavar="VALUE",
                    help="swap this photo's picture, keeping its value and caption")
    ap.add_argument("--file", help="which upload to use (default: the only one)")
    # The master written here is lossy WebP, so the uploaded file may be
    # the only lossless copy. Removing it is opt-in.
    ap.add_argument("--remove", action="store_true", help="delete the upload once imported")
    args = ap.parse_args()

    if not os.path.isdir(UPLOAD):
        sys.exit("No images/upload/ folder.")

    pending = sorted(
        f for f in os.listdir(UPLOAD)
        if os.path.splitext(f)[1].lower() in SOURCES
        and os.path.isfile(os.path.join(UPLOAD, f))
    )
    if args.file:
        if args.file not in pending:
            sys.exit("%r is not in images/upload/ (found: %s)" % (args.file, ", ".join(pending)))
        pending = [args.file]

    if not pending:
        print("Nothing to import.")
        return

    if args.replace is not None:
        if len(pending) != 1:
            sys.exit("Replacing needs one source — pass --file to choose between: %s"
                     % ", ".join(pending))
        match = [m for m in masters() if m[0] == args.replace]
        if not match:
            sys.exit("No photo has Value(%d)." % args.replace)
        _, name, caption = match[0]

        path = os.path.join(UPLOAD, pending[0])
        img = load(path)
        before = os.path.getsize(os.path.join(WEB, name))
        write_sizes(img, name)

        print("%s" % pending[0])
        print("  -> replaces the picture in %s" % name)
        print("  caption kept: %s" % caption)
        print("  source:  %dx%d" % (img.width, img.height))
        print("  web:     %.0f KB (was %.0f KB)"
              % (os.path.getsize(os.path.join(WEB, name)) / 1024, before / 1024))

        if args.remove:
            os.remove(path)

        print("\nscript.js rebuilt: %d photos" % regenerate_photo_list())
        return

    for upload in pending:
        path = os.path.join(UPLOAD, upload)
        existing = masters()
        value = pick_value(existing, args)
        name, caption = derive(path, value)

        img = load(path)
        before = os.path.getsize(path)
        write_sizes(img, name)

        print("%s" % upload)
        print("  -> %s" % name)
        print("  caption: %s" % caption)
        print("  source:  %dx%d, %.1f MB" % (img.width, img.height, before / 1048576))
        print("  master:  %.1f MB" % (os.path.getsize(os.path.join(MASTERS, name)) / 1048576))
        print("  web:     %.0f KB" % (os.path.getsize(os.path.join(WEB, name)) / 1024))
        print("  thumb:   %.0f KB" % (os.path.getsize(os.path.join(THUMB, name)) / 1024))

        # Only the first photo of a batch can honour an explicit position;
        # the rest stack above so a multi-file drop keeps its order.
        args.value = None
        args.slot = None

        if args.remove:
            os.remove(path)

    total = regenerate_photo_list()
    print("\nscript.js rebuilt: %d photos" % total)
    order = [str(v) for v, _, _ in masters()]
    print("order: " + ", ".join(order))


if __name__ == "__main__":
    main()
