"""Builds the two small display fonts shipped with the game (src/fonts/*.woff2).

Only the characters used by titles, buttons, card names, races, sigils and skill names are kept (every CJK
character in index.html and src/js/*.js, plus cards.json), so the files stay small; question text keeps using
the system / Google font. Re-run after adding cards or UI text:

    python3 tools/fonts.py <dir with NotoSerifTC[wght].ttf and NotoSansTC[wght].ttf from github.com/google/fonts>
"""
import glob, json, os, re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'fonts-src')
CJK = re.compile(r'[⺀-鿿豈-﫿＀-￯　-〿‐-‧←-⇿■-◿]')

def charset():
    s = set()
    for f in [os.path.join(ROOT, 'index.html')] + glob.glob(os.path.join(ROOT, 'src/js/*.js')):
        s |= set(CJK.findall(open(f, encoding='utf-8').read()))
    for c in json.load(open(os.path.join(ROOT, 'public/data/cards.json'), encoding='utf-8'))['cards']:
        s |= set(c['name'] + c['race'] + c['sigil'])
    s |= set(chr(i) for i in range(0x20, 0x7F)) | set('×−–—·•…％＋「」『』【】（）、。，：；！？～◆◇')
    return ''.join(sorted(s))

def build(src, out, lo, hi, text):
    f = TTFont(src)
    opt = subset.Options(); opt.layout_features = ['kern', 'liga', 'vert', 'vrt2', 'locl']; opt.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]; opt.notdef_outline = True
    sub = subset.Subsetter(opt); sub.populate(text=text); sub.subset(f)
    f = instancer.instantiateVariableFont(f, {'wght': (lo, hi)})   # keep only the weights the game uses
    f.flavor = 'woff2'; f.save(out)
    print(os.path.basename(out), len(text), 'chars', os.path.getsize(out) // 1024, 'KB')

if __name__ == '__main__':
    text = charset(); dst = os.path.join(ROOT, 'src/fonts'); os.makedirs(dst, exist_ok=True)
    build(os.path.join(SRC, 'NotoSerifTC.ttf'), os.path.join(dst, 'fd-serif.woff2'), 600, 900, text)
    build(os.path.join(SRC, 'NotoSansTC.ttf'), os.path.join(dst, 'fd-sans.woff2'), 700, 900, text)
