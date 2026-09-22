# The crew look, v1

*JEAN, 2026-09-08. Six pixel figures for the crew cells on `what.html`. Text is
the source of truth. STEVE converts these grids to voxel slices; nothing here is
a rendering instruction until it survives at 4px per voxel.*

Proof: `look-test.png`, rendered flat from these exact grids at 8x, 4x and 1x.
The renderer that made it is `look-test.html`, kept so the next change can be
re-proved the same way.

---

## 1. Tone: two, ink on bone

**Ruled: ink `#0E0D0B` on paper `#FAF8F4`. Two values. No third.**

The first pass failed because four greys on bone leaves no value gap anywhere.
At 4px per voxel a mid-tone next to ink is a smudge, not a plane, and the eye
gives up before it finds the edge. Every clean thing on that sheet was a
silhouette. That is the whole finding.

Polarity goes to ink on bone, against the reference, for three reasons.

1. The site has one theme and the figures have to sit on the page, not in a box.
   Bone on ink needs a black tile behind each figure, and six black tiles turn
   the crew into a strip of stickers pasted onto the what page.
2. Light on dark blooms. At the size where this matters, a bone figure gains
   apparent weight at its edges and loses it in its holes, so the glasses close
   up and the shutter slits fill in. Ink mass on bone does the opposite: the
   holes hold.
3. What he liked in the reference was two values and hard edges, not the
   polarity. Both survive here.

If he wants the reference polarity, invert the whole cell, background included,
and change nothing in the grids. The figures are polarity-neutral by
construction.

## 2. The grid

14 wide, 18 tall. Every figure, no exceptions.

| Zone | Rows | Rule |
|---|---|---|
| crown | 0 to 3 | the only zone whose width is free. May reach cols 1 to 12 |
| face | 4 to 11 | 8 wide, cols 3 to 10, always |
| eye line | **7** | every eye's bottom row is 7 |
| jaw | 11 | the face ends here, for everyone |
| **neck** | **12** | 4 wide, cols 5 to 8, bone on both sides. One row. Nothing else may occupy row 12 |
| collar | 13 to 14 | |
| torso | 15 to 17 | reaches row 17, width is free |

STEVE's 8 wide by 12 tall head with eyes at row 7 held and is kept. The 10-wide
head on a triangle is gone: the head is 8 and the crown, not the skull, is what
varies. That is what stops the egg on a trophy.

The crown zone is doing most of the work. At 1x the face is four pixels of
information and the crown is the only thing still legible, so likeness at small
size is a crown-zone problem and the table below is written to spend its
variance there.

## 3. The four variables

Nothing else varies.

| | build | posture | eyes | one prop |
|---|---|---|---|---|
| **STEVE** Jobs | narrowest torso in the set, max width 12 | head sunk, collar meets the jaw one row early | none visible | round glasses: two 2x2 bone holes, cols 4-5 and 8-9, rows 6-7, ink bridge between |
| **JEAN** Basquiat | lean, max width 12 | chin up, crown clears the shoulders | 1 wide, 2 tall, cols 4 and 9, rows 6-7, set wide | the open collar: a 2x1 bone notch at the throat, row 14 |
| **KIM** Kardashian | narrow body, widest total mass: the hair curtain runs cols 2 and 11 from the crown to row 14 | square to camera, dead level | 2 wide, 1 tall, cols 4-5 and 8-9, row 7. Half lidded | the phone: a 2x2 bone hole low left of the torso, rows 15-16 |
| **YE** Kanye | broadest, full 14 from row 14 down, four solid rows | chin down, head sunk into the mass | none visible | shutter shades: one ink band at row 7, ink posts at cols 2, 5, 8, 11, three 2-wide bone slits between |
| **FRANK** Herbert | heavy, full 14 from row 15 | upright, square | 1x1, cols 4 and 9, row 7, under a solid brow | the beard: the face pinches to 8 at the eye line then flares to 12 at rows 9-10. The widest point of the head is below the eyes, and only here |
| **QUENT** Tarantino | tall, narrow, the largest head in the set | tilted: the shoulder line slopes, left high | 1x1, cols 5 and 8, row 7, set close | the jaw: rows 11 stays 8 wide. No taper. Everyone else tapers |

Likeness at this size is silhouette plus one hole. Nobody gets two props.

## 4. What never changes

- 14 by 18. Two values. No anti-aliasing, ever.
- Face 8 wide at cols 3 to 10. Eye bottom row 7. Jaw row 11. Neck row 12.
- No mouth. No nose. No brow line drawn as a mark. No shading of any kind.
- Every bone mark inside the outline is a **hole**: enclosed by ink on all four
  sides. A bone pixel that touches the outside is a notch in the silhouette, and
  notches are allowed only in the crown zone and the shoulder slope.
- The figure stands alone on paper. No ground shadow, no plinth, no frame.

## 5. The three rules that fix the first pass

1. **Holes, not outlines.** Glasses, shades, eyes, the collar notch and the
   phone are bone cut into ink. Nothing is drawn as a rim in a lighter grey.
   Check every mark: ink above, below, left and right.
2. **Row 12 is a neck and only a neck.** Four wide, bone at cols 3-4 and 9-10.
   The head must never touch the collar. That single bone gap is what stopped
   the pawn.
3. **No mid-tone on a turned face.** When these go back into `crew.js`, the
   turn cannot introduce a third value. Every material becomes
   `[ink, ink, ink]`, so the lit, front and shadow faces are the same black and
   the turn reads as the silhouette changing shape. Only the eye material stays
   paper.

### Handoff to STEVE

`crew.js` currently maps six materials onto three tones. Under this ruling it
maps two: ink for `#`, `H`, `T`, `G`, `S`, and paper for `E`. The ground `--rule`
goes away with the plinth.

In the grids below, `.` inside the figure's outline is **not air**. It is the
`E` material, so the ray hits paper instead of passing through to the back
slices. Only `.` outside the outline is air. Getting this wrong is how the
glasses turn into sockets again.

The grids are front view. Depth is STEVE's to build. One note that is
art direction and not engineering: the nose belongs in the front slice alone,
and it is the only volume allowed to break the two-value rule by changing the
silhouette on a turn.

---

## 6. The six

`#` ink, `.` bone. 14 wide, 18 tall, front view.

### STEVE / Steve Jobs
```
.....####.....
....######....
...########...
...########...
...########...
...########...
..##..##..##..
..##..##..##..
...########...
...########...
...########...
....######....
.....####.....
...########...
..##########..
..##########..
.############.
.############.
```

### JEAN / Jean-Michel Basquiat
```
.###..####.##.
.############.
.############.
..##########..
...########...
...########...
...#.####.#...
...#.####.#...
...########...
...########...
...########...
....######....
.....####.....
....######....
...###..###...
..##########..
.############.
.############.
```

### KIM / Kim Kardashian
```
...########...
..##########..
..##########..
..##########..
..##########..
..##########..
..##########..
..##..##..##..
..##########..
..##########..
..##########..
..#.######.#..
..#..####..#..
..#.######.#..
..##########..
.##..########.
###..#########
##############
```

### YE / Kanye West
```
....######....
...########...
...########...
...########...
...########...
...########...
..##########..
..#..#..#..#..
..##########..
...########...
...########...
....######....
.....####.....
..##########..
##############
##############
##############
##############
```

### FRANK / Frank Herbert
```
.....####.....
....######....
...########...
..##########..
..##########..
..##########..
..##########..
...#.####.#...
...########...
.############.
.############.
..##########..
.....####.....
...########...
.############.
##############
##############
##############
```

### QUENT / Quentin Tarantino
```
..##########..
..##########..
..##########..
...########...
...########...
...########...
...########...
...##.##.##...
...########...
...########...
...########...
...########...
.....####.....
...#######....
..#########...
.##########...
.###########..
.###########..
```

---

## 7. Open, needs Rodrigo

- **Polarity.** Ruled ink on bone above. If he wants the reference polarity,
  it is one line in the renderer and the grids do not move.
- **JEAN's crown overhangs the shoulders** and reads slightly mushroom at 8x.
  It is the one shape in the set I would test again before STEVE builds depth.
- **The disclosure.** These are caricatures of six real people used as agent
  marks. Whatever line the what page carries about the crew being synthetic
  covers the figures too. Hard rule 5 in the doctrine, checked before it ships.
