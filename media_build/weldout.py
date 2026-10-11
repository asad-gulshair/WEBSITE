from PIL import Image, ImageDraw, ImageFont, ImageEnhance
srcs=[('/tmp/wrepo/detected_weld_20251016_094910_094925.jpg','porosity'),('/tmp/wrepo/detected_weld_20251016_094910_1_095917.jpg','porosity · lack of fusion'),('/tmp/wrepo/WhatsApp_Image_2025-10-16_at_09.50.37_4a4a63f7.jpg','undercut · excess reinforcement')]
W,H=1280,800; g=16; sheet=Image.new('RGB',(W,H),(17,19,22)); d=ImageDraw.Draw(sheet)
M=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf',18)
cw=(W-3*g)//2; ch=H-2*g-40
L=[(g,g,cw,ch),(2*g+cw,g,cw,ch)]
srcs=srcs[:2]
for (p,lab),(x,y,w,h) in zip(srcs,L):
    im=Image.open(p).convert('RGB'); s=min(w/im.width,h/im.height); im=im.resize((int(im.width*s),int(im.height*s)),Image.LANCZOS); im=ImageEnhance.Color(im).enhance(.9)
    X=x+(w-im.width)//2; Y=y+(h-im.height)//2; sheet.paste(im,(X,Y)); d.text((X,Y+im.height+10),lab.upper(),font=M,fill=(163,167,171))
sheet.save('../assets/media/weld-outputs.webp',quality=86)
