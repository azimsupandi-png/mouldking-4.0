#!/usr/bin/env python3
"""Join app/src/main/js/*.js (in name order) into app/src/main/assets/app.js.

The app code is one closure, so the parts are plain text pieces of it: edit the parts,
then run this script (Gradle also runs it before every build). With --check it only
reports whether app.js is up to date (exit 1 if not)."""
import glob, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parts = sorted(glob.glob(os.path.join(root, 'app/src/main/js/*.js')))
text = ''.join(open(p, encoding='utf-8').read() for p in parts)
out = os.path.join(root, 'app/src/main/assets/app.js')
cur = open(out, encoding='utf-8').read() if os.path.exists(out) else None
if '--check' in sys.argv:
    sys.exit(0 if cur == text else 1)
if cur != text:
    open(out, 'w', encoding='utf-8').write(text)
    print('app.js rebuilt from %d parts' % len(parts))
