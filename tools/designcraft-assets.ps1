# DesignCraft: OG image (1200x630) + promo banner (1500x500) from the PhotoCraft cutouts.
# Run from builds/sneaker-store:  pwsh tools/designcraft-assets.ps1
# Note: frame ids are deterministic (a text frame returns {id, story}); text.selectStory needs the FRAME id.
$ErrorActionPreference = 'Stop'
$D = "$env:LOCALAPPDATA\Programs\DesignCraft\designcraft-cli.exe"
$root = (Resolve-Path "$PSScriptRoot\..").Path -replace '\\', '/'
$cut = "$root/work/cut"

$swatches = @(
  '--cmd', 'swatch.create={"name":"Ink","color":"#0d0d10"}',
  '--cmd', 'swatch.create={"name":"Infra","color":"#ff3b1f"}',
  '--cmd', 'swatch.create={"name":"Volt","color":"#d7ff2f"}',
  '--cmd', 'swatch.create={"name":"Cream","color":"#efebe4"}'
)

# ---- OG 1200x630 ----
$og = @('run', '--cmd', 'file.new={"intent":"web","units":"pixels","width":1200,"height":630,"pages":1,"facingPages":false,"margins":0}') + $swatches + @(
  '--cmd', 'frame.create={"rect":[0,0,1200,630],"shape":"rectangle","content":"unassigned"}',
  '--cmd', 'object.fill={"swatch":"Ink"}',
  '--cmd', 'object.stroke={"weight":0}',
  '--cmd', 'frame.create={"rect":[600,0,1200,630],"shape":"rectangle","content":"unassigned"}',
  '--cmd', 'object.fill={"swatch":"Infra"}',
  '--cmd', 'object.stroke={"weight":0}',
  '--cmd', ('place.load={"path":"' + "$cut/hero-airmax90.png" + '"}'),
  '--cmd', 'place.drop={"x":440,"y":80,"rect":[440,70,1190,610]}',
  '--cmd', 'frame.create={"rect":[60,120,640,260],"content":"text","text":"SOLE/LAB"}',
  '--cmd', 'text.selectStory={"frame":11}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":130,"fill":"Cream"}}',
  '--cmd', 'frame.create={"rect":[62,290,560,420],"content":"text","text":"THREE DROPS. ONE LAB."}',
  '--cmd', 'text.selectStory={"frame":13}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":52,"fill":"Volt"}}',
  '--cmd', 'frame.create={"rect":[62,440,470,520],"content":"text","text":"Air Max 90 / Samba OG / Ultraboost"}',
  '--cmd', 'text.selectStory={"frame":15}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Segoe UI","size":22,"fill":"Cream"}}',
  '--cmd', 'frame.create={"rect":[62,560,470,600],"content":"text","text":"Concept demo · not affiliated with Nike or adidas"}',
  '--cmd', 'text.selectStory={"frame":17}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Segoe UI","size":15,"fill":"Cream"}}',
  '--export', "$root/assets/og.png"
)
& $D @og | Select-Object -Last 1

# ---- Banner 1500x500 ----
$bn = @('run', '--cmd', 'file.new={"intent":"web","units":"pixels","width":1500,"height":500,"pages":1,"facingPages":false,"margins":0}') + $swatches + @(
  '--cmd', 'frame.create={"rect":[0,0,1500,500],"shape":"rectangle","content":"unassigned"}',
  '--cmd', 'object.fill={"swatch":"Volt"}',
  '--cmd', 'object.stroke={"weight":0}',
  '--cmd', 'frame.create={"rect":[40,40,1460,330],"content":"text","text":"DROP SEASON"}',
  '--cmd', 'text.selectStory={"frame":8}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Impact","size":250,"fill":"Ink"}}',
  '--cmd', ('place.load={"path":"' + "$cut/hero-airmax90.png" + '"}'),
  '--cmd', 'place.drop={"x":20,"y":200,"rect":[20,190,540,500]}',
  '--cmd', ('place.load={"path":"' + "$cut/hero-samba.png" + '"}'),
  '--cmd', 'place.drop={"x":500,"y":210,"rect":[500,200,1010,500]}',
  '--cmd', ('place.load={"path":"' + "$cut/hero-ultraboost.png" + '"}'),
  '--cmd', 'place.drop={"x":970,"y":200,"rect":[970,190,1490,500]}',
  '--cmd', 'frame.create={"rect":[1250,462,1490,494],"content":"text","text":"SOLE/LAB · concept demo"}',
  '--cmd', 'text.selectStory={"frame":16}',
  '--cmd', 'type.char={"attrs":{"fontFamily":"Segoe UI","size":18,"fill":"Ink"}}',
  '--export', "$root/assets/banner.png"
)
& $D @bn | Select-Object -Last 1
