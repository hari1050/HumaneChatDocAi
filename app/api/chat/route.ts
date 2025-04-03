import type { NextRequest } from "next/server"
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
      return new Response(JSON.stringify({ error: "Perplexity API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse the request body
    const body = (await req.json()) as ChatRequest
    const { messages, documentContext, webSources, documentSources } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Build the system prompt with context
    let systemPrompt =
      "You are an AI writing assistant integrated into a document editor called WriteX. Your primary role is to help users with their writing tasks. NEVER respond with generic information about greetings or words. Instead, always:\n\n" +
      "1. Acknowledge that you're a writing assistant in the WriteX editor\n" +
      "2. Offer specific help related to the document content when available\n" +
      "3. Suggest ways you can assist with writing, editing, brainstorming, or research\n" +
      "4. Keep responses focused on helping improve the document\n\n" +
      "If a user sends a simple greeting like 'hi' or 'hello', respond by introducing yourself as the WriteX AI assistant and asking how you can help with their document."

    // Add document context if available
    if (documentContext) {
      // Check if documentContext is a string (for backward compatibility) or an object
      const docTitle =
        typeof documentContext === "object" && documentContext.title ? documentContext.title : "Current Document"
      const docContent =
        typeof documentContext === "object" && documentContext.content ? documentContext.content : documentContext

      systemPrompt += `\n\nCURRENT DOCUMENT:\nTitle: ${docTitle}\nContent: ${docContent}\n\nWhen responding, reference this document content when relevant.`
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

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Make the request to Perplexity API with streaming enabled
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
              stream: true, // Enable streaming
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            controller.enqueue(encoder.encode(JSON.stringify({ error: `Perplexity API error: ${errorText}` })))
            controller.close()
            return
          }

          if (!response.body) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "No response body" })))
            controller.close()
            return
          }

          const reader = response.body.getReader()
          let fullText = ""
          let buffer = "" // Buffer to accumulate partial chunks

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Decode the chunk and add it to our buffer
            const chunk = new TextDecoder().decode(value)
            buffer += chunk

            // Process complete messages in the buffer
            let processedBuffer = ""
            const lines = buffer.split("\n")

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]

              // If this isn't the last line, it's a complete line
              if (i < lines.length - 1) {
                if (line.startsWith("data: ")) {
                  try {
                    const jsonStr = line.slice(6).trim() // Remove 'data: ' prefix

                    // Check for [DONE] message
                    if (jsonStr === "[DONE]") continue

                    const json = JSON.parse(jsonStr)

                    if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                      const textChunk = json.choices[0].delta.content
                      fullText += textChunk

                      // Send the chunk to the client - just send the new chunk, not the full text
                      controller.enqueue(
                        encoder.encode(
                          JSON.stringify({
                            chunk: textChunk,
                          }),
                        ),
                      )
                    }
                  } catch (e) {
                    console.error("Error parsing JSON from stream:", e, line)
                    // Continue processing other lines even if one fails
                  }
                }
              } else {
                // This is the last line, which might be incomplete
                processedBuffer = line
              }
            }

            // Update buffer with any unprocessed content
            buffer = processedBuffer
          }

          // Send a final message with the complete text
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                fullText,
                webSourcesProcessed: webSources ? webSources.length : 0,
              }),
            ),
          )
          controller.close()
        } catch (error) {
          console.error("Error in streaming response:", error)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: "An error occurred while processing your request",
                errorDetails: error instanceof Error ? error.message : String(error),
              }),
            ),
          )
          controller.close()
        }
      },
    })

    // Return the streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "An error occurred while processing your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

