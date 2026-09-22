# Sculpting a figure in 3D

A figure is authored front on: a value grid and a depth grid, indexed by
(x, y). build() extrudes that into a voxel volume, so the result is a bas
relief, a picture with thickness, the eye running in a rod straight through
the skull. The renderer was never the limit: its grid is a full W x H x D
volume read per voxel by the ray march. Only the authoring was flat.

## What the audit established (2026-09-18)

1. Per voxel colour reaches the march. A recoloured interior produced a
   1,244 cell diff and zero changed pixels at seven angles. Inside the
   28 degree clamp the interior is invisible, so the visible problem was
   never hidden colour. It is the surface.
2. `round` is the construction that holds. Carving each head row to an
   ellipse in plan while keeping the front image on the front of each column
   lays the face over a curved surface like a texture. At rest the front view
   is pixel identical. On a turn the face rides the surface, slides toward
   the turn and foreshortens at the limb while hair rotates in behind it.
   Eye row projected width: 13.0 cells at rest, 13.5 at 28 degrees, against
   the raw slab's 15.4.
3. The two view carve is retired. Its solids are frontSolid(x, y) AND
   profileSolid(depth, y), a product, so every plan section is a rectangle
   and the slab returns at 17.2 cells. Every profile feature extrudes across
   the full head width, so the nose became a visor. Its turn surfaces took
   colour from a parametrically generated profile, skin where the beard is.
   Art direction by formula.

## The loop

```
python3 vox.py round <name> 2     the wrap: ellipse skull, face as surface
python3 mkmodel.py                fold volumes into the models
```

crew/sculpt-test.html judges rodrigo against the raw extrusion at seven
angles; the crew page itself judges in motion. A figure with no volume.txt
renders exactly as it always did, so figures are treated one at a time and
the untreated ones are the control group.

## The side map (2026-09-18, after the wrap alone failed QUENT)

A figure whose silhouette edges are skin, like QUENT from the jaw down, gets
featureless face colour painted on the sides of his head by the wrap: the
same face at every angle. So `<name>.side.txt` is the authored answer: the
head seen from its left, one row per height, one column per depth step, same
alphabet. `round` reads it for the colour of everything behind the face
shell (hair mass, the ear, the arm of the shades), and air in it may trim
geometry behind the jaw. It can only remove or recolour, never add, so the
visor failure cannot return. One map serves both sides, mirrored. Enclosed
windows in a head are plugged with `:` so a cap patch turns with the head.

Draft with `python3 vox.py init-side <name>` (neutral: renders identical),
then author the head rows. QUENT's first map is a working draft; side maps
are look, so JEAN judges them before any of this ships.

MagicaVoxel stays possible for hand carving (vox.py export and import round
trip losslessly, and any palette slot maps to the nearest of the four values
by colour) but nothing requires it now.

## The files

*.vox, *.volume.txt and *.side.txt are workshop files; publish.sh keeps them
off the public site like the depth and back maps. A volume ships inside
<name>.model.js as 2 to 3KB of run length codes. The blink mask keeps
working because the wrap leaves every column's colour at its own x.
