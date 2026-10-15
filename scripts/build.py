"""Copy validated course assets into a standalone, reproducible PWA."""
from pathlib import Path
import hashlib,json,re,shutil,struct,zlib
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'ket-a2-30day'
DIST=ROOT/'dist'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def asset(p,kind='shell'):
    url=p.relative_to(DIST).as_posix()
    if p.suffix=='.mp3':url+='?v='+digest(p)[:12]
    return {'url':url,'bytes':p.stat().st_size,'sha256':digest(p),'kind':kind}
# Only learner-facing files are copied. Credentials, logs and provider manifests stay outside dist.
(DIST/'html').mkdir(parents=True,exist_ok=True)
for p in (SOURCE/'html').iterdir():
    if p.suffix not in ('.html','.js','.css'):continue
    target=DIST/'html'/p.name
    if p.suffix=='.html':
        text=p.read_text()
        text=text.replace('</head>','''<link rel="manifest" href="../manifest.webmanifest">
<link rel="stylesheet" href="../word-review.css">
<script src="../word-review.js" defer></script>
<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="A2 Key">
<script src="../register.js" defer></script>
</head>''')
        text=text.replace('<div class="bottom-bar">','<div class="bottom-bar"><a href="../index.html" lang="zh-CN">离线下载与安装</a>')
        text=text.replace('<span id="slideGroup"', '<a class="word-review-link" data-word-review-link href="../word-review.html" lang="zh-CN">我的生词本</a><span id="slideGroup"')
        text=text.replace('<script src="app', '<script defer src="app')
        target.write_text(text)
    elif p.suffix=='.js' and p.name.startswith('app'):
        # Reuse the existing checker on selection changes, including keyboard changes.
        app=p.read_text()
        marker='inputs.push(radio)'
        assert app.count(marker)==1, f'Cannot attach automatic choice checking: {p.name}'
        app=app.replace(marker, marker+';radio.onchange=()=>{if(radio.checked)check.onclick()}')
        # Keys refer to option positions. Relabel after authored option rotations.
        option_loop='item.choices.forEach((choice,i)=>{'
        assert app.count(option_loop)==1, f'Cannot normalize option labels: {p.name}'
        app=app.replace(option_loop, r"item.choices.forEach((sourceChoice,i)=>{const choice=String.fromCharCode(65+i)+'. '+sourceChoice.replace(/^(?:[A-Z]\.\s*)+/,'');")
        # Personal review belongs to the PWA; preserve the completed source course.
        target.write_text(app+'\nif(typeof WordReview!==\'undefined\')WordReview.attachLesson(D,slides,show);\n')
    else:shutil.copy2(p,target)
# Canonical entries retain examples and primary days when marked on review slides.
words=[]
for day in range(1,31):
    data=json.loads((SOURCE/f'html/data/day{day:02d}.json').read_text())
    words.extend(dict(w,day=day) for w in data['new_vocabulary'])
assert len(words)==len({w['id'] for w in words})==1796
(DIST/'word-catalog.js').write_text('globalThis.A2WordCatalog='+json.dumps(words,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
# Copy real MP3 and exact downloadable transcripts, preserving relative paths.
for pattern in ('day*/*.mp3','day*/listening/*.mp3','scripts/day*/*.txt','scripts/day*/listening/*.txt'):
    for p in (SOURCE/'audio').glob(pattern):
        target=DIST/'audio'/p.relative_to(SOURCE/'audio');target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
# Native PNG icons without third-party imaging dependencies.
def png_icon(size):
    rows=[]
    for y in range(size):
        row=bytearray()
        for x in range(size):
            xx=x/size;yy=y/size;color=(52,85,220)
            if .23<xx<.77 and .3<yy<.70:color=(255,255,255)
            if .488<xx<.512 and .32<yy<.68:color=(52,85,220)
            if .28<xx<.45 and (.40<yy<.417 or .48<yy<.497 or .56<yy<.577):color=(178,195,244)
            if .55<xx<.72 and (.40<yy<.417 or .48<yy<.497 or .56<yy<.577):color=(178,195,244)
            if (.715<xx<.735 and .18<yy<.26) or (.685<xx<.765 and .21<yy<.23):color=(255,217,118)
            row.extend(color)
        rows.append(b'\0'+row)
    def chunk(k,data):return struct.pack('>I',len(data))+k+data+struct.pack('>I',zlib.crc32(k+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
(DIST/'icons').mkdir(exist_ok=True)
for filename,size in [('icon-192.png',192),('icon-512.png',512),('apple-touch-icon.png',180)]:
    (DIST/'icons'/filename).write_bytes(png_icon(size))
days=[]
for day in range(1,31):
    tag=f'day{day:02d}';data=json.loads((SOURCE/f'html/data/{tag}.json').read_text())
    audio=sorted((DIST/'audio'/tag).rglob('*.mp3'));scripts=sorted((DIST/'audio/scripts'/tag).rglob('*.txt'))
    assert len(audio)==11,(day,len(audio))
    assets=[asset(p,'audio') for p in audio]+[asset(p,'transcript') for p in scripts]
    days.append({'day':day,'title':data['title'],'page':'html/index.html' if day==1 else f'html/{tag}.html','assets':assets,'bytes':sum(a['bytes'] for a in assets)})
# Finder files and hosting markers are not learner assets and may not be published.
shell=[asset(p) for p in sorted(DIST.rglob('*')) if p.is_file() and 'audio' not in p.relative_to(DIST).parts and not any(part.startswith('.') for part in p.relative_to(DIST).parts) and p.name not in ('sw.js','assets.json','_headers')]
worker=(DIST/'sw.js').read_text()
worker,stamps=re.subn(r"const BUILD_VERSION='[a-f0-9]+';", "const BUILD_VERSION='__BUILD_VERSION__';", worker)
assert stamps==1, 'Missing service-worker build stamp'
version=hashlib.sha256(json.dumps(shell+days,sort_keys=True).encode()+worker.encode()).hexdigest()[:16]
(DIST/'sw.js').write_text(worker.replace('__BUILD_VERSION__',version))
(DIST/'assets.json').write_text(json.dumps({'version':version,'shell':shell,'days':days,'total_audio_bytes':sum(d['bytes'] for d in days)},ensure_ascii=False,separators=(',',':')))
print(json.dumps({'version':version,'lessons':len(days),'audio_files':sum(len([a for a in d['assets'] if a['kind']=='audio']) for d in days),'download_mb':round(sum(d['bytes'] for d in days)/1000000,1)}))
