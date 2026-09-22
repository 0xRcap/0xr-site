import os, sys
from collections import Counter
from PIL import Image

SP = "/private/tmp/claude-501/-Users-rodrigorivas-Desktop-My-Agents-studio/2834ee23-ace0-430c-a08e-26bc9f4fbef9/scratchpad/gen"
OUT = "/Users/rodrigorivas/Desktop/My_Agents/studio/site/crew/gen"
os.makedirs(OUT, exist_ok=True)

PAPER = (0xFA, 0xF8, 0xF4)
RULE  = (0xE9, 0xE7, 0xE2)
TONE  = (0x8A, 0x87, 0x81)
INKS  = (0x3F, 0x3D, 0x38)
INK   = (0x0E, 0x0D, 0x0B)
PAL = [PAPER, RULE, TONE, INKS, INK]        # index 0..4

GRID_W, GRID_H = 32, 56                      # shared cell grid
FIG_H = 50                                   # every figure this many cells tall
TOP   = 2                                    # rows of paper above the head
STRIP_ROW = TOP + FIG_H                      # the shadow strip row
CELL = 12                                    # px per cell when written out

NAMES = ["steve", "jean", "ye", "frank", "quent", "kim"]


def lum(px):
    r, g, b = px[:3]
    return 0.299 * r + 0.587 * g + 0.114 * b


def quantize_index(L):
    if L >= 226: return 0
    if L >= 190: return 1
    if L >= 108: return 2
    if L >= 52:  return 3
    return 4


def load_indexed(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    idx = [[quantize_index(lum(px[x, y])) for x in range(w)] for y in range(h)]
    return idx, w, h


def figure_bbox(idx, w, h):
    """Tight box on real figure ink (indices 2,3,4). Ignores the faint strip (index 1)."""
    xs, ys = [], []
    for y in range(h):
        row = idx[y]
        for x in range(w):
            if row[x] >= 2:
                xs.append(x); ys.append(y)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def mode_downsample(idx, box, tw, th):
    x0, y0, x1, y1 = box
    sw, sh = x1 - x0, y1 - y0
    out = [[0] * tw for _ in range(th)]
    for ty in range(th):
        ya = y0 + int(ty * sh / th); yb = max(ya + 1, y0 + int((ty + 1) * sh / th))
        for tx in range(tw):
            xa = x0 + int(tx * sw / tw); xb = max(xa + 1, x0 + int((tx + 1) * sw / tw))
            c = Counter()
            for y in range(ya, yb):
                r = idx[y]
                for x in range(xa, xb):
                    c[r[x]] += 1
            # a cell that is mostly background but holds real ink keeps the ink
            best = c.most_common()
            top = best[0][0]
            tot = sum(c.values())
            if top == 0:
                ink = sum(v for k, v in c.items() if k >= 2)
                if ink * 2 >= tot:
                    top = max((v, k) for k, v in c.items() if k >= 2)[1]
            # thin dark features (glasses, eyes, mouth, chain) are one source pixel
            # wide and the mode filter eats them. Keep ink over a lit plane.
            if top in (1, 2) and c.get(4, 0) >= 0.28 * tot:
                top = 4
            elif top == 2 and c.get(3, 0) >= 0.40 * tot:
                top = 3
            out[ty][tx] = top
    return out


def build(name):
    idx, w, h = load_indexed(os.path.join(SP, name + "_raw.png"))
    box = figure_bbox(idx, w, h)
    fw = box[2] - box[0]; fh = box[3] - box[1]
    tw = max(1, min(GRID_W - 2, round(fw * FIG_H / fh)))
    small = mode_downsample(idx, box, tw, FIG_H)

    canvas = [[0] * GRID_W for _ in range(GRID_H)]
    ox = (GRID_W - tw) // 2
    for y in range(FIG_H):
        for x in range(tw):
            canvas[TOP + y][ox + x] = small[y][x]
    # the shadow strip: rule, one row, centred, a little wider than the feet
    feet = [x for x in range(tw) if small[FIG_H - 1][x] >= 2]
    if feet:
        a = ox + min(feet) - 2; b = ox + max(feet) + 3
    else:
        a, b = ox, ox + tw
    for x in range(max(0, a), min(GRID_W, b)):
        if canvas[STRIP_ROW][x] == 0:
            canvas[STRIP_ROW][x] = 1

    im = Image.new("RGB", (GRID_W * CELL, GRID_H * CELL), PAPER)
    p = im.load()
    for y in range(GRID_H):
        for x in range(GRID_W):
            c = PAL[canvas[y][x]]
            for j in range(CELL):
                for i in range(CELL):
                    p[x * CELL + i, y * CELL + j] = c
    im.save(os.path.join(OUT, name + ".png"))
    used = sorted(set(v for r in canvas for v in r))
    print(f"{name}: src fig {fw}x{fh}px -> {tw}x{FIG_H} cells, values {used}")
    return canvas


def sheet(canvases):
    GAP = 2
    W = len(NAMES) * GRID_W + (len(NAMES) + 1) * GAP
    im = Image.new("RGB", (W * CELL, (GRID_H + 2 * GAP) * CELL), PAPER)
    p = im.load()
    x0 = GAP
    for cv in canvases:
        for y in range(GRID_H):
            for x in range(GRID_W):
                c = PAL[cv[y][x]]
                for j in range(CELL):
                    for i in range(CELL):
                        p[(x0 + x) * CELL + i, (GAP + y) * CELL + j] = c
        x0 += GRID_W + GAP
    im.save(os.path.join(OUT, "sheet.png"))
    print("sheet", im.size)


if __name__ == "__main__":
    sheet([build(n) for n in NAMES])
