"""Generate 6 tabbar icons (3 icons × 2 states: normal gray / active blue)."""
from PIL import Image, ImageDraw

SIZE = 81
NORMAL = (153, 153, 153, 255)   # #999999
ACTIVE = (0, 82, 217, 255)      # #0052d9


def new_canvas():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def draw_posts(draw, color):
    # 帖子：圆角矩形 + 三条横线
    pad = 14
    w = SIZE - pad * 2
    draw.rounded_rectangle([pad, pad, pad + w, pad + w], radius=10, outline=color, width=4)
    line_w = 4
    for i, y in enumerate([pad + 18, pad + 36, pad + 54]):
        line_end = pad + w - 14 if i == 2 else pad + w - 6
        draw.line([pad + 14, y, line_end, y], fill=color, width=line_w)


def draw_clock(draw, color):
    # 时钟：圆 + 时针分针
    cx, cy = SIZE // 2, SIZE // 2
    r = 28
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=4)
    # 时针（短）
    draw.line([cx, cy, cx + 10, cy - 12], fill=color, width=4)
    # 分针（长）
    draw.line([cx, cy, cx - 4, cy - 20], fill=color, width=4)
    # 顶部小标记
    draw.ellipse([cx - 2, cy - r - 4, cx + 2, cy - r], fill=color)


def draw_user(draw, color):
    # 用户：圆头 + 半圆身体
    cx = SIZE // 2
    # 头
    head_r = 11
    head_cy = 26
    draw.ellipse([cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r], fill=color)
    # 身体（半圆/弧）
    body_r = 24
    body_cy = 62
    draw.arc([cx - body_r, body_cy - body_r, cx + body_r, body_cy + body_r],
             start=180, end=360, fill=color, width=5)


ICON_DRAWERS = {
    "posts": draw_posts,
    "clock": draw_clock,
    "user": draw_user,
}

STATES = [
    ("normal", NORMAL),
    ("active", ACTIVE),
]

OUT_DIR = "packages/miniapp/assets/tabbar"

for name, drawer in ICON_DRAWERS.items():
    for state, color in STATES:
        img, draw = new_canvas()
        drawer(draw, color)
        out_path = f"{OUT_DIR}/{name}-{state}.png"
        img.save(out_path, "PNG")
        print(f"  ✓ {out_path}")

print("Done.")
