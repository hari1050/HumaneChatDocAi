import { type NextRequest, NextResponse } from "next/server"
import { extractUrlContent } from "@/utils/urlContentExtractor"

// Define the structure of a chat message
export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// Define the structure of the chat request
export interface ChatRequest {
  messages: ChatMessage[]
  documentContext?: {
    title: string
    content: string
  }
  webSources?: { url: string; content?: string }[]
  documentSources?: {
    id: string
    title: string
    content: string
  }[]
}

export async function POST(req: NextRequest) {
  try {
    // Get the Perplexity API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key is not configured" }, { status: 500 })
    }

    // Parse the request body
    const body = (await req.json()) as ChatRequest
    const { messages, documentContext, webSources, documentSources } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 })
    }

    // Build the system prompt with context
    let systemPrompt =
      "You are an AI writing assistant integrated into a document editor called Humane. Your primary role is to help users with their writing tasks. NEVER respond with generic information about greetings or words. Instead, always:\n\n1. Acknowledge that you're a writing assistant in the Humane editor\n2. Offer specific help related to the document content when available\n3. Suggest ways you can assist with writing, editing, brainstorming, or research\n4. Keep responses focused on helping improve the document\n\nIf a user sends a simple greeting like 'hi' or 'hello', respond by introducing yourself as the Humane AI assistant and asking how you can help with their document."

    // Add document context if available
    if (documentContext) {
      // Check if documentContext is a string (for backward compatibility) or an object
      const docTitle =
        typeof documentContext === "object" && documentContext.title ? documentContext.title : "Current Document"
      const docContent =
        typeof documentContext === "object" && documentContext.content ? documentContext.content : documentContext

      systemPrompt += `CURRENT DOCUMENT:
                      Title: ${docTitle}
                      Content: ${docContent}
                      When responding, reference this document content when relevant.`
    }

    // Add other document sources if available
    if (documentSources && documentSources.length > 0) {
      systemPrompt += "\n\nADDITIONAL DOCUMENTS:"
      documentSources.forEach((doc) => {
        systemPrompt += `\n\nDocument: ${doc.title}\n${doc.content}`
      })
    }

    // Add web sources content if available
    if (webSources && webSources.length > 0) {
      systemPrompt += "\n\nWEB SOURCES:"

      for (const source of webSources) {
        // If content is provided, use it
        if (source.content) {
          systemPrompt += `\n\nSource (${source.url}):\n${source.content}`
          continue
        }

        // Otherwise, try to fetch content using our extractor
        try {
          console.log(`Fetching content for ${source.url}`)
          const content = await extractUrlContent(source.url)

          if (content && content.length > 0) {
            // Summarize very long content to avoid token limits
            let processedContent = content
            if (content.length > 8000) {
              // Use Perplexity to summarize very long content
              const summaryResponse = await fetch("https://api.perplexity.ai/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: "sonar-pro",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a content summarizer. Create a detailed summary that captures the key information from the text.",
                    },
                    {
                      role: "user",
                      content: `Summarize this content in detail:\n\n${content.substring(0, 12000)}`,
                    },
                  ],
                  temperature: 0.1,
                  max_tokens: 1000,
                }),
              })

              if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json()
                processedContent = summaryData.choices[0].message.content
                systemPrompt += `\n\nSource (${source.url}) - Summarized:\n${processedContent}`
              } else {
                // If summarization fails, use a truncated version
                processedContent = content.substring(0, 6000) + "... [content truncated for length]"
                systemPrompt += `\n\nSource (${source.url}):\n${processedContent}`
              }
            } else {
              systemPrompt += `\n\nSource (${source.url}):\n${processedContent}`
            }
          } else {
            systemPrompt += `\n\nSource (${source.url}): [No meaningful content extracted]`
          }
        } catch (error) {
          console.error(`Error extracting content for ${source.url}:`, error)

          // Fallback to Perplexity Sonar as a last resort
          try {
            console.log(`Falling back to Perplexity Sonar for ${source.url}`)
            const response = await fetch("https://api.perplexity.ai/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful web scraper. Extract and summarize the main content from the provided URL.",
                  },
                  {
                    role: "user",
                    content: `Please extract and summarize the main content from this URL: ${source.url}`,
                  },
                ],
                temperature: 0.1,
                max_tokens: 1000,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              const content = data.choices[0].message.content
              systemPrompt += `\n\nSource (${source.url}):\n${content}`
            } else {
              systemPrompt += `\n\nSource (${source.url}): [Failed to fetch content]`
            }
          } catch (fallbackError) {
            console.error(`Error in Perplexity fallback for ${source.url}:`, fallbackError)
            systemPrompt += `\n\nSource (${source.url}): [Failed to fetch content]`
          }
        }
      }
    }

    // Prepare the messages array for the API
    const apiMessages = [{ role: "system", content: systemPrompt }, ...messages]

    // Make the request to Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Perplexity API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      message: data.choices[0].message.content,
      webSourcesProcessed: webSources ? webSources.length : 0,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}

