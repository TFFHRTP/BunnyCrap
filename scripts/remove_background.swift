import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct RGBA {
    var r: UInt8
    var g: UInt8
    var b: UInt8
    var a: UInt8
}

func colorDistance(_ a: RGBA, _ b: RGBA) -> Double {
    let dr = Double(Int(a.r) - Int(b.r))
    let dg = Double(Int(a.g) - Int(b.g))
    let db = Double(Int(a.b) - Int(b.b))
    return (dr * dr + dg * dg + db * db).squareRoot()
}

func luminance(_ c: RGBA) -> Double {
    return 0.2126 * Double(c.r) + 0.7152 * Double(c.g) + 0.0722 * Double(c.b)
}

func loadImage(url: URL) -> (cgImage: CGImage, pixels: UnsafeMutableBufferPointer<UInt8>, width: Int, height: Int, bytesPerRow: Int)? {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        return nil
    }
    let width = cgImage.width
    let height = cgImage.height
    let bytesPerRow = width * 4
    let raw = UnsafeMutablePointer<UInt8>.allocate(capacity: height * bytesPerRow)
    raw.initialize(repeating: 0, count: height * bytesPerRow)
    guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
          let ctx = CGContext(
            data: raw,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
          ) else {
        raw.deallocate()
        return nil
    }
    ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
    return (cgImage, UnsafeMutableBufferPointer(start: raw, count: height * bytesPerRow), width, height, bytesPerRow)
}

func pixel(_ pixels: UnsafeMutableBufferPointer<UInt8>, _ x: Int, _ y: Int, _ bytesPerRow: Int) -> RGBA {
    let idx = y * bytesPerRow + x * 4
    return RGBA(r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2], a: pixels[idx + 3])
}

func setAlpha(_ pixels: UnsafeMutableBufferPointer<UInt8>, _ x: Int, _ y: Int, _ bytesPerRow: Int, _ alpha: UInt8) {
    let idx = y * bytesPerRow + x * 4 + 3
    pixels[idx] = alpha
}

func saveImage(url: URL, pixels: UnsafeMutableBufferPointer<UInt8>, width: Int, height: Int, bytesPerRow: Int) -> Bool {
    guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
          let ctx = CGContext(
            data: pixels.baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
          ),
          let out = ctx.makeImage(),
          let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        return false
    }
    CGImageDestinationAddImage(dest, out, nil)
    return CGImageDestinationFinalize(dest)
}

func edgeMeanColor(pixels: UnsafeMutableBufferPointer<UInt8>, width: Int, height: Int, bytesPerRow: Int) -> RGBA {
    var sumR = 0.0, sumG = 0.0, sumB = 0.0, count = 0.0
    for x in 0..<width {
        for y in [0, height - 1] {
            let c = pixel(pixels, x, y, bytesPerRow)
            sumR += Double(c.r); sumG += Double(c.g); sumB += Double(c.b); count += 1
        }
    }
    for y in 1..<(height - 1) {
        for x in [0, width - 1] {
            let c = pixel(pixels, x, y, bytesPerRow)
            sumR += Double(c.r); sumG += Double(c.g); sumB += Double(c.b); count += 1
        }
    }
    return RGBA(r: UInt8(sumR / count), g: UInt8(sumG / count), b: UInt8(sumB / count), a: 255)
}

func removeBackground(url: URL) -> Bool {
    guard let loaded = loadImage(url: url) else { return false }
    let width = loaded.width
    let height = loaded.height
    let bytesPerRow = loaded.bytesPerRow
    let pixels = loaded.pixels
    defer {
        pixels.baseAddress?.deallocate()
    }

    // Skip if already has meaningful transparency
    var hasTransparency = false
    for y in stride(from: 0, to: height, by: max(1, height / 10)) {
        for x in stride(from: 0, to: width, by: max(1, width / 10)) {
            if pixel(pixels, x, y, bytesPerRow).a < 250 {
                hasTransparency = true
                break
            }
        }
        if hasTransparency { break }
    }
    if hasTransparency { return true }

    let borderMean = edgeMeanColor(pixels: pixels, width: width, height: height, bytesPerRow: bytesPerRow)
    let borderLum = luminance(borderMean)
    var visited = Array(repeating: false, count: width * height)
    var mask = Array(repeating: false, count: width * height)
    var queue: [(Int, Int)] = []
    queue.reserveCapacity(width * 4 + height * 4)

    func enqueue(_ x: Int, _ y: Int) {
        let idx = y * width + x
        if !visited[idx] {
            visited[idx] = true
            queue.append((x, y))
        }
    }

    for x in 0..<width {
        enqueue(x, 0)
        enqueue(x, height - 1)
    }
    for y in 1..<(height - 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
    }

    var head = 0
    let neighborOffsets = [(1,0),(-1,0),(0,1),(0,-1)]
    while head < queue.count {
        let (x, y) = queue[head]
        head += 1
        let idx = y * width + x
        let c = pixel(pixels, x, y, bytesPerRow)
        let distToMean = colorDistance(c, borderMean)
        let lumDiff = abs(luminance(c) - borderLum)

        // Background decision tuned for smooth studio gradients / backdrops.
        if distToMean <= 95 || (distToMean <= 120 && lumDiff <= 38) {
            mask[idx] = true
            for (dx, dy) in neighborOffsets {
                let nx = x + dx
                let ny = y + dy
                if nx >= 0 && ny >= 0 && nx < width && ny < height {
                    let nidx = ny * width + nx
                    if !visited[nidx] {
                        let nc = pixel(pixels, nx, ny, bytesPerRow)
                        let localDist = colorDistance(c, nc)
                        let nDistToMean = colorDistance(nc, borderMean)
                        let nLumDiff = abs(luminance(nc) - borderLum)
                        if localDist <= 36 || nDistToMean <= 88 || (nDistToMean <= 118 && nLumDiff <= 34) {
                            visited[nidx] = true
                            queue.append((nx, ny))
                        }
                    }
                }
            }
        }
    }

    // Feather edge by reducing alpha near the boundary rather than hard-cutting everything.
    for y in 0..<height {
        for x in 0..<width {
            let idx = y * width + x
            if mask[idx] {
                var nearSubject = false
                for dy in -1...1 {
                    for dx in -1...1 {
                        let nx = x + dx
                        let ny = y + dy
                        if nx >= 0 && ny >= 0 && nx < width && ny < height {
                            let nidx = ny * width + nx
                            if !mask[nidx] {
                                nearSubject = true
                            }
                        }
                    }
                }
                setAlpha(pixels, x, y, bytesPerRow, nearSubject ? 24 : 0)
            }
        }
    }

    return saveImage(url: url, pixels: pixels, width: width, height: height, bytesPerRow: bytesPerRow)
}

let args = CommandLine.arguments.dropFirst()
guard !args.isEmpty else {
    fputs("usage: swift scripts/remove_background.swift <png> [<png>...]\n", stderr)
    exit(1)
}

var failures: [String] = []
for arg in args {
    let url = URL(fileURLWithPath: arg)
    if !removeBackground(url: url) {
        failures.append(arg)
    } else {
        print("processed \(arg)")
    }
}

if !failures.isEmpty {
    fputs("failed: \(failures.joined(separator: \", \"))\n", stderr)
    exit(2)
}
