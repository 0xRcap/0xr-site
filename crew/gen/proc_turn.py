import sys, os
sys.path.insert(0, "/Users/rodrigorivas/Desktop/My_Agents/studio/site/crew/gen")
import proc
from PIL import Image

SP = proc.SP
OUT = proc.OUT

def front_span(name):
    """Cell columns occupied by the front PNG's figure, and its ink rows."""
    im = Image.open(os.path.join(OUT, name + ".png")).convert("RGB")
    px = im.load()
    cols = []
    for x in range(proc.GRID_W):
        for y in range(proc.TOP, proc.TOP + proc.FIG_H):
            if proc.PAL.index(px[x*proc.CELL+6, y*proc.CELL+6]) >= 2:
                cols.append(x); break
    return min(cols), max(cols)+1

def build_turn(name):
    idx, w, h = proc.load_indexed(os.path.join(SP, name + "_turn_raw.png"))
    box = proc.figure_bbox(idx, w, h)
    fw = box[2]-box[0]; fh = box[3]-box[1]
    tw = max(1, min(proc.GRID_W-2, round(fw * proc.FIG_H / fh)))
    small = proc.mode_downsample(idx, box, tw, proc.FIG_H)

    a, b = front_span(name)
    centre = (a + b) / 2.0
    ox = int(round(centre - tw/2.0))
    ox = max(0, min(proc.GRID_W - tw, ox))

    canvas = [[0]*proc.GRID_W for _ in range(proc.GRID_H)]
    for y in range(proc.FIG_H):
        for x in range(tw):
            canvas[proc.TOP+y][ox+x] = small[y][x]
    feet = [x for x in range(tw) if small[proc.FIG_H-1][x] >= 2]
    if feet:
        s0 = ox+min(feet)-2; s1 = ox+max(feet)+3
    else:
        s0, s1 = ox, ox+tw
    for x in range(max(0,s0), min(proc.GRID_W,s1)):
        if canvas[proc.STRIP_ROW][x] == 0:
            canvas[proc.STRIP_ROW][x] = 1

    im = Image.new("RGB", (proc.GRID_W*proc.CELL, proc.GRID_H*proc.CELL), proc.PAPER)
    p = im.load()
    for y in range(proc.GRID_H):
        for x in range(proc.GRID_W):
            c = proc.PAL[canvas[y][x]]
            for j in range(proc.CELL):
                for i in range(proc.CELL):
                    p[x*proc.CELL+i, y*proc.CELL+j] = c
    im.save(os.path.join(OUT, name + "-turn.png"))
    used = sorted(set(v for r in canvas for v in r))
    print(f"{name}-turn: src {fw}x{fh}px -> {tw}x{proc.FIG_H} cells at ox={ox} "
          f"(front span {a}..{b}, {b-a} cells), values {used}")
    return canvas

if __name__ == "__main__":
    for n in sys.argv[1:]:
        build_turn(n)
