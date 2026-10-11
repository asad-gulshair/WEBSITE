from PIL import Image, ImageDraw, ImageFont, ImageOps
im=Image.open('/tmp/rp/pot_out.jpg').convert('RGB')
# locate leaf tiles: non-white columns/rows under text area
import numpy as np
a=np.asarray(im).astype(int); dark=(a.sum(2)<600)
cols=dark[60:200].mean(0); rows=dark[:, 30:170].mean(1)
def runs(v,th=.25):
    r=[];s=None
    for i,x in enumerate(v):
        if x>th and s is None: s=i
        if x<=th and s is not None:
            if i-s>40: r.append((s,i))
            s=None
    if s is not None and len(v)-s>40: r.append((s,len(v)))
    return r
cx=runs(cols); ry=runs(rows); print(cx,ry)
labels=[('Late blight','Late blight','99.93%'),('Early blight','Early blight','99.99%'),('Early blight','Early blight','100.0%'),
        ('Early blight','Early blight','100.0%'),('Early blight','Early blight','100.0%'),('Late blight','Late blight','99.6%')]
W,H=1280,800; g=16; sheet=Image.new('RGB',(W,H),(17,19,22)); d=ImageDraw.Draw(sheet)
M=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf',17)
tw=(W-4*g)//3; th=(H-3*g)//2
k=0
for r,(y0,y1) in enumerate(ry[:2]):
  for c,(x0,x1) in enumerate(cx[:3]):
    t=im.crop((x0,y0,x1,y1)); s=max(tw/t.width,th/t.height); t=t.resize((int(t.width*s)+1,int(t.height*s)+1),Image.LANCZOS)
    t=t.crop(((t.width-tw)//2,(t.height-th)//2,(t.width-tw)//2+tw,(t.height-th)//2+th))
    X=g+c*(tw+g); Y=g+r*(th+g); sheet.paste(t,(X,Y))
    act,pred,p=labels[k]; txt=f"{pred.lower()} {p}"; L=d.textlength(txt,font=M)
    d.rectangle([X+10,Y+10,X+26+L,Y+38],fill=(10,11,13)); d.rectangle([X+10,Y+10,X+13,Y+38],fill=(141,184,106)); d.text((X+20,Y+14),txt,font=M,fill=(237,235,230))
    t2=f"true: {act.lower()}"; L2=d.textlength(t2,font=M); d.rectangle([X+10,Y+th-38,X+26+L2,Y+th-10],fill=(10,11,13)); d.text((X+20,Y+th-34),t2,font=M,fill=(163,167,171))
    k+=1
sheet.save('../assets/media/potato-predictions.webp',quality=84)
c=Image.open('/tmp/rp/pot_acc.jpg').convert('RGB'); c=c.crop((10,60,c.width-10,c.height-20)); c.save('../assets/media/potato-curves.webp',quality=88)
