import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    console.log("Test PDF endpoint called")
    
    // Try to import pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist")
    console.log("PDF.js imported, version:", pdfjsLib.version)
    
    return Response.json({ 
      ok: true, 
      version: pdfjsLib.version,
      message: "PDF.js import successful" 
    })
  } catch (e: any) {
    console.error("PDF.js import failed:", e)
    return Response.json({ 
      ok: false, 
      error: e.message 
    }, { status: 500 })
  }
}
