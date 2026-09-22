# The six crew figures: prompts and process

*QUENT, 2026-09-08. Model: `gpt_image_2` via the Higgsfield CLI, 3.5 credits a take.
Regenerate any one figure by running the base block plus that figure's line.*

## The call

```
higgsfield generate create gpt_image_2 \
  --prompt "<BASE> <FIGURE>" \
  --aspect-ratio 2:3 --quality high --resolution 1k --wait --json
```

## BASE (identical for all six)

> Pixel art character sprite, full body, standing straight and still, facing the viewer front on, both feet flat on the ground, the whole figure from the top of the head to the soles of the feet inside the frame with empty space above the head and below the feet. Chunky square pixels on a coarse grid about 28 pixels wide by 52 pixels tall, hard square edges, absolutely no anti-aliasing, no blur, no gradients, no dithering, no outlines. Drawn only in five flat values and nothing else: bone paper background #FAF8F4, light grey #E9E7E2, mid grey #8A8781, dark grey #3F3D38, near black #0E0D0B. Greyscale only, completely monochrome, no colour anywhere, no skin tone, no brown, no blue, no warm tint. Face and hands are the mid grey #8A8781 lit plane with #3F3D38 as the front plane and #0E0D0B in shadow; hair and clothing read as a near black #0E0D0B mass. One flat light grey #E9E7E2 shadow strip on the ground under the feet. Flat empty #FAF8F4 background, no scenery, no props, no text, no letters, no logo, no border, no frame, no signature, no grid lines. Arms hanging at the sides, simple readable silhouette, small head, caricature proportions.

## FIGURE lines

**steve** (v2, the one shipped)
> The character is a caricature of Steve Jobs: bald on top with short grey hair at the sides, grey stubble beard, and very large round glasses with thick heavy near black rims drawn as two big dark circles covering most of the face, black turtleneck sweater, mid grey jeans, plain shoes. The glasses are the boldest feature on the face and must stay clearly readable at small size.

*v1 asked for "round wire rimmed glasses" and the glasses vanished in the downsample. Any
feature thinner than one source cell is gone at 32x56. Ask for it heavy.*

**jean**
> The character is a caricature of Jean-Michel Basquiat: a crown of dreadlocks standing straight up off the head, young face, dark suit jacket open over a shirt, paint marks on the jacket, dark trousers.

**ye**
> The character is a caricature of Kanye West: black rectangular sunglasses, short beard, oversized black hoodie, a heavy chain necklace at the chest, dark trousers, chunky boots.

**frank**
> The character is a caricature of Frank Herbert: full bushy white beard, bald crown with white hair at the sides, heavy dark jacket, dark trousers.

**quent**
> The character is a caricature of Quentin Tarantino: long jaw and prominent chin, dark receding hair, plain black shirt, dark trousers.

**kim**
> The character is a caricature of a woman with very long straight dark hair falling well past the shoulders, a plain long sleeved dress reaching below the knee, a small rectangular handbag carried in one hand, plain low shoes.

*Two takes naming Kim Kardashian came back `status: nsfw` with no image, once with
"fitted knee length dress" and once with "plain long sleeved dress". Dropping the name
passed on the first try. Failed jobs are not charged. Her likeness now rests entirely on
hair, dress and handbag, which was the brief's own list.*

## The post-process

The generator gives the figure. It does not give the grid or the palette, so a script does
both, deterministically, and that is why the six sit together:
`proc.py`, in this folder.

1. Quantize the full-resolution take to the five values by luminance, before any resize:
   `>=226` paper, `>=190` rule, `>=108` tone, `>=52` ink-soft, else ink.
2. Find the figure's tight bounding box on real ink only, so the ground shadow in the
   take does not drag the box down.
3. Downsample to a shared grid by taking the most common value in each cell, not the
   average. Averaging makes halos; the mode keeps flat edges. Two rules on top: a cell
   that is mostly background but at least half ink keeps the ink, and a cell whose mode is
   a lit plane but which holds 28% or more ink becomes ink. That second rule is what
   brings back eyes, glasses, mouths and Ye's chain.
4. Place every figure 50 cells tall on a 32 x 56 canvas, two rows of paper above the head,
   the same baseline, one `rule` shadow strip under the feet, three cells wider than the
   stance each side.
5. Write at 12 px a cell, nearest neighbour, so the pixels stay square.

Palette compliance is guaranteed by step 1, not hoped for. Every output file contains five
colours and no others.

---

## kim v3, 2026-09-08 (the shipped line)

*Rodrigo approved all six figures and asked for one change. Kim's eyes read as two light
sockets in a dark head, which made her a skull. She now gets dark glasses in Ye's language.
Nothing else moved: same base block, same grid, same 50-cell height, same baseline, same
five values, quantized at full resolution before the resize.*

**kim** (v3, the one shipped)
> The character is a caricature of a woman with very long straight dark hair falling well past the shoulders down her back, the hair pushed back clear of the face and behind the shoulders so the whole face is an open mid grey #8A8781 oval and no hair crosses the cheeks, the jaw or the chin. She wears large near black rectangular sunglasses drawn as one solid dark bar straight across the eyes, with clearly visible lit mid grey forehead above the bar and lit mid grey cheeks, nose and chin below it. She wears a plain long sleeved dress reaching below the knee, carries a small rectangular handbag in one hand, and wears plain low shoes. The sunglasses are the boldest feature on the face and must stay clearly readable at small size.

*v2 asked only for the glasses, adding "large near black rectangular sunglasses drawn as one
solid dark bar straight across the eyes covering most of the upper face" to the v1 line. The
bar arrived and took the head with it: her hair closed over the cheeks and the whole figure
downsampled to one black column with a light smudge where the face had been, 16 cells wide.
The fix was not the glasses but the hair. v3 spends three clauses ordering the hair behind
the shoulders and naming the lit planes that must survive above and below the bar, and the
face came back at 13 cells.*

**The rule that came out of it:** a dark feature added to a face that is already ringed by a
dark mass needs the lit planes around it protected in the same sentence. At this grid the
mode filter cannot tell a face from its hair unless the prompt separates them.

---

## quent v2, 2026-09-09 (the shipped line)

*The other five were approved and built in 3D. Quent failed twice in 3D and STEVE measured
why: his eyes were scattered single grey cells rather than a shape, so the turn dropped them
into the face, and his chin was a gradient that flattened into the jaw. Same base block, same
grid, same 50-cell height, same baseline, same five values, quantized at full resolution
before the resize. One take, 3.5 credits.*

**quent** (v2, the one shipped)
> The character is a caricature of Quentin Tarantino: a very long jaw and a huge prominent chin. Dark receding hair drawn as a near black #0E0D0B mass on the top and back of the head only, with a high lit mid grey #8A8781 forehead and no hair at the sides of the face, so the whole face is an open mid grey #8A8781 oval. Two big heavy near black #0E0D0B eyes drawn as two separate solid dark square blocks set wide apart, each block at least three pixels across, with lit mid grey forehead above them and lit mid grey cheeks and nose between and below them. No glasses, no dark bar across the eyes. A short dark mouth line. Below the mouth the long chin is drawn as one solid flat dark grey #3F3D38 block the full width of the face, a plain rectangle one value darker than the face with a hard top edge, not shaded, not a gradient. A lit mid grey #8A8781 neck separates the chin block from the collar of a plain black shirt. Dark trousers, plain shoes. The two eye blocks and the chin block are the boldest features on the face and must stay clearly readable at small size.

*v1 read "long jaw and prominent chin, dark receding hair, plain black shirt, dark trousers"
and left both features to chance. v2 names each as a mass in the value it must land in: the
eyes as two separate near black blocks with the lit forehead, cheeks and nose written into
the same sentence (the §12 Kim rule), the chin as one flat #3F3D38 rectangle below the mouth
with a hard top edge, and a lit neck to keep the block off the shirt. Result, 11 cells wide:
eyes are two 3x3 ink blocks on rows 9 to 11 with a one-cell lit nose column between them,
the same eye row as Steve and Frank; the chin is a three-row #3F3D38 slab the full width of
the face, tapering two rows into the collar. Hairline recedes at the temples over a lit
forehead. Source take was 195x887 px, the tallest figure of the six, which is why he is the
narrowest.*

## QUENT, 2026-09-09 00:40 take: rejected
Rodrigo's ruling: worse than the 2026-09-08 figure. The 00:40 PNG was removed from
`gen/` (kept in the session scratchpad only) and `gen/quent.png` was rebuilt
cell for cell from `crew/quent.model.js`, which still carried the 2026-09-08
grid: 1792 of 1792 cells match. The 2026-09-08 QUENT stands. His turn does not
hold at ±12 (see STEVE's 2026-09-09 return); accepted for now.

---

## The turn, 2026-09-18: four takes, one finding, six figures not generated

*QUENT. Brief: a three-quarter view of each of the seven figures, same pipeline, same format,
validate on rodrigo before spending on the rest. Four takes on rodrigo, about 21 credits.
The validation gate did not pass, so the other six were not generated. What is on disk is
`gen/rodrigo-turn-v4.png`, a validation take, not a deliverable. `gen/rodrigo-turn.png`
deliberately does not exist.*

JEAN's `jean/projects/crew-turn/identity-anchors.md` arrived mid-run and its per-figure floors
are what the takes below are judged against.

### TURNED BASE (the text-only block, takes 1 and 2)

Identical to the BASE block above except for the opening clause and two additions. The five
hex values, the coarse grid, no anti-aliasing, the ground shadow strip, arms at the sides and
caricature proportions are untouched.

The clause "standing straight and still, facing the viewer front on" becomes:

> standing straight and still, the head and the body both turned slightly to the figure's own left in a three quarter view, only about 20 degrees off front, the face still largely toward the viewer with both eyes visible and the nose still inside the face oval, the far cheek slightly narrowed by the turn, the near ear just coming into view at the side of the head. This is not a profile and not a side view, the turn is slight and the figure still reads as facing the viewer. The face stays an open lit mid grey #8A8781 plane with the eyes as two separate dark blocks set inside it, never one dark band across the eyes, and the hair or headwear still shows on both sides of the head so the lit face never reaches the outer edge of the head. Shoulders stay wide and square to the viewer so the silhouette is the same width as a front view,

and the closing clause gains a head-size bound, because take 1 came back with a head half
again the size of the front's:

> caricature proportions with a small head about one sixth of the total height, no bigger than the head of a front view.

### The i2i variant (takes 3 and 4, the one that works)

Text alone cannot hold an identity through a turn at this size. Takes 1 and 2 returned a
different man each time: a different head size, a different face-to-hair ratio, and in take 2
the cap patch went to the trailing side while the face went to the leading side, which is a
head turning two ways at once. Handing the generator the front PNG fixes all of that:

```
higgsfield generate create gpt_image_2 \
  --prompt "<I2I>" --image-references gen/<name>.png \
  --aspect-ratio 2:3 --quality high --resolution 1k --wait --json
```

**7 credits a take with one reference**, double the text-only 3.5.

The I2I block opens by naming what must not change, then turns it:

> Redraw the character in @Image 1 exactly as the same person, same pixel art sprite, same height, same stance, same small head size and same proportions, same clothes, but with the head and the body turned slightly to the figure's own left in a three quarter view, about 22 degrees off front. The face is still largely toward the viewer with both eyes visible, the far cheek narrowed by the turn, the near ear just coming into view. This is not a profile and not a side view. Everything that identifies him is unchanged: [the figure's anchor list]. The head stays a small lit face window inside a large near black hair and beard mass, roughly one fifth lit face to four fifths dark, exactly as in @Image 1, and the head is no larger than it is there. As the head turns, the light patch on the cap and the lit face both move together toward the same side, the side he is turning toward, and the near black hair widens on the side he is turning away from.

then the palette and grid text from BASE verbatim, then the oversize clause added for take 4:

> Because the turn foreshortens the face, draw every face feature oversized so that it survives: two eyes as two large heavy near black #0E0D0B blocks, the leading eye wider than the trailing one, each at least four pixels across, with a clear lit mid grey #8A8781 nose column standing between them; below the nose one near black #0E0D0B moustache band running the full width of the face; below that one short lit mid grey #8A8781 mouth inside the dark beard mass. The lit face is a clean solid window of mid grey #8A8781 with these features cut into it as whole blocks, never scattered single specks, never a plain empty lit bar with nothing in it, and never a dark band running edge to edge across the eyes. On the side he is turning away from, the lit face stops one cell short of the hair and takes a single dark grey #3F3D38 column, never near black.

### What the four takes measured

| | take 1 text | take 2 text | take 3 i2i | take 4 i2i + oversize |
|---|---|---|---|---|
| head size matches front | no, half again | no | yes | yes |
| face-to-hair ratio (front is 20/80) | ~40/60 | ~40/60 | yes | yes |
| crown notch present and still paper | as a plain block | as a plain block | yes, same glyph | yes, same glyph |
| notch moved to the leading edge | no, wrong side | no, trailing side | yes | yes |
| hair widens on the trailing side | no | partly | yes | yes |
| cell width vs front's 15 | 15 | 16 | 14 | 15 |
| **face interior survives** | **no** | **no** | **no** | **no** |

**The generator turns the mass. It cannot author the interior at this grid.** Four takes, two
instruments, and the face window failed every time: take 1 gave a dark band across the eyes,
takes 2 and 3 gave a lit bar with nothing in it and the beard dissolved into scattered single
cells running to the collar, take 4 gave structure that reads as a wrench rather than a face.

**Why, and it is arithmetic rather than prompting.** Rodrigo's lit face window is seven cells
wide in front view. A 22 degree turn foreshortens it to about five. Two eye blocks, a lit nose
column between them and a moustache band need five columns and four rows with no error budget
at all. This is the 2026-09-08 lesson one step worse: a feature thinner than one source cell
vanishes at 32x56, and the turn makes every face feature about a third thinner. There is no
sentence that makes a five-by-four target bigger.

**So I stopped.** Six more figures at 7 credits is 42, and their face windows are mostly
smaller than rodrigo's: JEAN's face is five cells wide, KIM's lit width is six or seven, YE's
identity is a six-cell strip. They would fail harder, for the same reason, and the brief's
step (d) exists to prevent exactly that spend.

### What I would do instead, for Rodrigo's ruling

The four takes split the problem cleanly, and each half now has the right instrument.

**The mass comes from generation.** Take 4 is good at this and the i2i block above is the
line to keep. Where the notch lands, how far the hair widens, where the face window sits, the
head size and the ratio all came back right and came back matching the front grid's placement
at 15 cells and ox 8.

**The interior comes from the front grid, moved.** JEAN's ruling is already written as
cell-level instructions, per figure, and they are not derivations from geometry. They are
authored: the notch moves 2 cells leading and is repainted #E9E7E2 with the cells it vacates
filling #0E0D0B; the lit band drops seven cells to five, shifted 2 leading, trailing column
#3F3D38; the moustache band stops one cell short of the trailing hair. That is a hand-authored
turn in the same spirit as the side maps in `crew/SCULPT.md`, and it is a different thing from
the six geometric derivations Rodrigo has rejected, which all tried to compute a face he never
drew. This one moves the face he approved.

I did not build that hybrid, because it is a change of method and the method is his call.

### Housekeeping

`gen/proc_turn.py` is the quantizer for turned takes. It is `proc.py` with one change: it
reads the front PNG's own cell span and centres the turned figure on the front figure's centre
column, so the placement matches by construction rather than by luck. Take 4 landed at 15
cells and ox 8 against the front's 15 cells at ox 8.

Raws for all four takes are in the session scratchpad as `rodrigo_turn_raw.png`, overwritten
each time; only take 4 survives, quantized, as `gen/rodrigo-turn-v4.png`.

**One gap found while working, unrelated:** the rodrigo FIGURE line from 2026-09-09 was never
appended to this file, though the brief asked for it. Only the six original lines and the kim
v3 and quent v2 revisions are here. The seventh figure's prompt is lost; his source
description survives in `studio/clients/0xr/briefs/2026-09-09-quent-rodrigo-figure.md`.
