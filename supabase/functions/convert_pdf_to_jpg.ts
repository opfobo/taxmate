// supabase/functions/convert_pdf_to_jpg.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.4'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'

serve(async (req) => {
  const { name, bucketId } = await req.json()
  if (!name || !bucketId) {
    return new Response("Missing name or bucket", { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // 📥 Download PDF file
  const { data: fileData, error } = await supabase
    .storage
    .from(bucketId)
    .download(name)

  if (error || !fileData) {
    return new Response("Failed to download PDF", { status: 500 })
  }

  // 📦 Extrahiere erstes Bild aus PDF als PNG (via ImageScript)
  try {
    const pdfBytes = await fileData.arrayBuffer()
    const image = await Image.decode(pdfBytes)
    const jpg = await image.encodeJPEG(90)

    const previewPath = name.replace(/\.pdf$/, "_preview.jpg")

    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(previewPath, jpg, {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (uploadError) {
      return new Response(`Upload error: ${uploadError.message}`, { status: 500 })
    }

    return new Response("Preview created", { status: 200 })
  } catch (err) {
    return new Response(`Image conversion failed: ${err}`, { status: 500 })
  }
})
