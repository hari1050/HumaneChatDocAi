import { type NextRequest, NextResponse } from "next/server"

// Define proper types for the API
interface SectionContent {
  type: 'text' | 'subheader';
  text: string;
}

interface Section {
  title: string;
  content: SectionContent[];
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Research query is required" }, { status: 400 })
    }

    // Get the Perplexity API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key is not configured" }, { status: 500 })
    }

    // Make the request to Perplexity API for detailed research
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
            content: "You are a research assistant. Provide comprehensive information on the topic with proper citations.",
          },
          {
            role: "user",
            content: `Give me a summary about ${query}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Perplexity API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ""
    
    // Process the content to extract the actual summary (remove thinking section if present)
    let cleanContent = content
    if (content.includes("<think>") && content.includes("</think>")) {
      const thinkEndIndex = content.indexOf("</think>") + 8
      cleanContent = content.substring(thinkEndIndex).trim()
    }

    // Process citations in the content - extract [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g
    const citationsInText = [...cleanContent.matchAll(citationPattern)].map(match => match[1])
    
    // Create a mapping of citation numbers to actual URLs
    const citationMap: Record<number, string> = {}
    if (data.citations && Array.isArray(data.citations)) {
      data.citations.forEach((url: string, index: number) => {
        citationMap[index + 1] = url
      })
    }

    // Extract sections based on markdown headers
    const sections: Section[] = []
    const lines = cleanContent.split('\n')
    let currentSection: Section = { title: 'Summary', content: [] }
    
    for (const line of lines) {
      if (line.startsWith('###')) {
        // If we find a subheader (###), add it to the current section
        const title = line.replace(/^###\s+/, '')
        currentSection.content.push({ type: 'subheader', text: title })
      } else if (line.startsWith('##')) {
        // If we find a new section (##), save the current one and start a new section
        if (currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        const title = line.replace(/^##\s+/, '')
        currentSection = { title, content: [] }
      } else if (line.trim()) {
        // Add non-empty lines to the current section
        currentSection.content.push({ type: 'text', text: line })
      }
    }
    
    // Add the last section if it has content
    if (currentSection.content.length > 0) {
      sections.push(currentSection)
    }

    return NextResponse.json({
      content: cleanContent,
      citations: data.citations || [],
      citationMap,
      citationsInText,
      sections,
      usage: data.usage || {},
    })
  } catch (error) {
    console.error("Error in research API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}