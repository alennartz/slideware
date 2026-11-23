# Prompting image models for slides

Read this before calling `models.generateImages()`. The model is FLUX.2 [pro] (see `SKILL.md`). Sections marked **FLUX.2** cover that model. Sections marked **General** apply to any text-to-image model. Sections marked **Deck** are this factory's rules.

## FLUX.2

**Structure.** Use Subject + Action + Style + Context. Front-load what matters: the model weights early words more. Priority: main subject, key action, critical style, essential context, secondary detail.

**Length.** 10 to 30 words for quick exploration, 30 to 80 for most work, 80 or more only for complex scenes. Start medium.

**Style.** Name an era, camera, or film stock for a look. Examples: "shot on Sony A7IV, clean sharp, high dynamic range"; "shot on Kodak Portra 400, natural grain"; "80s vintage photo, film grain, warm color cast".

**Colour.** Give a hex code with the word "color" or "hex", tied to an object: `Walls: #C4725A`. For gradients, name both ends. Describe the colour in words too; a hex alone can miss.

**Text in the image.** Put the exact words in quotation marks, say where they sit, and name the font's character (serif, sans-serif, script), not a typeface. Keep the string short. There is no published character limit, and long strings fail more often. The flex variant has a steps setting and is the one aimed at typography. Our extension does not expose that setting.

**Negative prompts.** Not supported. Say what you want, not what to avoid: "sharp focus throughout", not "no blur"; "empty scene", not "no people".

**JSON.** FLUX.2 reads structured JSON prompts as well as prose. Use JSON for a multi-subject scene that needs precise placement or colour. Prose is fine for everything else.

**Prompt upsampling.** A language model rewrites your prompt before the image is made. It helps with thin prompts and reasoning-heavy ones, such as text in images, and adds little for simple prompts. On FLUX.2 [pro] and [max] it is on by default, switched off with `disable_pup: true`. On flex it is on by default, switched off with `prompt_upsampling: false`. Klein never upsamples. Our extension does not set the flag, so upsampling is on and the prompt you write may not be the one rendered. Check the output against the wording you wrote.

**Sizes.** Width and height must be multiples of 16, between 64 and 4 MP. Up to about 2 MP is recommended. Common: 1024×1024 (1:1), 1536×864 (16:9), 864×1536 (9:16), 1024×768 (4:3). For a 16:9 slide background, use 1536×864.

**Reference images.** FLUX.2 [pro] takes up to eight reference images. Add a line that says what each one contributes. Our extension sends them as `input_image`, `input_image_2`, and so on.

**Iterate.** Check the first result against the slide's needs. If a material flaw remains, consider cropping, a local edit, stock, or a different visual before another paid call. Regenerate only with the user's consent for that call or an explicitly approved iteration budget; make targeted corrections, combining related fixes where useful.

## General

**Build the prompt from parts.** A common checklist: subject, style, lighting, composition, colour, quality. Fill the parts that matter for the slide; leave the rest out.

**Specify the light.** Name its direction and quality: "soft window light from the left", "overcast, diffuse", "golden hour backlight". Mood words like "moody" add little on their own.

**Specify the frame.** Say where the subject sits and how much room the frame leaves: "subject on the right third, empty space on the left for text". For a slide, leave clear space where the headline will go.

**Describe the camera, not the quality.** "Shot on a 50 mm lens, shallow depth of field" steers more than "high quality".

**Be concrete about the subject.** "A woman in a grey wool coat reading a paper map at a train platform" beats "a traveller".

## Deck

**No text in slide images.** Headlines, labels, and captions are HTML in `source/slides.html`. They are editable, searchable, and crisp at any size. Generated text has none of these. Only put text in an image when the image is the text (a sign, a logo mock-up), and say so in the notes.

**One image, one job.** Each image supports one slide's single idea (`deck-slide-rules`). Do not generate a collage.

**Keep style consistent across a deck.** When a deck needs several images, reuse the same style clause and palette hex codes in each prompt. Write the clause once and paste it in.

**Match the palette.** Give the theme's accent or background hex codes so the image sits with the slide. The theme colours are in `themes/deckfile-default.css`.

**Check before use.** Inspect the image for wrong anatomy, invented text, and odd details. Fix material flaws or choose another visual; use the paid-iteration rule above before regenerating. A generated image can be wrong about facts, so do not use it as evidence.
