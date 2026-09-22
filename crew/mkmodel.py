"""mkmodel: an approved flat figure plus an authored depth map -> one JS model.

The value grid is read straight out of gen/<name>.png, so the front face of the
model is the approved figure and nothing else. Depth is authored by hand in
<name>.depth.txt, one character per depth step: `.` is air, 0-9 A B is how far
that cell's front surface sits proud of the base plane, in voxels, extruded
back to a solid. Lowercase a-l is the SAME protrusion, one voxel thick: a card
with no sides, which is the only way a one cell wide feature survives a turn.

    python3 mkmodel.py --init ye jean   write a first draft of those depth maps
                                        (and back maps, for a figure in BACKS)
                                        from the region tables, overwriting edits
    python3 mkmodel.py                  read every depth file as authored, write
                                        <name>.model.js and models.js

The back surface is authored too, since 2026-09-18, in an optional second grid
<name>.back.txt: how far the back of each cell sits BEHIND the base plane. `~`
is no opinion and falls back to the old rule, the front mirrored and clamped at
BACKMAX. A figure with no back file renders exactly as it always did.
"""
import os, sys, math
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PAL = [(0xFA,0xF8,0xF4),(0xE9,0xE7,0xE2),(0x8A,0x87,0x81),(0x3F,0x3D,0x38),(0x0E,0x0D,0x0B)]
W, H, CELL = 32, 56, 12
RAMP = "0123456789AB"
THIN = "abcdefghijkl"
BACKMAX = 4
# rodrigo first: he is the director and stands ahead of them everywhere
NAMES = ["rodrigo", "ye", "steve", "jean", "frank", "quent", "kim"]

# row range -> (max protrusion at the centre of the run, vertical scale, proud,
#               profile). `proud` is added to every cell of the region.
#
# `flat` is the whole finding of YE's first three passes. A horizontal grey band
# painted across a ROUND surface shears when the surface turns: the deep middle
# columns swing three cells sideways while the shallow edge columns swing one,
# and the sunglasses bar, which is the likeness, breaks into two offset bars by
# -20 degrees. So every eye row on every figure is a flat plate with a rolled
# edge, dropping 2 at the outer quarter of the run. Every cell of the bar then
# moves the same distance and the bar stays a bar.
#
# `thin` is the second law, learned on JEAN's crown and STEVE's legs. A run one
# or two cells wide, or a gap one cell wide, is destroyed by depth: a column D
# voxels deep projects W*cos+D*sin cells, so a five deep leg grows a cell at 12
# degrees and swallows the air beside it. A thin region is one voxel thick and
# projects its own width, whatever the angle.
REGIONS = {
 "rodrigo": [
    ((2, 7),   6, 1.00, 0, "flat"),  # the cap. FLAT: the R is a light mark cut
                                     # into it and a curved panel shears it in two,
                                     # which is what happened to YE's bar at -20
    ((8, 11),  6, 1.00, 0, "flat"),  # the face plate, eyes on row 9
    ((12, 15), 6, 1.00, 1, "flat"),  # the beard, one slice proud of the jaw
    ((16, 17), 6, 1.00, 0),   # the neck
    ((18, 21), 7, 1.00, 0),   # the shoulders
    ((22, 33), 8, 1.00, 0),   # the t-shirt, the deepest part of him
    ((34, 35), 7, 1.00, 0),   # the hem and the hands
    ((36, 51), 3, 1.00, 0, "thin"),  # the legs: ONE cell of air between them
 ],
 "ye": [
    ((2, 3),   6, 0.85, 0),          # the cap
    ((4, 5),   6, 1.00, 1, "flat"),  # the sunglasses bar, proud of the face plate
    ((6, 6),   6, 1.00, 0, "flat"),  # the brow under the bar
    ((7, 9),   6, 1.00, 1, "flat"),  # the beard mass, proud of the jaw
    ((10, 13), 7, 1.00, 0),   # the collar wrapping the neck
    ((14, 18), 7, 1.00, 0),   # the shoulders
    ((19, 32), 8, 1.00, 0),   # the coat, the deepest thing in the figure
    ((33, 35), 7, 1.00, 0),   # the hem and the hands
    ((36, 51), 3, 1.00, 0),   # the legs, one cylinder each: 4 closed the gap
 ],
 "steve": [
    ((2, 3),   5, 0.90, 0, "flat"),  # the hair over the crown
    ((4, 7),   6, 1.00, 0, "flat"),  # the face plate, forehead down
    ((8, 12),  6, 1.00, 1, "flat"),  # the round wire rims, one slice proud of the face
    ((13, 15), 6, 1.00, 0, "flat"),  # jaw and chin
    ((16, 17), 6, 1.00, 0),   # the neck
    ((18, 20), 7, 1.00, 0),   # the shoulders
    ((21, 31), 8, 1.00, 0),   # the black turtleneck
    ((32, 35), 7, 1.00, 0),   # the hem and the hands
    ((36, 51), 3, 1.00, 0, "thin"),  # the legs: ONE cell of air between them
 ],
 "jean": [
    ((2, 4),   5, 1.00, 0, "thin"),  # the dreadlock crown: single cell spikes, so a card
    ((5, 7),   6, 1.00, 0, "flat"),  # the skull under the crown
    ((8, 10),  6, 1.00, 1, "flat"),  # the eyes
    ((11, 13), 6, 1.00, 0, "flat"),  # mouth and chin
    ((14, 15), 6, 1.00, 0),   # the neck
    ((16, 20), 7, 1.00, 0),   # the shoulders
    ((21, 34), 8, 1.00, 0),   # the torso
    ((35, 51), 3, 1.00, 0, "thin"),  # the legs
 ],
 "frank": [
    ((2, 3),   5, 0.90, 0, "flat"),  # the top of the head
    ((4, 7),   6, 1.00, 0, "flat"),  # the forehead
    ((8, 11),  6, 1.00, 1, "flat"),  # the eyes and the nose
    ((12, 17), 6, 1.00, 1, "flat"),  # the beard, welded to the jaw at the same depth
    ((18, 21), 7, 1.00, 0),   # the shoulders, and the point of the beard, same 7
    ((22, 26), 7, 1.00, 0),
    ((27, 36), 8, 1.00, 0),   # the dark coat
    ((37, 51), 3, 1.00, 0, "thin"),  # the legs
 ],
 "quent": [
    ((2, 3),   5, 0.90, 0, "flat"),  # the hair
    ((4, 8),   6, 1.00, 0, "flat"),  # the forehead and the eyes
    ((9, 12),  6, 1.00, 1, "flat"),  # the nose and the mouth
    ((13, 17), 6, 1.00, 0, "flat"),  # the chin, which is the whole likeness
    ((18, 20), 7, 1.00, 0),   # the shoulders
    ((21, 33), 8, 1.00, 0),   # the torso
    ((34, 34), 7, 1.00, 0),   # the hem
    ((35, 51), 3, 1.00, 0, "thin"),  # the legs
 ],
 "kim": [
    ((2, 4),   5, 0.95, 0, "flat"),  # the top of the hair
    ((5, 9),   6, 1.00, 0, "flat"),  # the face. the rolled edge puts the hair curtain
    ((10, 15), 6, 1.00, 0, "flat"),  # BEHIND the face plate, which is the only way the
    ((16, 24), 7, 1.00, 0),          # lit forehead and cheeks survive the turn
    ((25, 44), 8, 1.00, 0),   # the body
    ((45, 51), 3, 1.00, 0, "thin"),  # the legs are two cells wide: a card or nothing
 ],
}

# THE BACK, 2026-09-18. One grid describes a symmetric solid and nothing more.
# Measured on STEVE at 24 degrees, the body widened 12px at the head, 4px at the
# torso and 0px at the legs, because the back was the front mirrored and clamped
# at BACKMAX: a bas relief. So a figure may have a SECOND grid, <name>.back.txt,
# same alphabet, saying how far the back surface sits BEHIND the base plane.
# `~` is no opinion and falls back to the mirror rule, so a figure with no back
# file, or a region left alone inside one, renders exactly as it did before.
#
# row range -> (max recession at the centre of the run, floor at the outer
#               edge, profile). `dome` is a half ellipse across the run, which
#               is what a skull and a ribcage are. `flat` is a plate, for a
#               back that is a wall. A row with no region gets `~`.
BACKS = {
 "steve": [
    # THE FLOOR IS FOUR, and it is the whole lesson of the first draft. A back
    # that tapers to nothing at the outer columns is anatomically right and
    # reads worse: at 24 degrees the NEAR silhouette edge is the back corner of
    # the outermost column, so tapering the back pulls that corner forward and
    # the figure gets NARROWER on a turn. Measured: floor 1 took the head from
    # 64px back down to 60px and the changed pixels from 10.8% to 7.6%. So no
    # cell ever recedes less than BACKMAX, which is what it had before, and the
    # authoring happens in the middle of the run where it is free.
    ((2, 3),   6, 3, "dome"),  # the crown: the hair carries on over the top
    ((4, 7),   7, 4, "dome"),  # the back of the skull, the deepest thing in him
    ((8, 12),  7, 4, "dome"),  # still skull, behind the rims
    ((13, 15), 6, 4, "dome"),  # the jaw, shallower than the skull: a jaw has a side
    ((16, 17), 4, 3, "dome"),  # the neck is a column, and it is narrow
    ((18, 20), 7, 4, "dome"),  # the shoulders: deep at the spine, so the far one
                               # falls away and the near one comes round
    ((21, 31), 7, 4, "dome"),  # the turtleneck over the ribcage
    ((32, 35), 6, 4, "dome"),  # the hem and the hands
    # The legs get no entry. They are thin cards and they stay cards: at 32
    # cells wide the one cell of air between them does not survive depth.
    #
    # 7 is the ceiling, not a taste call. front max is 8, so back 7 puts D at
    # 16 and LW stays 36: STEVE's canvas is the same 144px it always was and
    # the roster does not move. Back 8 pushes LW to 38.
 ],
}

# The rig, 2026-09-09: row ranges for head and torso (legs are the rest, down to
# the ground strip), and the eye cells. Eyes were found by a rule, then judged
# on a magnified head sheet: on the eye rows of the region table, a cell whose
# value differs from both row neighbours is an enclosed mark; the two marks
# nearest the head's axis are the eyes. Where the rule was ambiguous (STEVE's
# pupils sit against the rim, JEAN and FRANK have one eye two cells wide in
# shadow) the sheet decided. YE wears shades: the one glint in the bar is his
# eye cell, and a blink is the glint going out. `face` is the value the eye
# cells take while shut: the value of the skin around them, `-` on all six.
RIG = {
 "ye":    {"head": (2, 9),  "torso": (10, 35), "eyes": [(18, 4)]},
 "steve": {"head": (2, 15), "torso": (16, 35), "eyes": [(13, 9), (13, 10), (17, 9), (17, 10)]},
 "jean":  {"head": (2, 13), "torso": (14, 34), "eyes": [(14, 10), (16, 10), (17, 10)]},
 "frank": {"head": (2, 17), "torso": (18, 36), "eyes": [(13, 9), (16, 9), (17, 9)]},
 "quent": {"head": (2, 17), "torso": (18, 34), "eyes": [(13, 11), (18, 11)]},
 "kim":   {"head": (2, 15), "torso": (16, 44), "eyes": [(14, 7), (17, 7)]},
 "rodrigo": {"head": (2, 17), "torso": (18, 36), "eyes": [(13, 9), (17, 9)]},
}
FACE = "-"

def values(name):
    im = Image.open(os.path.join(HERE, "gen", name + ".png")).convert("RGB")
    px = im.load()
    return [[PAL.index(px[x*CELL+6, y*CELL+6]) for x in range(W)] for y in range(H)]

def runs(row):
    out, a = [], None
    for x in range(W + 1):
        solid = x < W and row[x] >= 1
        if solid and a is None: a = x
        if not solid and a is not None: out.append((a, x-1)); a = None
    return out

def draft(name, vals):
    grid = [["." ] * W for _ in range(H)]
    for y in range(H):
        reg = next((r for r in REGIONS[name] if r[0][0] <= y <= r[0][1]), None)
        if not reg: continue
        dmax, vs, proud = reg[1], reg[2], reg[3]
        prof = reg[4] if len(reg) > 4 else "round"
        for (a, b) in runs(vals[y]):
            c, half = (a + b) / 2, (b - a + 1) / 2
            for x in range(a, b + 1):
                u = (x - c) / half if half else 0
                if prof == "thin":   f = dmax + proud
                elif prof == "flat": f = dmax - (0 if abs(u) <= 0.75 else 2) + proud
                else: f = dmax * vs * math.sqrt(max(0.0, 1 - u * u)) + proud
                ramp = THIN if prof == "thin" else RAMP
                grid[y][x] = ramp[max(0, min(len(ramp) - 1, int(round(f))))]
    return grid

def draft_back(name, vals, dep):
    """A first back map. Air follows the front map exactly; a row with no
    region, and every thin card, stays `~` so the mirror rule still runs."""
    grid = [["~"] * W for _ in range(H)]
    for y in range(H):
        reg = next((r for r in BACKS[name] if r[0][0] <= y <= r[0][1]), None)
        for x in range(W):
            if dep[y][x] == ".": grid[y][x] = "."
        if not reg: continue
        bmax, floor, prof = reg[1], reg[2], reg[3]
        for (a, b) in runs(vals[y]):
            c, half = (a + b) / 2, (b - a + 1) / 2
            for x in range(a, b + 1):
                if dep[y][x] == ".": continue
                u = (x - c) / half if half else 0
                if prof == "flat": g = bmax - (0 if abs(u) <= 0.75 else 2)
                else: g = bmax * math.sqrt(max(0.0, 1 - u * u))
                g = max(floor, g)
                grid[y][x] = RAMP[max(0, min(len(RAMP) - 1, int(round(g))))]
    return grid

def write_back(name, grid):
    head = (f"# {name}.back.txt: the BACK surface, one character per depth step.\n"
            "# `.` air, 0-9 A B how far the back of that cell sits BEHIND the\n"
            "# base plane. `~` is no opinion: that cell falls back to the old\n"
            "# rule, the front mirrored and clamped at backmax. A figure with no\n"
            "# back file is entirely `~` and renders as it always did.\n"
            "# A value on a thin card turns the card into a slab, so the legs\n"
            "# are left `~` and the one cell of air between them survives.\n"
            f"# 32 wide, 56 tall, aligned cell for cell with {name}.depth.txt.\n"
            "# Edit this file, then: python3 mkmodel.py\n")
    body = "\n".join("".join(r) for r in grid)
    open(os.path.join(HERE, name + ".back.txt"), "w").write(head + body + "\n")

def read_back(name):
    p = os.path.join(HERE, name + ".back.txt")
    if not os.path.exists(p): return None
    lines = [l.rstrip("\n") for l in open(p) if not l.startswith("#") and l.strip()]
    assert len(lines) == H, f"{name}: back map is {len(lines)} rows, want {H}"
    for i, l in enumerate(lines):
        assert len(l) == W, f"{name}: back row {i} is {len(l)} wide, want {W}"
    return [list(l) for l in lines]

def write_depth(name, grid):
    head = (f"# {name}.depth.txt: the depth map, one character per depth step.\n"
            "# `.` air, 0-9 A B how far the front surface of that cell sits proud\n"
            "# of the base plane, in voxels, extruded back to a solid. Lowercase\n"
            "# a-l is the same protrusion ONE voxel thick, a card with no sides:\n"
            "# the only thing a one cell feature or a one cell gap survives.\n"
            f"# 32 wide, 56 tall, aligned cell for cell with gen/{name}.png.\n"
            "# Edit this file, then: python3 mkmodel.py\n")
    body = "\n".join("".join(r) for r in grid)
    open(os.path.join(HERE, name + ".depth.txt"), "w").write(head + body + "\n")

def read_depth(name):
    lines = [l.rstrip("\n") for l in open(os.path.join(HERE, name + ".depth.txt"))
             if not l.startswith("#") and l.strip()]
    assert len(lines) == H, f"{name}: depth map is {len(lines)} rows, want {H}"
    for i, l in enumerate(lines):
        assert len(l) == W, f"{name}: row {i} is {len(l)} wide, want {W}"
    return [list(l) for l in lines]

def read_vol(name):
    """<name>.volume.txt, written by vox.py after a wrap, plus the two turned
    paintings when a turn map exists: the head repainted looking left and
    right, swapped in past the turn threshold."""
    def parse(p):
        if not os.path.exists(p):
            return None
        d = front = None
        runs = []
        for l in open(p):
            l = l.strip()
            if front is not None:
                if l:
                    runs.append(l)
            elif l.startswith("d "):
                d = int(l[2:])
            elif l.startswith("front "):
                front = int(l[6:])
        assert d and front is not None, f"{p} has no d or front"
        return {"d": d, "front": front, "rle": "".join(runs)}
    base = parse(os.path.join(HERE, name + ".volume.txt"))
    if base:
        l = parse(os.path.join(HERE, name + ".volumeL.txt"))
        r = parse(os.path.join(HERE, name + ".volumeR.txt"))
        if l and r:
            assert l["d"] == base["d"] == r["d"], f"{name}: turned volumes disagree on depth"
            base["l"], base["r"] = l["rle"], r["rle"]
    return base

def js_wrap(s):
    return "    " + "\n    ".join('"' + s[q:q + 72] + '" +'
                                   for q in range(0, len(s), 72)).rstrip(" +")

def vol_js(vol):
    out = (f',\n  volume: {{ d: {vol["d"]}, front: {vol["front"]}, rle:\n'
           + js_wrap(vol["rle"]))
    if "l" in vol:
        out += ',\n  l:\n' + js_wrap(vol["l"]) + ',\n  r:\n' + js_wrap(vol["r"])
    return out + ' }'

def body(name, vals, dep, bck, vol=None):
    v = "\n".join("".join(".·-+#"[c] for c in r) for r in vals)
    d = "\n".join("".join(r) for r in dep)
    r = RIG[name]
    for (x, y) in r["eyes"]:
        assert vals[y][x] >= 1 and dep[y][x] != ".", f"{name}: eye cell {x},{y} is air"
    eyes = ", ".join(f"[{x}, {y}]" for (x, y) in r["eyes"])
    return (f"window.crewModels.{name} = {{\n"
            f"  name: \"{name}\", w: {W}, h: {H}, backmax: {BACKMAX},\n"
            f"  head: [{r['head'][0]}, {r['head'][1]}], torso: [{r['torso'][0]}, {r['torso'][1]}],\n"
            f"  eyes: [{eyes}], face: \"{FACE}\",\n"
            '  value: `\n' + v + '`,\n'
            '  depth: `\n' + d + '`'
            + (',\n  back: `\n' + "\n".join("".join(r) for r in bck) + '`' if bck else '')
            + (vol_js(vol) if vol else '')
            + '\n};\n')

HEAD = ("/* generated by crew/mkmodel.py, do not hand edit. Source of truth is\n"
        "   crew/gen/*.png and crew/*.depth.txt. */\nwindow.crewModels = window.crewModels || {};\n")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    todo = args or NAMES
    if "--init" in sys.argv:
        for n in todo:
            vals = values(n)
            write_depth(n, draft(n, vals)); print(f"wrote {n}.depth.txt (draft)")
            if n in BACKS:
                write_back(n, draft_back(n, vals, read_depth(n)))
                print(f"wrote {n}.back.txt (draft)")
    all_js = [HEAD]
    for n in NAMES:
        vals, dep, bck, vol = values(n), read_depth(n), read_back(n), read_vol(n)
        js = body(n, vals, dep, bck, vol)
        open(os.path.join(HERE, n + ".model.js"), "w").write(HEAD + js)
        all_js.append(js)
        mx = max((max(RAMP.find(c), THIN.find(c)) for r in dep for c in r if c != "."), default=0)
        bk = max([RAMP.find(c) for r in (bck or []) for c in r] + [BACKMAX])
        print(f"{n}.model.js: front max {mx}, back max {bk}, D = {mx + bk + 1}"
              + ("  (authored back)" if bck else "")
              + (f"  (sculpted volume, D = {vol['d']})" if vol else ""))
    open(os.path.join(HERE, "models.js"), "w").write("".join(all_js))
    print(f"models.js: all {len(NAMES)}")
