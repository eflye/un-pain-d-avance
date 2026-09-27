// Dérive le logo ardoise (sur fond clair) du logo blanc à ombre portée du site de la boulangerie.
// Source : docs/brand/logo-lamiedeininge.png (https://www.lamiedeininge.fr/images/logo.png)
// Usage : node scripts/recolor-logo.mjs
import sharp from 'sharp'

const SLATE = [0x3d, 0x4d, 0x58]
const { data, info } = await sharp('docs/brand/logo-lamiedeininge.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  // Lettres = pixels quasi blancs ; l'ombre grise est écartée.
  const keep = Math.min(1, Math.max(0, (luminance - 170) / (245 - 170)))
  data[i] = SLATE[0]
  data[i + 1] = SLATE[1]
  data[i + 2] = SLATE[2]
  data[i + 3] = Math.round(data[i + 3] * keep)
}

await sharp(data, { raw: info })
  .trim()
  .png({ compressionLevel: 9 })
  .toFile('public/brand/logo-ardoise.png')
console.log('public/brand/logo-ardoise.png écrit')
