"""vox: MagicaVoxel .vox in and out, so a figure can be sculpted in 3D.

The rig has always been a voxel renderer fed flattened data: `build()` writes
one value into every voxel of a column, so colour has no depth and a turn
smears the face across the side of the head. A .vox file carries a value per
voxel, which is the thing that was missing.

  python3 vox.py turn rodrigo      fit gen/rodrigo-turn.png to rodrigo.turn.txt
  python3 vox.py round rodrigo 2   round the skull in plan, face as a front shell
  python3 vox.py shell rodrigo 2   per voxel colour from the front image alone
  python3 vox.py export rodrigo    seed rodrigo.vox from the current figure
  python3 vox.py import rodrigo    read the sculpt back to rodrigo.volume.txt
  python3 vox.py roundtrip rodrigo export, re-import, assert identical

Then `python3 mkmodel.py` folds the volume into the model, same as a back map.
`.vox` and `.volume.txt` are workshop files: publish.sh keeps them off the site.

Axes. Ours: i across, j down from the crown, k back from the front plane.
MagicaVoxel is Z up and Y into the screen, so x=i, y=k, z=H-1-j.
"""
import math, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAMP, THIN = "0123456789AB", "abcdefghijkl"
VAL = {".": 0, "·": 1, "-": 2, "+": 3, "#": 4}
CHAR = {v: k for k, v in VAL.items()}
# the five site values, so a sculpt looks right in MagicaVoxel too
PALETTE = [(0, 0, 0), (250, 248, 244), (233, 231, 226),
           (138, 135, 129), (63, 61, 56), (14, 13, 11)]
FRONT = {}                      # filled by read_model: the base plane's slice

# JEAN's ruling, 2026-09-18: the rows a turned take is allowed to repaint.
# The body must come back identical to the front grid, or the turn puts YE's
# chain, JEAN's paint marks and KIM's handbag back in play for no gain.
# Intersected at use with the rig's own head band, because painting a turned
# face onto rows the rig does not rotate is a turned face on a still body.
# FRANK is the live disagreement: she rules his beard is head, rows 2 to 21,
# and the rig turns only to 17, so rows 18 to 21 stay front art for now.
PAINT_ROWS = {"rodrigo": (2, 15), "quent": (2, 17), "steve": (2, 15),
              "jean": (2, 14), "frank": (2, 21), "ye": (2, 9), "kim": (2, 16)}


def read_model(name):
    """the current figure, as a dense volume: exactly what build() makes."""
    import re
    s = open(os.path.join(HERE, name + ".model.js")).read()
    g = lambda k: int(re.search(rf"\b{k}:\s*(\d+)", s).group(1))
    W, H, BACK = g("w"), g("h"), g("backmax")
    grab = lambda k: re.search(rf"{k}:\s*`\n?(.*?)`", s, re.S).group(1)
    vs = [r for r in grab("value").split("\n") if r]
    ds = [r for r in grab("depth").split("\n") if r]
    bpath = os.path.join(HERE, name + ".back.txt")
    bs = None
    if os.path.exists(bpath):
        bs = [l.rstrip("\n") for l in open(bpath) if not l.startswith("#")]
        bs = [r for r in bs if r]
    front = max((max(RAMP.find(c), THIN.find(c)) for r in ds for c in r), default=0)
    FRONT[name] = front
    # an authored back can sit deeper than backmax: size the volume for it
    if bs:
        BACK = max(BACK, max((RAMP.find(c) for r in bs for c in r), default=0))
    D = front + BACK + 1
    vol = {}
    for j in range(H):
        for i in range(W):
            v = VAL.get(vs[j][i], 0)
            dc = ds[j][i]
            if not v or dc == ".":
                continue
            b = RAMP.find(bs[j][i]) if bs else -1
            t = THIN.find(dc)
            if t >= 0 and b < 0:
                vol[(i, j, front - t)] = v
                continue
            f = t if t >= 0 else RAMP.find(dc)
            k1 = front + (b if b >= 0 else min(f, BACK))
            for k in range(front - f, k1 + 1):
                vol[(i, j, k)] = v
    return W, H, D, vol


def chunk(cid, content=b"", children=b""):
    return cid + struct.pack("<II", len(content), len(children)) + content + children


def write_vox(path, W, H, D, vol):
    size = chunk(b"SIZE", struct.pack("<III", W, D, H))
    out = bytearray()
    for (i, j, k), v in sorted(vol.items()):
        out += struct.pack("<BBBB", i, k, H - 1 - j, v)      # z up, y into screen
    xyzi = chunk(b"XYZI", struct.pack("<I", len(vol)) + bytes(out))
    pal = bytearray()
    for n in range(256):
        r, g, b = PALETTE[n + 1] if n + 1 < len(PALETTE) else (0, 0, 0)
        pal += struct.pack("<BBBB", r, g, b, 255)
    rgba = chunk(b"RGBA", bytes(pal))
    open(path, "wb").write(b"VOX " + struct.pack("<I", 150)
                           + chunk(b"MAIN", b"", size + xyzi + rgba))


def read_vox(path):
    d = open(path, "rb").read()
    assert d[:4] == b"VOX ", "not a .vox file"
    p, size, vol, pal = 8, None, {}, None
    while p + 12 <= len(d):
        cid = d[p:p + 4]
        n = struct.unpack("<I", d[p + 4:p + 8])[0]
        body = d[p + 12:p + 12 + n]
        if cid == b"SIZE":
            size = struct.unpack("<III", body)
        elif cid == b"RGBA":
            pal = [struct.unpack("<BBBB", body[q * 4:q * 4 + 4])[:3] for q in range(256)]
        elif cid == b"XYZI":
            cnt = struct.unpack("<I", body[:4])[0]
            for q in range(cnt):
                x, y, z, c = struct.unpack("<BBBB", body[4 + q * 4:8 + q * 4])
                vol[(x, y, z)] = c
        # MAIN holds no content of its own: step past its header into the children
        p += 12 + (0 if cid == b"MAIN" else n)
    return size, vol, pal


def b36(n):
    if not n:
        return "0"
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + out
    return out


def encode(vol, W, H, D):
    """the volume as runs, in the renderer's own index order: k, then j, then i.
    A run is a base36 count then one value char, and the two alphabets do not
    overlap, so the decoder needs no separator."""
    out, run, prev = [], 0, 0
    for k in range(D):
        for j in range(H):
            for i in range(W):
                v = vol.get((i, j, k), 0)
                if v == prev:
                    run += 1
                    continue
                out.append(b36(run) + ".:-+#"[prev])
                prev, run = v, 1
    out.append(b36(run) + ".:-+#"[prev])
    return "".join(out)


def write_volume(name, vol, W, H, d, front, how, suffix=""):
    runs = encode(vol, W, H, d)
    body = "\n".join(runs[q:q + 72] for q in range(0, len(runs), 72))
    open(os.path.join(HERE, name + ".volume" + suffix + ".txt"), "w").write(
        f"# {name}.volume.txt: a value per voxel. Written by vox.py {how};\n"
        f"# mkmodel.py folds it into the model. d is the depth of the volume,\n"
        f"# front the slice the base plane sits on. Runs are a base36 count\n"
        f"# then one of . : - + #\n"
        f"d {d}\nfront {front}\n" + body + "\n")
    print(f"wrote {name}.volume{suffix}.txt  d={d} front={front}, "
          f"{len(vol)} voxels, {len(runs)} chars of runs")


def shell(name, depth):
    """Per voxel colour with no sculpting, from the front image alone.

    A head is drawn face on, so the front grid says nothing about the side of
    the skull and the extrusion fills it with the face. But the columns at the
    silhouette edge of a row ARE the side: at the eye row they are hair. So
    keep the front image as a shell `depth` voxels thick and give everything
    behind it the value of the nearer end of its own run of solid cells.

    Runs, not rows, because the legs are two runs and each one owns its edges.
    Where the front already agrees with its edges, which is most of the torso
    and both legs, this changes nothing. It bites on the face, which is the
    only place the front view lies about the side."""
    W, H, D, vol = read_model(name)
    out = {}
    for j in range(H):
        cols = {}
        for i in range(W):
            ks = [k for k in range(D) if (i, j, k) in vol]
            if ks:
                cols[i] = ks
        if not cols:
            continue
        runs, solid = [], sorted(cols)
        for i in solid:
            if runs and i == runs[-1][-1] + 1:
                runs[-1].append(i)
            else:
                runs.append([i])
        edge = {}
        for r in runs:
            a, b = r[0], r[-1]
            va, vb = vol[(a, j, min(cols[a]))], vol[(b, j, min(cols[b]))]
            for i in r:
                edge[i] = va if (i - a) <= (b - i) else vb
        for i, ks in cols.items():
            k0 = min(ks)
            for k in ks:
                out[(i, j, k)] = vol[(i, j, k)] if k < k0 + depth else edge[i]
    return W, H, D, out


def head_rows(name):
    import re
    t = open(os.path.join(HERE, name + ".model.js")).read()
    m = re.search(r"head:\s*\[(\d+),\s*(\d+)\]", t)
    return int(m.group(1)), int(m.group(2))


def round_head(name, depth, paint=None, paint_angle=0):
    """Make the skull round in plan, then colour it like a head.

    Geometry: each head row is carved to an ellipse, so the projected width
    stops swelling on a turn. Where a side map is authored, air in it trims
    the row further, which is how a jaw stays thin behind the chin. The map
    can only remove, never add, so the visor failure cannot return.

    Colour: the front `depth` voxels of each column keep the front image,
    laid over the curve like a texture. Behind that, a head row reads the
    side map at (depth step, row): the ear, the hair mass, the arm of a pair
    of shades live there. No map, or air in it, falls back to the nearer run
    edge, which is what the wrap always did.

    Enclosed holes in the head are plugged with the lightest value first. A
    cap patch drawn as a window in the hair becomes a thing on the head, so
    it turns with the head instead of vanishing into the window's wall."""
    W, H, D, vol = read_model(name)
    j0, j1 = head_rows(name)
    pr = PAINT_ROWS.get(name, (j0, j1))
    p0, p1 = max(pr[0], j0), min(pr[1], j1)
    side = read_side(name)
    if side is not None:
        assert len(side) == H, f"{name}: side map is {len(side)} rows, want {H}"
    vol = dict(vol)
    solid2d = {(i, j) for (i, j, k) in vol}
    seen, stack = set(), [(i, j) for i in range(W) for j in (0, H - 1)] \
                       + [(i, j) for i in (0, W - 1) for j in range(H)]
    while stack:
        c = stack.pop()
        if c in seen or c in solid2d:
            continue
        i, j = c
        if not (0 <= i < W and 0 <= j < H):
            continue
        seen.add(c)
        stack += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
    plugged = 0
    for j in range(j0, j1 + 1):
        ks_row = [k for (i, jj, k) in vol if jj == j]
        if not ks_row:
            continue
        for i in range(W):
            if (i, j) not in solid2d and (i, j) not in seen:
                for k in range(min(ks_row), max(ks_row) + 1):
                    vol[(i, j, k)] = 1
                plugged += 1
    if plugged:
        print(f"{name}: plugged {plugged} enclosed cells with ':'")
    out = {}
    for j in range(H):
        cols = {}
        for i in range(W):
            ks = [k for k in range(D) if (i, j, k) in vol]
            if ks:
                cols[i] = ks
        if not cols:
            continue
        srow = side[j] if side and j0 <= j <= j1 else None
        if j0 <= j <= j1:
            xs = sorted(cols)
            ks_all = [k for ks in cols.values() for k in ks]
            cx, rx = (xs[0] + xs[-1]) / 2, (xs[-1] - xs[0]) / 2 + 0.5
            ck, rk = (min(ks_all) + max(ks_all)) / 2, (max(ks_all) - min(ks_all)) / 2 + 0.5
            keep = lambda i, k: ((i - cx) / rx) ** 2 + ((k - ck) / rk) ** 2 <= 1 \
                                and (not srow or (k < len(srow) and srow[k] != "."))
            cols = {i: [k for k in ks if keep(i, k)] for i, ks in cols.items()}
            cols = {i: ks for i, ks in cols.items() if ks}
            if not cols:
                continue
        runs, solid = [], sorted(cols)
        for i in solid:
            if runs and i == runs[-1][-1] + 1:
                runs[-1].append(i)
            else:
                runs.append([i])
        edge = {}
        for r in runs:
            a, b = r[0], r[-1]
            va, vb = vol[(a, j, min(cols[a]))], vol[(b, j, min(cols[b]))]
            for i in r:
                edge[i] = va if (i - a) <= (b - i) else vb
        for i, ks in cols.items():
            k0 = min(ks)
            for k in ks:
                # The head's colour boundary is its midline, never a thin
                # shell. A ray grazing the curve at 25 degrees slips between
                # the shell voxels of neighbouring columns and hits whatever
                # sits behind, which speckled QUENT's face with hair and ear
                # cells. So the front half of the skull keeps the front image
                # column by column, like the extrusion always did, and the
                # side map owns everything behind the midline. The frontmost
                # voxel always keeps the image, so the rest view holds.
                head = j0 <= j <= j1
                if k == k0 or (head and k <= ck) or (not head and k < k0 + depth):
                    pv = 0
                    if paint and p0 <= j <= p1:
                        # The volume still rotates on screen, so a drawing of
                        # an already turned face would be turned twice. Lay it
                        # on pre rotated: each voxel takes the pixel that will
                        # sit over it once the head reaches the swap angle.
                        # match march() exactly: it shoots from screen column
                        # sx and a voxel is hit where sx = (i-cx)cos + (k-cz)sin,
                        # with cz the volume's own D/2, not this row's ellipse
                        # centre. JEAN's grid is drawn in screen columns at the
                        # swap angle, so each voxel takes the cell it will sit
                        # under once the head is there.
                        th = math.radians(paint_angle)
                        px = cx + (i - cx) * math.cos(th) + (k - D / 2) * math.sin(th)
                        ii = min(max(int(round(px)), xs[0]), xs[-1])
                        pv = VAL.get(paint[j][ii], 0)
                    out[(i, j, k)] = pv or vol[(i, j, k)]
                    continue
                sv = VAL.get(srow[k], 0) if srow and k < len(srow) else 0
                out[(i, j, k)] = sv or edge[i]
    return W, H, D, out



def draft_side(name):
    """A first profile, from the shape we already have.

    The depth and back maps already say how deep each cell sits, so the
    SILHOUETTE of the profile is known. What is missing is what the side
    looks like, and the best evidence in the front view is the column at the
    edge of each row: at the eye row that is hair, which is correct. So draft
    the outline from the extrusion and colour it from the row edges, then
    hand edit in the things only a profile has: the brim of a cap, the nose,
    the ear, the line of the jaw."""
    W, H, D, vol = read_model(name)
    out = []
    for j in range(H):
        xs = sorted({i for (i, jj, k) in vol if jj == j})
        edge = 0
        if xs:
            ks = [k for k in range(D) if (xs[0], j, k) in vol]
            edge = vol[(xs[0], j, min(ks))] if ks else 0
        row = ""
        for k in range(D):
            row += ".:-+#"[edge] if any((i, j, k) in vol for i in xs) else "."
        out.append(row)
    return out


def read_side(name):
    p = os.path.join(HERE, name + ".side.txt")
    if not os.path.exists(p):
        return None
    # `#` is a value character and a profile row can start with one, so the
    # header is marked by the space after the hash, which no row ever has.
    return [l.rstrip("\n") for l in open(p) if not l.startswith("# ") and l.strip()]


def write_side(name, rows):
    open(os.path.join(HERE, name + ".side.txt"), "w").write(
        f"# {name}.side.txt: the figure seen from its left, one row per height,\n"
        f"# one column per depth step. Column 0 is nearest the viewer at rest,\n"
        f"# the last column is the back. Same alphabet as the value grid:\n"
        f"# . air  : lightest  - mid  + dark  # darkest\n"
        f"# Draft it with --init-side, then draw in what only a profile has:\n"
        f"# the brim of a cap, the nose, the ear, the jaw.\n" + "\n".join(rows) + "\n")


def read_turn(name):
    p = os.path.join(HERE, name + ".turn.txt")
    if not os.path.exists(p):
        return None
    return [l.rstrip("\n") for l in open(p) if not l.startswith("# ") and l.strip()]


def turn_from_png(name):
    """A generated three quarter take, fitted onto the front view's spans.

    The turned PNG supplies colour, never shape: the figure's silhouette
    still comes from the front grid and the wrap, so each row of the take is
    resampled onto that row's front span. A take that sits a cell wide or a
    cell off centre therefore still lands, and a take that changes height
    does not, which is why proc.py's shared baseline matters.

    Rows the front view leaves empty stay empty. Rows the take leaves empty
    keep the front painting, because a turn map paints only where it speaks."""
    from PIL import Image
    import re as _re
    CELL = 12
    PAL = [(250, 248, 244), (233, 231, 226), (138, 135, 129),
           (63, 61, 56), (14, 13, 11)]
    im = Image.open(os.path.join(HERE, "gen", name + "-turn.png")).convert("RGB")
    px = im.load()
    W, H = 32, 56
    src = []
    for y in range(H):
        row = []
        for x in range(W):
            c = px[x * CELL + 6, y * CELL + 6]
            if c not in PAL:
                raise SystemExit(f"{name}-turn.png: cell {x},{y} is {c}, off palette")
            row.append(PAL.index(c))
        src.append(row)

    t = open(os.path.join(HERE, name + ".model.js")).read()
    vg = _re.search(r"value: `\n(.*?)`", t, _re.S).group(1).split("\n")
    out = []
    for j in range(H):
        dst = [q for q, c in enumerate(vg[j]) if c != "."]
        got = [q for q, v in enumerate(src[j]) if v]
        if not dst or not got:
            out.append("." * W)
            continue
        a, b = dst[0], dst[-1]
        a2, b2 = got[0], got[-1]
        row = ["."] * W
        for i in range(a, b + 1):
            f = 0 if b == a else (i - a) / (b - a)
            row[i] = ".\u00b7-+#"[src[j][min(max(int(round(a2 + f * (b2 - a2))), 0), W - 1)]]
        out.append("".join(row))
    open(os.path.join(HERE, name + ".turn.txt"), "w").write(
        f"# {name}.turn.txt: generated by QUENT as gen/{name}-turn.png, fitted\n"
        f"# here onto the front view's row spans by vox.py turn. Colour only:\n"
        f"# the silhouette comes from the front grid. Do not hand edit; retake\n"
        f"# or refit instead.\n" + "\n".join(out) + "\n")
    print(f"wrote {name}.turn.txt from gen/{name}-turn.png")


def mirror(turn):
    """the same drawing turned the other way: each row's painted span,
    reversed in place, so the ear changes sides and the lenses follow."""
    out = []
    for r in turn:
        cells = [q for q, c in enumerate(r) if c != "."]
        if not cells:
            out.append(r)
            continue
        a, b = cells[0], cells[-1]
        out.append(r[:a] + r[a:b + 1][::-1] + r[b + 1:])
    return out


def carve(name):
    """Two views, one volume. A voxel survives where the front says solid at
    (i, j) AND the profile says solid at (k, j), so the profile finally gets a
    say in the shape. A surface facing the viewer takes the front value, every
    other surface takes the profile value, which is how a cap keeps its brim
    when the head turns instead of evaporating into hair."""
    W, H, D, vol = read_model(name)
    side = read_side(name)
    assert side, f"{name}: no side map, run mkmodel.py --init-side {name} first"
    assert len(side) == H, f"{name}: side map is {len(side)} rows, want {H}"
    front_at, solid = {}, set()
    for (i, j, k), v in vol.items():
        solid.add((i, j))
        if (i, j) not in front_at or k < front_at[(i, j)][0]:
            front_at[(i, j)] = (k, v)
    out = {}
    for j in range(H):
        for k in range(D):
            sv = VAL.get(side[j][k], 0) if k < len(side[j]) else 0
            if not sv:
                continue
            for i in range(W):
                if (i, j) not in solid:
                    continue
                # exposed to the front: the front view owns this face
                ahead = any(VAL.get(side[j][q], 0) for q in range(k))
                out[(i, j, k)] = front_at[(i, j)][1] if not ahead else sv
    return W, H, D, out


def to_ours(size, raw, H, pal):
    """.vox axes back to ours, and every colour to one of the four values.

    MagicaVoxel writes whatever palette slot was painted, not the slot it was
    seeded with, so an index is not a value. Match on the colour itself and any
    slot he picks lands on the nearest of the four the site can draw."""
    def value(c):
        if not pal:
            return min(max(c, 1), 4)
        r, g, b = pal[c - 1]
        return min(range(1, 5), key=lambda v: sum(
            (a - q) ** 2 for a, q in zip(PALETTE[v], (r, g, b))))
    return {(x, H - 1 - z, y): value(c) for (x, y, z), c in raw.items()}


if __name__ == "__main__":
    cmd, name = sys.argv[1], sys.argv[2]
    W, H, D, vol = read_model(name)
    path = os.path.join(HERE, name + ".vox")
    if cmd == "init-side":
        write_side(name, draft_side(name))
        print(f"wrote {name}.side.txt (draft)")
    elif cmd == "carve":
        W, H, D, out = carve(name)
        write_volume(name, out, W, H, D, FRONT[name], "carve")
    elif cmd == "turn":
        turn_from_png(name)
    elif cmd == "round":
        depth = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        W, H, D, out = round_head(name, depth)
        write_volume(name, out, W, H, D, FRONT[name], f"round {depth}")
        turn = read_turn(name)
        if turn:
            assert len(turn) == H, f"{name}: turn map is {len(turn)} rows, want {H}"
            for suffix, grid, ang in (("L", turn, -22), ("R", mirror(turn), 22)):
                _, _, _, tv = round_head(name, depth, paint=grid, paint_angle=ang)
                write_volume(name, tv, W, H, D, FRONT[name], f"round {depth}", suffix)
    elif cmd == "shell":
        depth = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        W, H, D, out = shell(name, depth)
        write_volume(name, out, W, H, D, FRONT[name], f"shell {depth}")
    elif cmd == "export":
        write_vox(path, W, H, D, vol)
        print(f"wrote {name}.vox  {W}x{D}x{H}, {len(vol)} voxels")
    elif cmd in ("import", "roundtrip"):
        size, raw, pal = read_vox(path)
        back = to_ours(size, raw, H, pal)
        if cmd == "import":
            # the sculpt may be deeper than the extrusion it was seeded from
            d = max(size[1], max((k for (_, _, k) in back), default=0) + 1)
            write_volume(name, back, W, H, d, FRONT[name], "import")
        if cmd == "roundtrip":
            same = back == vol
            print(f"round trip {'IDENTICAL' if same else 'DIFFERS'}: "
                  f"{len(vol)} out, {len(back)} back")
            if not same:
                d = {k for k in set(vol) | set(back) if vol.get(k) != back.get(k)}
                print(f"  {len(d)} cells differ, e.g. {list(d)[:3]}")
                sys.exit(1)
