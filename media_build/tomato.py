import json, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
SRC='/workspace/cv_reels/v2/src/7002247.mp4'; D=json.load(open('/workspace/cv_reels/v2/det/tom_7002247.json'))
W,H=1280,720; S=W/1920
fr={f['frame']:f['dets'] for f in D['frames']}; keys=sorted(fr)
MONO=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf',15)
try: MONO.set_variation_by_name('Medium')
except Exception: pass
COL={'Fully-ripe':(232,116,59),'Semi-ripe':(210,176,106),'Unripe':(141,184,106)}
NAME={'Fully-ripe':'ripe','Semi-ripe':'turning','Unripe':'unripe'}
dec=subprocess.Popen(['ffmpeg','-loglevel','error','-i',SRC,'-t','8','-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','29.97','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','27','-preset','slow','-movflags','+faststart','-an','../assets/media/tomato-grading.mp4'],stdin=subprocess.PIPE)
i=0; poster=None
while True:
  b=dec.stdout.read(W*H*3)
  if len(b)<W*H*3: break
  im=Image.fromarray(np.frombuffer(b,np.uint8).reshape(H,W,3))
  im=ImageEnhance.Color(im).enhance(.9)
  a=np.asarray(im).astype(np.float32); a=10+a*(245/255); im=Image.fromarray(a.clip(0,255).astype(np.uint8))
  k=min(keys,key=lambda x:abs(x-i)); d=ImageDraw.Draw(im,'RGBA'); used=[]
  for det in fr[k]:
    if det['conf']<.7: continue
    x0,y0,x1,y1=[v*S for v in det['xyxy']]; c=COL[det['cls']]
    d.rectangle([x0,y0,x1,y1],outline=c+(255,),width=2)
    t=f"{NAME[det['cls']]} {det['conf']:.2f}"; tw=d.textlength(t,font=MONO)
    ty=y0-22 if y0>24 else y0+2
    R=(x0,ty,x0+tw+12,ty+20)
    if any(not(R[2]<u[0] or R[0]>u[2] or R[3]<u[1] or R[1]>u[3]) for u in used): continue
    used.append(R)
    d.rectangle(R,fill=(10,11,13,230)); d.rectangle([x0,ty,x0+3,ty+20],fill=c+(255,))
    d.text((x0+8,ty+2),t,font=MONO,fill=(237,235,230))
  enc.stdin.write(im.tobytes())
  if i==60: poster=im.copy()
  i+=1
enc.stdin.close(); enc.wait()
poster.save('../assets/media/tomato-grading.webp',quality=80)
print(i,'frames')
