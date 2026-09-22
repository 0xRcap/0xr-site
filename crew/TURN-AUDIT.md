# The crew turn: what worked and what did not

*2026-09-18. Ten attempts in one day at one problem. Rodrigo rejected seven of
them. This is the record, written so the next attempt does not repeat any of
the seven, and so the four things that did work are not lost with them.*

## The problem, as he stated it

"The animation of the characters when they turn, it just looks like they are
repeating themselves on a different direction." Later, precisely: "When Quent
turns to the right, his face is still looking to the left, and the same copy
paste effect of his face to fill the gap of space is happening again." And:
"My character has no cap still to the sides."

## The state this file was written in

- **rodrigo and quent are exactly as they were this morning.** Verified by
  rendering both against the committed renderer at six angles: zero pixels
  differ at every one. Their model files are byte identical to HEAD.
- **The other five carry the wrap** and nothing else. Identical at rest,
  changed only on a turn.
- Everything built today is on disk and dormant. Nothing is committed.

---

## What worked

**1. The wrap (`vox.py round`).** The only construction that survived. Each
head row is carved to an ellipse in plan, and the front image is laid over the
curve instead of extruded through it. Measured on rodrigo's eye row: projected
width 13.0 cells at rest, 13.5 at 28 degrees, against the raw slab's 15.4. Rest
view pixel identical. This is what the five untouched figures now use.

**2. The side face bug.** A real renderer fault, found by accident. Side facing
voxels darken one value for lighting, and on a rounded pale head every stair
step exposes one, checkerboarding the whole face. It only bites light values,
and quent is the only figure whose skull is skin where the others are hair,
which is why it was "mainly quent" from his first message. Now scoped: figures
built as a volume use the softened ramp, slabs keep the original.

**3. JEAN's arithmetic.** A head of half width `r` turned by `theta` moves its
centre line by `r * sin theta`. At 12 degrees jean shifts half a cell and ye
shifts under one. Half a cell does not exist on this grid. Every geometric
derivation attempted before this was trying to express a turn in less than one
pixel. This number should be the first thing consulted next time.

**4. JEAN's diagnosis of the two failing figures.** A head reads as a volume
when its dark mass belongs to the face. A dark mass that only surrounds the
face is a frame, and frames do not turn. Steve and frank are paler than quent
and have never failed, because steve's dark mass is in his face. Kim's is
around hers, which is the locket. Quent has none at all, which is why his face
floats on his shirt.

**5. The validation gate.** QUENT was briefed to prove the prompt on one figure
before generating seven. It failed, and he stopped at 21 credits instead of 63.
The gate paid for itself on its first use.

---

## What did not work, and why

**Per voxel colour.** The premise was that the face smeared because colour had
no depth. Built the whole `.vox` pipeline on it, round trip lossless. Then
measured: 1,244 interior cells differed and **zero pixels changed** at seven
angles. Inside the 28 degree clamp the interior is never visible. The theory
was wrong and the measurement took four minutes; it should have come first.

**The shell rule.** Same fate, same reason. Zero pixels changed.

**The two view carve.** Front silhouette intersected with an authored profile.
This made it worse, and measurably: an intersection is a product, so every plan
section becomes a rectangle and the slab returns at 17.2 cells against its own
15.4. Every profile feature also extrudes across the full head width, so a nose
drawn in profile became an eleven voxel visor. Retired.

**Hand authored pixel art, twice.** Both times I typed grids into a script
without ever seeing them render. The second attempt painted rows 6 to 11 of
rodrigo's head almost solid skin and turned his face into a grey slab with a
hole in it. A separate silent fault in the same work: the turn grids use `.`
`(middot)` `-` `+` `#` and I wrote `:` for the light value, so every cap cell I
drew was read as air and painted nothing.

**Generation, for the face interior.** Four takes, two instruments, 21 credits.
Text alone cannot hold an identity through a turn at this size: takes 1 and 2
returned a different man each time. Handing the generator the front PNG as an
image reference fixes the mass completely, and take 4 matched the front grid at
15 cells and offset 8. But the interior failed all four times and the reason is
arithmetic: rodrigo's lit face window is seven cells wide and a 22 degree turn
foreshortens it to five, while two eye blocks, a lit nose column and a moustache
band need five columns and four rows with no error budget at all. No sentence
makes a five by four target bigger.

**The authored turned grid.** JEAN hand authored rodrigo's turned face and it
passed six of seven countable drift items, failing only an orphan his front grid
already has. It looked correct as a still. **In motion he judged it worse than
the untreated figure.** That is the most important unexplained result in this
file: the test suite and his eye disagreed, and his eye is the one that counts.
Whatever the next attempt is, it has to be judged in motion, by him, before
anything is built on top of it.

---

## Process faults, mine

1. **Theory before measurement.** Two constructions were built on a premise that
   a four minute measurement disproved.
2. **Art direction by formula.** A parametrically generated head profile shipped
   to his screen as if it were a look decision. Look is JEAN's.
3. **Drawing blind.** Pixel art typed into a heredoc, never rendered, twice.
4. **Working the wrong figure.** Three passes ran on rodrigo stills while the
   complaint named quent.
5. **Not containing the best known state.** The carve discarded the wrap, which
   he had already judged best so far, instead of building on it.

---

## What is on disk, dormant

- `vox.py` — `round` (the wrap), `turn` (fit a generated PNG to the front row
  spans), `export`/`import` (MagicaVoxel round trip, lossless), `init-side`,
  `carve` (retired, kept as the record of a measured failure).
- `drift.py` — JEAN's nine item test as code. Seven items count, two are looked
  at. Self tested: correctly fails a non turn.
- `crew3d.js` — volume decoding, the three state swap at 18 degrees in and 12
  out with the blink suppressed while turned, mirroring. Inert for any figure
  with no turn grid.
- `jean/projects/crew-turn/` — the identity ruling, the per figure anchors with
  cell counts, the drift test, and rodrigo's authored turned grid.
- `gen/prompts.md` — QUENT's i2i prompt block, the one that turns the mass
  correctly, plus `gen/rodrigo-turn-v4.png` and `gen/proc_turn.py`.

## Two front grid faults found along the way

Both predate today and both will be inherited by any turn built on them.

- **rodrigo's crown notch is seven cells of paper fully enclosed by ink.** In a
  rotating volume that is not a highlight, it is a hole, and the renderer looks
  through it into the dark interior. This is the mechanical reason his cap
  vanishes from the sides. JEAN ruled enclosed paper should be plugged to
  `#E9E7E2` and then be free to move, which changes an approved asset and needs
  his word.
- **rodrigo's chin has an orphan at (14,14)**, a lone `#3F3D38` cell with no
  orthogonal neighbour of its own value. It fails JEAN's item 8 in the front
  grid, before any turn.

## Where the next attempt should probably start

Not with the turn. JEAN's diagnosis points at the front grids: quent has no dark
mass in his face and rodrigo's cap is a hole rather than a shape. Both are
properties of the approved front figures, and both are the reason their turns
fail while the other five hold. A redraw of those two fronts, with the dark mass
inside the face and the cap as a solid, is the change that would make everything
above work, and it is a bigger decision than any of the ten attempts here.
