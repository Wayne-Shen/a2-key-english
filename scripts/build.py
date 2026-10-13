"""Copy validated course assets into a standalone, reproducible PWA."""
from pathlib import Path
import hashlib,json,shutil,struct,zlib
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
<link rel="apple-touch-icon" href="../icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="A2 Key">
<script src="../register.js" defer></script>
</head>''')
        text=text.replace('<div class="bottom-bar">','<div class="bottom-bar"><a href="../index.html" lang="zh-CN">离线下载与安装</a>')
        target.write_text(text)
    else:shutil.copy2(p,target)
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
shell=[asset(p) for p in sorted(DIST.rglob('*')) if p.is_file() and 'audio' not in p.relative_to(DIST).parts and p.name not in ('sw.js','assets.json','_headers')]
version=hashlib.sha256(json.dumps(shell+days,sort_keys=True).encode()+(DIST/'sw.js').read_bytes()).hexdigest()[:16]
(DIST/'assets.json').write_text(json.dumps({'version':version,'shell':shell,'days':days,'total_audio_bytes':sum(d['bytes'] for d in days)},ensure_ascii=False,separators=(',',':')))
print(json.dumps({'version':version,'lessons':len(days),'audio_files':sum(len([a for a in d['assets'] if a['kind']=='audio']) for d in days),'download_mb':round(sum(d['bytes'] for d in days)/1000000,1)}))
