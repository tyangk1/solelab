# SOLE/LAB — prompt ảnh Gemini (1 lượt)

Lưu ảnh **độ phân giải gốc** vào `landing-lab/builds/sneaker-store/inbox/` với **đúng tên file** ở mỗi prompt.
Prompt có ghi **[đính kèm …]** thì upload ảnh đó vào Gemini cùng prompt (để giữ đúng giày/góc/ánh sáng).
Ảnh nào hỏng (méo giày, chữ nát, sai màu) cứ để đó, em sẽ đánh giá và gửi prompt sửa.

---

## A. Hero tĩnh — 3 đôi chính (dùng làm fallback + tham chiếu màu cho render 3D)

**A1 → `hero-airmax90.png`**
```
Photorealistic commercial product photo of a single Nike Air Max 90 sneaker in the classic White / Infrared colorway, three-quarter front view from the left, floating slightly above the ground with a soft contact shadow below. Plain seamless mid-grey studio background (#BDBDBD), large softbox key light from upper left, subtle rim light from behind, crisp detail on the mesh, leather and visible Air unit. 100mm lens, f/8, ultra sharp, high dynamic range. Shoe centered, fills 70% of the frame, 4:3 landscape. No text, no people, no props.
```

**A2 → `hero-samba.png`**
```
Photorealistic commercial product photo of a single adidas Samba OG sneaker in Cloud White with black three stripes and a gum sole, three-quarter front view from the left, floating slightly above the ground with a soft contact shadow below. Plain seamless mid-grey studio background (#BDBDBD), large softbox key light from upper left, subtle rim light from behind, crisp detail on the leather, suede T-toe and gum sole texture. 100mm lens, f/8, ultra sharp. Shoe centered, fills 70% of the frame, 4:3 landscape. No text, no people, no props.
```

**A3 → `hero-ultraboost.png`**
```
Photorealistic commercial product photo of a single adidas Ultraboost sneaker in triple black with a black Primeknit upper and the textured Boost midsole, three-quarter front view from the left, floating slightly above the ground with a soft contact shadow below. Plain seamless light grey studio background (#D9D9D9), large softbox key light from upper left, strong rim light from behind to separate the black shoe from the background, crisp knit texture. 100mm lens, f/8, ultra sharp. Shoe centered, fills 70% of the frame, 4:3 landscape. No text, no people, no props.
```

## B. Colorway cho hiệu ứng đổi màu (làm SAU A1)

**B1 → `color-airmax90-blue.png`** [đính kèm `hero-airmax90.png`]
```
Using the attached photo, keep the exact same sneaker model, angle, framing, lighting, shadow and grey background. Change only the colorway: white base with royal blue suede overlays, light grey mesh, royal blue accents. Photorealistic, same sharpness.
```

**B2 → `color-airmax90-black.png`** [đính kèm `hero-airmax90.png`]
```
Using the attached photo, keep the exact same sneaker model, angle, framing, lighting, shadow and grey background. Change only the colorway: black leather and black mesh with volt neon yellow accents and a black Air unit. Photorealistic, same sharpness.
```

## C. Catalog — 6 mẫu, nhìn ngang, cùng một kiểu ánh sáng

Mỗi ảnh dùng chung đoạn kết này (đã ghép sẵn vào từng prompt):
*side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.*

**C1 → `cat-airforce1.png`**
```
A single Nike Air Force 1 '07 sneaker in all white leather, side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

**C2 → `cat-dunklow.png`**
```
A single Nike Dunk Low sneaker in white and black (panda colorway), side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

**C3 → `cat-gazelle.png`**
```
A single adidas Gazelle sneaker in collegiate blue suede with white three stripes and a white sole, side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

**C4 → `cat-airmax90.png`**
```
A single Nike Air Max 90 sneaker in White / Infrared, side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

**C5 → `cat-samba.png`**
```
A single adidas Samba OG sneaker in Cloud White with black three stripes and a gum sole, side profile view, toe pointing left, on a plain seamless mid-grey studio background (#BDBDBD), soft even studio light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

**C6 → `cat-ultraboost.png`**
```
A single adidas Ultraboost sneaker in triple black Primeknit with a black Boost midsole, side profile view, toe pointing left, on a plain seamless light grey studio background (#D9D9D9), soft even studio light with a rim light, soft shadow underneath, photorealistic e-commerce product photo, shoe fills 80% of the frame, 4:3 landscape, no text, no props.
```

## D. Macro vật liệu (khu cận cảnh + parallax)

**D1 → `macro-mesh.png`**
```
Extreme macro photograph of white engineered sneaker mesh fabric, the woven holes and fibers visible in sharp detail, raking side light creating deep texture shadows, shallow depth of field, clean and premium, 16:9 landscape. No logos, no text.
```

**D2 → `macro-airunit.png`**
```
Extreme macro photograph of a transparent sneaker air cushion unit in a white midsole, light refracting through the clear plastic window, red-orange accent reflection, dark background, sharp studio lighting, shallow depth of field, 16:9 landscape. No logos, no text.
```

**D3 → `macro-suede.png`**
```
Extreme macro photograph of soft dark green suede leather with visible nap and stitching seam, warm raking light, shallow depth of field, rich premium texture, 16:9 landscape. No logos, no text.
```

**D4 → `macro-gumsole.png`**
```
Extreme macro photograph of a translucent amber gum rubber sneaker outsole with a herringbone tread pattern, light glowing through the rubber edges, shallow depth of field, studio lighting, 16:9 landscape. No logos, no text.
```

## E. Nền / không khí cho từng đôi hero (không có giày)

**E1 → `bg-infrared.png`**
```
Empty minimal studio set, seamless backdrop in a bold infrared red-orange gradient, soft spotlight pool on the floor in the center, subtle film grain, cinematic, nothing in the scene, 16:9 landscape, no text.
```

**E2 → `bg-green.png`**
```
Empty minimal studio set, seamless backdrop in deep forest green with a soft warm spotlight pool on the floor in the center, subtle film grain, cinematic and premium, nothing in the scene, 16:9 landscape, no text.
```

**E3 → `bg-black-neon.png`**
```
Empty dark concrete studio floor and wall at night, thin cool cyan and magenta neon light reflections on wet concrete, moody and cinematic, a clear empty space in the center, nothing in the scene, 16:9 landscape, no text.
```

**E4 → `bg-night-street.png`**
```
Empty city street at night after rain, wet asphalt reflecting street lights and colored shop signs blurred into bokeh, low camera angle at ground level, cinematic, no people, no readable signs or text, 16:9 landscape.
```

## F. Lifestyle

**F1 → `life-street.png`**
```
Low-angle street photograph of a person's lower legs walking on a crosswalk wearing white and infrared Nike Air Max 90 sneakers and cropped black trousers, mid-stride, golden hour sunlight, motion and energy, shallow depth of field, editorial fashion style, 16:9 landscape, face not visible, no readable text.
```

**F2 → `life-court.png`**
```
Outdoor basketball court at sunset, close-up of a person's feet in white adidas Samba sneakers with gum soles resting on a basketball, warm light, film photography look, editorial style, 4:5 portrait, face not visible, no readable text.
```

**F3 → `life-stairs.png`**
```
Urban concrete stairs at blue hour, a person in black adidas Ultraboost sneakers jumping down the steps, frozen mid-air, dynamic low angle, cool cinematic light, editorial sports style, 4:5 portrait, face not visible, no readable text.
```

## G. Loader, tách lớp, chế độ đêm

**G1 → `box-closed.png`**
```
A plain matte black sneaker shoebox with the lid closed, minimal and premium, no logo, no text, three-quarter top view, on a plain seamless mid-grey studio background (#BDBDBD), soft studio light, soft shadow, photorealistic product photo, 4:3 landscape.
```

**G2 → `box-open.png`** [đính kèm `box-closed.png`]
```
Using the attached photo, keep the same shoebox, angle, lighting and background, but the lid is lifted off and leaning against the box, and the box is empty with crumpled white tissue paper inside. Photorealistic, no logo, no text.
```

**G3 → `exploded-airmax.png`**
```
Technical exploded view of a white and infrared running sneaker: outsole, midsole with visible air unit, upper, tongue, insole and laces separated and floating in a vertical stack with even gaps, all parts aligned, three-quarter view, plain seamless mid-grey studio background (#BDBDBD), soft studio light, photorealistic product render style, 4:3 landscape, no text, no labels.
```

**G4 → `night-reflective.png`**
```
A single white running sneaker with reflective 3M panels photographed in near darkness with a camera flash, the reflective parts glowing bright silver-white while the rest of the shoe is dark, three-quarter front view from the left, pure black background, dramatic, photorealistic, 4:3 landscape, no text.
```

---

Tổng: 26 ảnh (A3, B2, C6, D4, E4, F3, G4 + đính kèm theo yêu cầu). Thứ tự gợi ý: A → B → G1 → G2 → còn lại.
