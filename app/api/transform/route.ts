import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 })
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey })

    // Parse the request body
    const body = await req.json()
    const { text, prompt } = body

    if (!text || !prompt) {
      return NextResponse.json({ error: "Text and prompt are required" }, { status: 400 })
    }

    // Build the system prompt
    const systemPrompt = `You are an AI text transformation assistant. Your task is to transform the provided text according to the user's instructions. 
   
Follow these guidelines:
1. Only return the transformed text, with no additional explanations or comments
2. Maintain the original meaning unless explicitly asked to change it
3. Preserve the original formatting (paragraphs, bullet points, etc.) unless asked to change it
4. If the transformation request is unclear, do your best interpretation
5. Keep the length similar to the original unless specifically asked to make it longer or shorter`

    // Make the request to Gemini API
    const model = genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Transform the following text: "${text}"\n\nInstructions: ${prompt}` }]
        }
      ],
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        systemInstruction: systemPrompt
      }
    })

    // Get the response
    const response = await model
    
    if (!response) {
      return NextResponse.json({ error: "Gemini API failed to provide a response" }, { status: 500 })
    }

    // Extract the transformed text
    const transformedText = response.text

    return NextResponse.json({ transformedText })
  } catch (error) {
    console.error("Error in transform API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
    
    // If the error has more details, you can return them like this:
    // return NextResponse.json({ 
    //   error: "An error occurred while processing your request",
    //   details: error instanceof Error ? error.message : String(error)
    // }, { status: 500 })
  }
}