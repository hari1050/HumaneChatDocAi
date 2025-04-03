import { type NextRequest } from "next/server"

// Define proper types for the API
interface SectionContent {
  type: 'text' | 'subheader';
  text: string;
}

interface Section {
  title: string;
  content: SectionContent[];
}

// Helper function to send progress updates
function sendProgressUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  update: {
    phase: string;
    progress: number;
    message: string;
    activity: string;
  }
) {
  controller.enqueue(encoder.encode(JSON.stringify({
    type: "progress",
    phase: update.phase,
    progress: update.progress,
    message: update.message,
    activity: update.activity
  }) + "\n"))
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get("query")

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Research query is required" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get the Perplexity API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key is not configured" }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send an initial progress update
          sendProgressUpdate(controller, encoder, {
            phase: "INITIAL_SEARCH",
            progress: 10,
            message: `Starting research for "${query}"`,
            activity: `Generating search queries for "${query}"`
          })
          
          // Small delay for UI to show initial progress
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Send searching update
          sendProgressUpdate(controller, encoder, {
            phase: "SEARCHING",
            progress: 25,
            message: `Searching for information on "${query}"`,
            activity: `Executing search for "${query}"`
          })
          
          // Make the request to Perplexity API for detailed research
          const perplexityPromise = fetch("https://api.perplexity.ai/chat/completions", {
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
          
          // Search activities array
          const searchActivities = [
            `Found new sources about "${query}"`,
            `Exploring academic papers on "${query}"`,
            `Analyzing recent articles about "${query}"`,
            `Retrieving case studies related to "${query}"`,
            `Searching for expert opinions on "${query}"`
          ]
          
          // Send updates every 2 seconds
          let updateCount = 0
          const intervalId = setInterval(() => {
            updateCount++
            if (updateCount > 10) {
              clearInterval(intervalId)
              return
            }
            
            // Get a random activity
            const randomActivity = searchActivities[Math.floor(Math.random() * searchActivities.length)]
            
            sendProgressUpdate(controller, encoder, {
              phase: "SEARCHING",
              progress: 25,
              message: `Continuing search for "${query}"`,
              activity: randomActivity
            })
          }, 2000)
          
          // Wait for Perplexity API response
          const response = await perplexityPromise
          
          // Stop sending interval updates
          clearInterval(intervalId)
          
          if (!response.ok) {
            const errorText = await response.text()
            controller.enqueue(
              encoder.encode(JSON.stringify({
                type: "error",
                error: `Perplexity API error: ${errorText}`
              }) + "\n")
            )
            controller.close()
            return
          }

          // Send analyzing update
          sendProgressUpdate(controller, encoder, {
            phase: "ANALYZING",
            progress: 50,
            message: "Analyzing search results",
            activity: "Processing information from multiple sources"
          })
          
          // Parse the API response
          const data = await response.json()
          const content = data.choices[0]?.message?.content || ""
          
          // Small delay to show analyzing state
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // More analyzing updates
          sendProgressUpdate(controller, encoder, {
            phase: "ANALYZING",
            progress: 60,
            message: "Extracting key information",
            activity: "Identifying main themes and insights"
          })
          
          // Process the content to extract the actual summary (remove thinking section if present)
          let cleanContent = content
          if (content.includes("<think>") && content.includes("</think>")) {
            const thinkEndIndex = content.indexOf("</think>") + 8
            cleanContent = content.substring(thinkEndIndex).trim()
          }
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Send synthesizing update
          sendProgressUpdate(controller, encoder, {
            phase: "SYNTHESIZING",
            progress: 75,
            message: "Synthesizing information",
            activity: "Organizing findings into a structured format"
          })
          
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
          
          // Another synthesizing update
          await new Promise(resolve => setTimeout(resolve, 1000))
          sendProgressUpdate(controller, encoder, {
            phase: "SYNTHESIZING",
            progress: 85,
            message: "Preparing final document",
            activity: "Finalizing citations and formatting"
          })

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
          
          // Final delay
          await new Promise(resolve => setTimeout(resolve, 800))

          // Send completion update
          sendProgressUpdate(controller, encoder, {
            phase: "COMPLETE",
            progress: 100,
            message: "Research complete",
            activity: `Completed research on "${query}" with ${data.citations?.length || 0} sources`
          })
          
          // Small delay before final result
          await new Promise(resolve => setTimeout(resolve, 500))

          // Finally send the full result
          controller.enqueue(encoder.encode(JSON.stringify({
            type: "result",
            content: cleanContent,
            citations: data.citations || [],
            citationMap,
            citationsInText,
            sections,
            usage: data.usage || {},
          }) + "\n"))

          controller.close()
        } catch (error) {
          console.error("Error in research API:", error)
          controller.enqueue(
            encoder.encode(JSON.stringify({
              type: "error",
              error: "An error occurred while processing your request"
            }) + "\n")
          )
          controller.close()
        }
      }
    })

    // Return the streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in research API:", error)
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}