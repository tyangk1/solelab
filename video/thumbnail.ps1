# DesignCraft: YouTube thumbnail 1280x720 for the SOLE/LAB promo.
$ErrorActionPreference = 'Stop'
$D = "$env:LOCALAPPDATA\Programs\DesignCraft\designcraft-cli.exe"
$root = (Resolve-Path "$PSScriptRoot\..").Path -replace '\\', '/'
$cut = "$root/work/cut"
$a = @('run',
  '--cmd', 'file.new={"intent":"web","units":"pixels","width":1280,"height":720,"pages":1,"facingPages":false,"margins":0}',
  '--cmd', 'swatch.create={"name":"Ink","color":"#0d0d10"}',
  '--cmd', 'swatch.create={"name":"Infra","color":"#ff3b1f"}',
  '--cmd', 'swatch.create={"name":"Volt","color":"#d7ff2f"}',
  '--cmd', 'swatch.create={"name":"Cream","color":"#efebe4"}',
  '--cmd', 'frame.create={"rect":[0,0,1280,720],"shape":"rectangle","content":"unassigned"}',
  '--cmd', 'object.fill={"swatch":"Infra"}',
  '--cmd', 'object.stroke={"weight":0}',
  '--cmd', 'frame.create={"rect":[40,40,900,360],"content":"text","text":"3 DROPS."}',
  '--cmd', 'text.selectStory={"frame":8}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":230,"fill":"Ink"}}',
  '--cmd', 'frame.create={"rect":[44,300,900,520],"content":"text","text":"1 LAB."}',
  '--cmd', 'text.selectStory={"frame":10}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":200,"fill":"Cream"}}',
  '--cmd', ('place.load={"path":"' + "$cut/hero-airmax90.png" + '"}'),
  '--cmd', 'place.drop={"x":470,"y":200,"rect":[470,190,1290,740]}',
  '--cmd', 'frame.create={"rect":[1040,40,1240,110],"shape":"ellipse","content":"unassigned"}',
  '--cmd', 'object.fill={"swatch":"Volt"}',
  '--cmd', 'object.stroke={"weight":0}',
  '--cmd', 'frame.create={"rect":[1068,52,1230,104],"content":"text","text":"3D STORE"}',
  '--cmd', 'text.selectStory={"frame":15}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":40,"fill":"Ink"}}',
  '--cmd', 'frame.create={"rect":[44,640,700,690],"content":"text","text":"SOLE/LAB · scroll-driven sneaker store"}',
  '--cmd', 'text.selectStory={"frame":17}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Segoe UI","size":26,"fill":"Ink"}}',
  '--export', "$root/video/out/thumbnail-youtube.png"
)
& $D @a | Select-Object -Last 1
