import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let srcPath = CommandLine.arguments[1]
let destPath = CommandLine.arguments[2]
guard let overlay = NSImage(contentsOfFile: srcPath) else {
  fputs("no source\n", stderr)
  exit(1)
}

let width = 1024
let height = 1024
let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(
  data: nil,
  width: width,
  height: height,
  bitsPerComponent: 8,
  bytesPerRow: width * 4,
  space: colorSpace,
  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else {
  fputs("no ctx\n", stderr)
  exit(1)
}

ctx.setFillColor(CGColor(srgbRed: 0, green: 107.0 / 255.0, blue: 253.0 / 255.0, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
if let cgOverlay = overlay.cgImage(forProposedRect: nil, context: nil, hints: nil) {
  ctx.draw(cgOverlay, in: CGRect(x: 0, y: 0, width: width, height: height))
}

guard let image = ctx.makeImage() else {
  fputs("no image\n", stderr)
  exit(1)
}

let destURL = URL(fileURLWithPath: destPath) as CFURL
guard let dest = CGImageDestinationCreateWithURL(destURL, UTType.png.identifier as CFString, 1, nil) else {
  fputs("no dest\n", stderr)
  exit(1)
}
CGImageDestinationAddImage(dest, image, nil)
if !CGImageDestinationFinalize(dest) {
  fputs("finalize failed\n", stderr)
  exit(1)
}
print("wrote \(destPath)")
