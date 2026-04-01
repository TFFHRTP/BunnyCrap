#!/usr/bin/env python3
import os
import struct
import sys
import zlib
from collections import deque

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def paeth_predictor(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_chunks(data):
    pos = 8
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        ctype = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        yield ctype, chunk
        if ctype == b"IEND":
            break


def unfilter_scanlines(raw, width, height, bpp):
    stride = width * bpp
    out = bytearray(height * stride)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        f = raw[pos]
        pos += 1
        row = bytearray(raw[pos:pos + stride])
        pos += stride
        if f == 1:
            for i in range(stride):
                left = row[i - bpp] if i >= bpp else 0
                row[i] = (row[i] + left) & 255
        elif f == 2:
            for i in range(stride):
                row[i] = (row[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                left = row[i - bpp] if i >= bpp else 0
                row[i] = (row[i] + ((left + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                left = row[i - bpp] if i >= bpp else 0
                up = prev[i]
                ul = prev[i - bpp] if i >= bpp else 0
                row[i] = (row[i] + paeth_predictor(left, up, ul)) & 255
        elif f != 0:
            raise ValueError(f"Unsupported PNG filter {f}")
        out[y * stride:(y + 1) * stride] = row
        prev = row
    return out


def filter_none(rgba, width, height, bpp):
    stride = width * bpp
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(rgba[y * stride:(y + 1) * stride])
    return raw


def load_png(path):
    data = open(path, "rb").read()
    if data[:8] != PNG_SIG:
        raise ValueError("Not a PNG")
    width = height = bit_depth = color_type = None
    idat = []
    for ctype, chunk in read_chunks(data):
        if ctype == b"IHDR":
            width, height, bit_depth, color_type, compression, flt, interlace = struct.unpack(">IIBBBBB", chunk)
            if bit_depth != 8 or compression != 0 or flt != 0 or interlace != 0:
                raise ValueError("Unsupported PNG format")
            if color_type not in (2, 6):
                raise ValueError(f"Unsupported color type {color_type}")
        elif ctype == b"IDAT":
            idat.append(chunk)
    raw = zlib.decompress(b"".join(idat))
    src_bpp = 3 if color_type == 2 else 4
    pix = unfilter_scanlines(raw, width, height, src_bpp)
    if color_type == 6:
        rgba = bytearray(pix)
    else:
        rgba = bytearray()
        for i in range(0, len(pix), 3):
            rgba.extend(pix[i:i + 3])
            rgba.append(255)
    return width, height, rgba


def write_png(path, width, height, rgba):
    bpp = 4
    raw = filter_none(rgba, width, height, bpp)
    compressed = zlib.compress(bytes(raw), 9)

    def chunk(ctype, payload):
        return struct.pack(">I", len(payload)) + ctype + payload + struct.pack(">I", zlib.crc32(ctype + payload) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(PNG_SIG)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))


def pixel(rgba, width, x, y):
    idx = (y * width + x) * 4
    return tuple(rgba[idx:idx + 4])


def set_alpha(rgba, width, x, y, a):
    rgba[(y * width + x) * 4 + 3] = a


def has_transparency(rgba):
    return any(rgba[i] < 250 for i in range(3, len(rgba), 4))


def dist(c1, c2):
    dr = c1[0] - c2[0]
    dg = c1[1] - c2[1]
    db = c1[2] - c2[2]
    return (dr * dr + dg * dg + db * db) ** 0.5


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def border_mean(rgba, width, height):
    vals = []
    for x in range(width):
        vals.append(pixel(rgba, width, x, 0))
        vals.append(pixel(rgba, width, x, height - 1))
    for y in range(1, height - 1):
        vals.append(pixel(rgba, width, 0, y))
        vals.append(pixel(rgba, width, width - 1, y))
    n = len(vals)
    return (
        sum(v[0] for v in vals) / n,
        sum(v[1] for v in vals) / n,
        sum(v[2] for v in vals) / n,
        255,
    )


def remove_background(path):
    width, height, rgba = load_png(path)
    if has_transparency(rgba):
        return "skipped-existing-alpha"

    mean = border_mean(rgba, width, height)
    mean_l = lum(mean)
    mask = [False] * (width * height)
    visited = [False] * (width * height)
    q = deque()

    def enqueue(x, y):
        idx = y * width + x
        if not visited[idx]:
            visited[idx] = True
            q.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(1, height - 1):
        enqueue(0, y)
        enqueue(width - 1, y)

    while q:
        x, y = q.popleft()
        idx = y * width + x
        c = pixel(rgba, width, x, y)
        dmean = dist(c, mean)
        ld = abs(lum(c) - mean_l)
        if dmean <= 95 or (dmean <= 120 and ld <= 38):
            mask[idx] = True
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    nidx = ny * width + nx
                    if not visited[nidx]:
                        nc = pixel(rgba, width, nx, ny)
                        local = dist(c, nc)
                        nd = dist(nc, mean)
                        nld = abs(lum(nc) - mean_l)
                        if local <= 36 or nd <= 88 or (nd <= 118 and nld <= 34):
                            visited[nidx] = True
                            q.append((nx, ny))

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if mask[idx]:
                near_subject = False
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            nidx = ny * width + nx
                            if not mask[nidx]:
                                near_subject = True
                set_alpha(rgba, width, x, y, 24 if near_subject else 0)

    write_png(path, width, height, rgba)
    return "processed"


def main():
    if len(sys.argv) < 2:
        print("usage: remove_background.py <png> [<png>...]", file=sys.stderr)
        return 1
    failures = []
    for path in sys.argv[1:]:
        try:
            result = remove_background(path)
            print(f"{result} {path}")
        except Exception as exc:
            failures.append((path, str(exc)))
    if failures:
        for path, err in failures:
            print(f"failed {path}: {err}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
