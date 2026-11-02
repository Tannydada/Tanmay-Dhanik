#!/usr/bin/env python3
"""Builds dist/Sanghavi_and_Bafana_Website.html - one self-contained file (CSS, JS, fonts, images inlined as
data URIs). Works by double-click from disk, email attachment, or any host. No unpacking step at load time."""
import base64, mimetypes, os, re
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(here, p), encoding='utf-8').read()
def uri(path):
    mime = {'.webp':'image/webp','.woff2':'font/woff2'}[os.path.splitext(path)[1]]
    return f"data:{mime};base64," + base64.b64encode(open(os.path.join(here, path),'rb').read()).decode()
html, css, js = rd('index.html'), rd('styles.css'), rd('script.js')
css = re.sub(r'url\("(assets/[^"]+)"\)', lambda m: f'url("{uri(m.group(1))}")', css)
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css}\n</style>')
html = html.replace('<script src="script.js" defer></script>', f'<script>\n{js}\n</script>')
html = re.sub(r'(src|href)="(assets/[^"]+\.webp)"', lambda m: f'{m.group(1)}="{uri(m.group(2))}"', html)
html = re.sub(r'<link rel="preload" href="data:[^>]*>\n?', '', html)
os.makedirs(os.path.join(here,'dist'), exist_ok=True)
out = os.path.join(here,'dist','Sanghavi_and_Bafana_Website.html')
open(out,'w',encoding='utf-8').write(html)
print(out, round(os.path.getsize(out)/1024), 'KB')
