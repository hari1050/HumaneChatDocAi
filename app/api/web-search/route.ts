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
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Make the request to Perplexity API for web search
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [
          {
            role: "system",
            content:
              "You are a search engine. For the given query, return 5 relevant search results in JSON format. Each result should have a title, url, and snippet. Format your response as a valid JSON array of objects with these fields.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Perplexity API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()

    try {
      // Try to parse the response as JSON
      const content = data.choices[0].message.content
      const jsonStartIndex = content.indexOf("[")
      const jsonEndIndex = content.lastIndexOf("]") + 1

      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonStr = content.substring(jsonStartIndex, jsonEndIndex)
        const results = JSON.parse(jsonStr)
        return NextResponse.json({ results })
      } else {
        // If we can't find JSON brackets, return an error
        return NextResponse.json(
          {
            error: "Could not parse search results",
            rawContent: content,
          },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("Error parsing search results:", error)
      return NextResponse.json(
        {
          error: "Failed to parse search results",
          rawContent: data.choices[0].message.content,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in web search API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}

