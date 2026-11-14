import re, json
from pathlib import Path
from collections import Counter
files=list(Path('client/src').rglob('*.jsx'))+list(Path('client/src').rglob('*.tsx'))
items=Counter()
for p in files:
    s=p.read_text(errors='ignore')
    for m in re.finditer(r'>\s*([A-Z][A-Za-z][A-Za-z0-9 ,/&!?().:%+\-–—…]{2,100})\s*<', s):
        v=' '.join(m.group(1).split())
        if not re.search(r'[{}$]|className|return|function|const |Number\(|new Date', v): items[v]+=1
    for m in re.finditer(r'(?:aria-label|title|placeholder)\s*=\s*["\']([^"\']{3,120})["\']', s):
        v=' '.join(m.group(1).split())
        if not re.search(r'[{}$]', v): items[v]+=1
existing=set(re.findall(r'^\s*"((?:[^"\\]|\\.)+)":\s*\{', Path('client/src/lib/domLocalization.ts').read_text(), re.M))
phrases=[v for v,n in items.most_common() if v not in existing and len(v.split()) <= 16]
Path('/tmp/localization_phrases.json').write_text(json.dumps(phrases[:360], ensure_ascii=False, indent=2))
print('extracted', len(phrases[:360]))
