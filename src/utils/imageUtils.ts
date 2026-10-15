function drawScaled(file: File, maxWidth: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas)
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function compressImage(file: File, maxWidth = 700, quality = 0.75): Promise<string> {
  return (await drawScaled(file, maxWidth)).toDataURL('image/jpeg', quality)
}

/** A JPEG blob at most `maxWidth` wide — for the IndexedDB photo store. */
export async function compressImageToBlob(file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> {
  const canvas = await drawScaled(file, maxWidth)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode image'))), 'image/jpeg', quality),
  )
}
