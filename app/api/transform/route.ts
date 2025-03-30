import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Get the Perplexity API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key is not configured" }, { status: 500 })
    }

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

    // Make the request to Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Transform the following text: "${text}"\n\nInstructions: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Perplexity API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    const transformedText = data.choices[0].message.content

    return NextResponse.json({ transformedText })
  } catch (error) {
    console.error("Error in transform API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
