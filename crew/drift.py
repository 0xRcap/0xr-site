"""JEAN's drift test, as code.

From jean/projects/crew-turn/identity-anchors.md section (c). Seven of her
nine items are countable from the grid and they run here; item 2, the
stranger test, and item 9, the row test, are looked at and are reported as
MANUAL rather than silently passed. The point of the file is that a turned
grid is judged the same way every time, by counting, instead of by whoever
is looking at it that afternoon.

    python3 drift.py rodrigo            judge rodrigo.turn.txt
    python3 drift.py rodrigo other.txt  judge a candidate before installing it
"""
import re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
VALS = ".·-+#"
LIT, MID, DARK, INK = 1, 2, 3, 4
# JEAN 2026-09-18: the rows a turned take may repaint, intersected with the
# rig's own head band, since below it nothing rotates.
PAINT = {"rodrigo": (2, 15), "quent": (2, 17), "steve": (2, 15),
         "jean": (2, 13), "frank": (2, 17), "ye": (2, 9), "kim": (2, 15)}


def front(name):
    t = open(os.path.join(HERE, name + ".model.js")).read()
    rows = re.search(r"value: `\n(.*?)`", t, re.S).group(1).split("\n")
    eyes = [(int(a), int(b)) for a, b in
            re.findall(r"\[(\d+),\s*(\d+)\]", re.search(r"eyes: \[(.*?)\]\]", t).group(0))]
    return [[VALS.index(c) for c in r] for r in rows if r], eyes


def load(path):
    rows = [l.rstrip("\n") for l in open(path) if not l.startswith("# ") and l.strip()]
    return [[VALS.index(c) for c in r] for r in rows]


def judge(name, path):
    f, eyes = front(name)
    t = load(path)
    j0, j1 = PAINT.get(name, (2, 15))
    H, W = len(f), len(f[0])
    out = []
    ok = lambda n, good, msg: out.append((good, f"{n}. {msg}"))

    if len(t) != H or any(len(r) != W for r in t):
        return [(False, f"grid is {len(t)}x{len(t[0]) if t else 0}, want {H}x{W}")]

    # 1. silhouette identity, JEAN's correction of 2026-09-18: the OUTER
    # silhouette is paper reachable from the frame edge and may never change.
    # Paper fully enclosed by ink is not silhouette, it is a value the
    # generator could not express, so it is plugged and may move.
    outer, stack = set(), [(i, j) for i in range(W) for j in (0, H - 1)] \
                        + [(i, j) for i in (0, W - 1) for j in range(H)]
    while stack:
        i, j = stack.pop()
        if (i, j) in outer or not (0 <= i < W and 0 <= j < H) or f[j][i]:
            continue
        outer.add((i, j))
        stack += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
    bad = [(i, j) for j in range(H) for i in range(W)
           if ((i, j) in outer or f[j][i]) and (f[j][i] == 0) != (t[j][i] == 0)]
    enc = [(i, j) for j in range(H) for i in range(W)
           if f[j][i] == 0 and (i, j) not in outer and t[j][i] != 0]
    ok(1, not bad, f"outer silhouette: {len(bad)} cells changed"
       + (f", first {bad[:4]}" if bad else "")
       + (f"; {len(enc)} enclosed paper cells plugged, which is allowed" if enc else ""))

    # rows outside the paint band must be the front grid verbatim
    stray = [j for j in range(H) if not (j0 <= j <= j1) and t[j] != f[j]]
    ok("1b", not stray, f"body untouched outside rows {j0}-{j1}: "
       + (f"rows {stray[:6]} repainted" if stray else "clean"))

    head = [(i, j) for j in range(j0, j1 + 1) for i in range(W) if f[j][i]]
    moved = [c for c in head if t[c[1]][c[0]] != f[c[1]][c[0]]]
    # 3. restamp test: a head that barely changed did not turn
    ok(3, len(moved) * 6 >= len(head),
       f"restamp: {len(moved)}/{len(head)} head cells moved "
       f"({len(moved) / max(len(head), 1):.0%}, floor 17%)")

    # 4. skull test: no eye cell lighter than the cell beneath it
    sk = [(x, y) for (x, y) in eyes
          if y + 1 < H and t[y][x] < t[y + 1][x]]
    ok(4, not sk, f"skull: {len(sk)} eye cells lighter than the cell below"
       + (f" at {sk}" if sk else ""))

    # 5. no near black INSIDE a lit plane. A cell the face loses to the hair
    # widening correctly goes near black; only a cell lost to SHADOW must go
    # dark grey. So the test is a true hole: near black ringed by lit on all
    # four sides, which is how a face becomes a skull.
    holes = [(i, j) for (i, j) in head if t[j][i] == INK
             and all(0 <= i + dx < W and 0 <= j + dy < H and t[j + dy][i + dx] == MID
                     for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    ok(5, not holes, f"holes: {len(holes)} near-black cells ringed by lit"
       + (f", first {holes[:4]}" if holes else ""))

    # 7. trailing plane: the turn must add dark-grey shading to the head
    fd = sum(1 for (i, j) in head if f[j][i] == DARK)
    td = sum(1 for (i, j) in head if t[j][i] == DARK)
    ok(7, td > fd, f"trailing plane: {VALS[DARK]} cells in head {fd} -> {td}"
       + ("" if td > fd else "  (the turn invented no shading)"))

    # 8. orphan test: every head cell needs an orthogonal neighbour of its value
    orph = []
    for (i, j) in head:
        v = t[j][i]
        if not any(0 <= i + dx < W and 0 <= j + dy < H and t[j + dy][i + dx] == v
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            orph.append((i, j))
    ok(8, not orph, f"orphans: {len(orph)} head cells with no like neighbour"
       + (f", first {orph[:4]}" if orph else ""))

    out.append((None, "2. stranger test: MANUAL, cover the body, name him in 3s"))
    out.append((None, "6. pair test: MANUAL, every mirrored pair unequal"))
    out.append((None, "9. row test: MANUAL, all seven heads lead the same way"))
    return out


if __name__ == "__main__":
    name = sys.argv[1]
    path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, name + ".turn.txt")
    if not os.path.exists(path):
        raise SystemExit(f"no turn grid at {path}")
    res = judge(name, path)
    for good, msg in res:
        print(f"  {'....' if good is None else ' PASS' if good else ' FAIL'}  {msg}")
    fails = [m for g, m in res if g is False]
    print(f"\n{name}: {'FAIL, ' + str(len(fails)) + ' items' if fails else 'passes every countable item'}")
    sys.exit(1 if fails else 0)
