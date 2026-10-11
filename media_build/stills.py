import subprocess
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont
O='../assets/media/'
BG=(17,19,22)
def grab(src,t):
    subprocess.run(['ffmpeg','-loglevel','error','-y','-ss',str(t),'-i',src,'-frames:v','1','/tmp/_g.png'],check=True); return Image.open('/tmp/_g.png').convert('RGB')
def grade(im): im=ImageEnhance.Color(im).enhance(.9); return im
def fill169(im,W=1280,H=800):
    bg=im.copy(); s=max(W/bg.width,H/bg.height); bg=bg.resize((int(bg.width*s)+1,int(bg.height*s)+1)).filter(ImageFilter.GaussianBlur(28))
    bg=ImageEnhance.Brightness(bg).enhance(.35); bg=bg.crop(((bg.width-W)//2,(bg.height-H)//2,(bg.width-W)//2+W,(bg.height-H)//2+H))
    s=H/im.height; fg=im.resize((int(im.width*s),H),Image.LANCZOS); bg.paste(fg,((W-fg.width)//2,0)); return bg
def crop(im,cx,cy,w,ratio=1.6):
    h=int(w/ratio); x0=int(cx-w/2); y0=int(cy-h/2); return im.crop((x0,y0,x0+w,y0+h))
# ArUco measurement (vertical short)
a=grab('/tmp/ytv/2M2n8RWnKWY.mp4',5); fill169(grade(a)).save(O+'aruco-measure.webp',quality=82)
# Orange detection: crop center of frame
o=grab('/tmp/ytv/9RqJkD2Xtv8.mp4',8); print('orange',o.size); grade(crop(o,360,640,720)).resize((1280,800),Image.LANCZOS).save(O+'orange-detect.webp',quality=82)
# Chickens
c=grab('/tmp/ytv/LZNu74alOVY.mp4',20); grade(crop(c,960,600,1728)).resize((1280,800),Image.LANCZOS).save(O+'chicken-count.webp',quality=82)
# Paint: 3-up contact sheet on dark matte
M=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf',20)
srcs=[('/tmp/rp/paint11.png','peeling paint'),('/tmp/rp/paint13.png','paint drips / rust'),('/tmp/rp/paint9.png','pin holes')]
W,H=1280,800; sheet=Image.new('RGB',(W,H),BG); g=16; cw=(W-4*g)//3; ch=H-2*g-40
for i,(p,lab) in enumerate(srcs):
    im=Image.open(p).convert('RGB'); s=max(cw/im.width,ch/im.height); im=im.resize((int(im.width*s)+1,int(im.height*s)+1),Image.LANCZOS)
    im=im.crop(((im.width-cw)//2,(im.height-ch)//2,(im.width-cw)//2+cw,(im.height-ch)//2+ch))
    sheet.paste(grade(im),(g+i*(cw+g),g)); ImageDraw.Draw(sheet).text((g+i*(cw+g),H-g-28),lab.upper(),font=M,fill=(163,167,171))
sheet.save(O+'paint-defects.webp',quality=82)
o=grab('/tmp/ytv/9RqJkD2Xtv8.mp4',8); fill169(grade(o)).save(O+'orange-detect.webp',quality=82)
srcs=[('/tmp/rp/paint11.png','peeling paint · 0.94'),('/tmp/rp/paint9.png','pin holes · many small defects')]
sheet=Image.new('RGB',(W,H),BG); cw=(W-3*g)//2; ch=H-2*g-40
for i,(p,lab) in enumerate(srcs):
    im=Image.open(p).convert('RGB'); from PIL import ImageOps; bb=ImageOps.invert(im).point(lambda v:255 if v>25 else 0).getbbox(); im=im.crop(bb).crop((8,8,im.crop(bb).width-8,im.crop(bb).height-8)); s=min(cw/im.width,ch/im.height); im=im.resize((int(im.width*s),int(im.height*s)),Image.LANCZOS)
    x=g+i*(cw+g)+(cw-im.width)//2; y=g+(ch-im.height)//2; sheet.paste(grade(im),(x,y))
    ImageDraw.Draw(sheet).text((x,y+im.height+14),lab.upper(),font=M,fill=(163,167,171))
sheet.save(O+'paint-defects.webp',quality=82)
