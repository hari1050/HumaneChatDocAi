import type { NextRequest } from "next/server"
import { checkFeatureLimit, trackFeatureUsage } from "@/middleware/subscription-middleware"
import { GoogleGenAI } from "@google/genai"

// Define proper types for the API
interface SectionContent {
  type: "text" | "subheader"
  text: string
}

interface Section {
  title: string
  content: SectionContent[]
}

// Helper function to send progress updates
function sendProgressUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  update: {
    phase: string
    progress: number
    message: string
    activity: string
  },
) {
  controller.enqueue(
    encoder.encode(
      JSON.stringify({
        type: "progress",
        phase: update.phase,
        progress: update.progress,
        message: update.message,
        activity: update.activity,
      }) + "\n",
    ),
  )
}

export async function GET(req: NextRequest) {
  try {
    // Check if user has reached research query limit
    const limitResponse = await checkFeatureLimit(req, "research_queries")
    if (limitResponse) {
      return limitResponse
    }

    const url = new URL(req.url)
    const query = url.searchParams.get("query")

    if (!query) {
      return new Response(JSON.stringify({ error: "Research query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey })

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Declare intervalId variable outside the interval setup
        let intervalId: NodeJS.Timeout | undefined = undefined;
        
        try {
          // Send an initial progress update
          sendProgressUpdate(controller, encoder, {
            phase: "INITIAL_SEARCH",
            progress: 10,
            message: `Starting research for "${query}"`,
            activity: `Generating search queries for "${query}"`,
          })

          // Small delay for UI to show initial progress
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Send searching update
          sendProgressUpdate(controller, encoder, {
            phase: "SEARCHING",
            progress: 25,
            message: `Searching for information on "${query}"`,
            activity: `Executing search for "${query}"`,
          })

          // Make the request to Gemini API for detailed research
          const geminiPromise = genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `Give me a comprehensive research summary about ${query}. Include all key information organized into multiple sections with headers. For each main point, please include numbered citations like [1], [2], etc. Present the information in a well-structured format with main sections marked by ## headers and subsections with ### headers. DO NOT include a Sources or References section in your response - I will extract the sources separately.` }]
              }
            ],
            config: {
              temperature: 0.1,
              maxOutputTokens: 4000,
              systemInstruction: "You are a research assistant. Provide comprehensive information on the topic with proper numbered citations. Structure your response with main sections using ## headers and subsections using ### headers. For each key fact, include a numbered citation like [1], [2], etc. DO NOT include a Sources or References section in your response - it will be extracted separately from your citations."
            }
          })

          // Search activities array
          const searchActivities = [
            `Found new sources about "${query}"`,
            `Exploring academic papers on "${query}"`,
            `Analyzing recent articles about "${query}"`,
            `Retrieving case studies related to "${query}"`,
            `Searching for expert opinions on "${query}"`,
          ]

          // Send updates every 2 seconds
          let updateCount = 0
          
          // Setup interval with proper typing
          intervalId = setInterval(() => {
            try {
              updateCount++
              if (updateCount > 10) {
                if (intervalId) {
                  clearInterval(intervalId)
                  intervalId = undefined
                }
                return
              }

              // Get a random activity
              const randomActivity = searchActivities[Math.floor(Math.random() * searchActivities.length)]

              sendProgressUpdate(controller, encoder, {
                phase: "SEARCHING",
                progress: 25,
                message: `Continuing search for "${query}"`,
                activity: randomActivity,
              })
            } catch (error) {
              // If controller is closed, clear the interval
              if (intervalId) {
                clearInterval(intervalId)
                intervalId = undefined
              }
            }
          }, 2000)

          // Wait for Gemini API response
          const response = await geminiPromise

          // Stop sending interval updates
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = undefined
          }

          if (!response) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  error: `Gemini API error: Failed to get a response`,
                }) + "\n",
              ),
            )
            controller.close()
            return
          }

          // Send analyzing update
          sendProgressUpdate(controller, encoder, {
            phase: "ANALYZING",
            progress: 50,
            message: "Analyzing search results",
            activity: "Processing information from multiple sources",
          })

          // Get the content
          const content = response.text || ""

          // Small delay to show analyzing state
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // More analyzing updates
          sendProgressUpdate(controller, encoder, {
            phase: "ANALYZING",
            progress: 60,
            message: "Extracting key information",
            activity: "Identifying main themes and insights",
          })

          // Process the content to extract the actual summary (remove thinking section if present)
          let cleanContent = content
          if (content.includes("<Thinking>") && content.includes("</Thinking>")) {
            const thinkEndIndex = content.indexOf("<Thinking></Thinking>") + 8
            cleanContent = content.substring(thinkEndIndex).trim()
          }
          
          // After getting the response, make a second call to get sources
          let sources: string[] = [];
          
          try {
            // Make a follow-up call to get just the sources
            const sourcesPromise = genAI.models.generateContent({
              model: "gemini-2.0-flash",
              contents: [
                {
                  role: "user",
                  parts: [{ text: `Based on the research about "${query}", provide a numbered list of up to 15 sources with proper URLs. Only include the list of sources, nothing else. Format each source as a number followed by a URL.` }]
                }
              ],
              config: {
                temperature: 0.1,
                maxOutputTokens: 1000
              }
            });
            
            const sourcesResponse = await sourcesPromise;
            if (sourcesResponse && sourcesResponse.text) {
              // Extract URLs from the sources response
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              let match;
              const foundUrls: string[] = [];
              
              while ((match = urlRegex.exec(sourcesResponse.text)) !== null) {
                // Clean the URL - remove trailing punctuation
                let url = match[1];
                url = url.replace(/[.,;)]+$/, "");
                
                if (!foundUrls.includes(url)) {
                  foundUrls.push(url);
                }
              }
              
              sources = foundUrls.slice(0, 15);
            }
            
            // If we didn't find any sources, add some default ones based on the query
            if (sources.length === 0) {
              // Just for demonstration, add some sample sources
              sources = [
                `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
                `https://www.britannica.com/search?query=${encodeURIComponent(query)}`,
                `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
                `https://www.researchgate.net/search/publication?q=${encodeURIComponent(query)}`,
                `https://www.sciencedirect.com/search?qs=${encodeURIComponent(query)}`
              ];
            }
          } catch (error) {
            console.warn("Error getting sources:", error);
            // Provide fallback sources
            sources = [
              `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
              `https://www.britannica.com/search?query=${encodeURIComponent(query)}`,
              `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
              `https://www.researchgate.net/search/publication?q=${encodeURIComponent(query)}`,
              `https://www.sciencedirect.com/search?qs=${encodeURIComponent(query)}`
            ];
          }

          // Small delay
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Send synthesizing update
          sendProgressUpdate(controller, encoder, {
            phase: "SYNTHESIZING",
            progress: 75,
            message: "Synthesizing information",
            activity: "Organizing findings into a structured format",
          })

          // Process citations in the content - extract [1], [2], etc.
          const citationPattern = /\[(\d+)\]/g
          const citationsInText = Array.from(cleanContent.matchAll(citationPattern), (match) => match[0])

                    // Clean up the content - remove any Source/Reference sections if they still exist
          const sourceSectionRegex = /(?:^|\n)(?:##?\s*(?:Sources|References)|(?:Sources|References))\s*(?::|$)[\s\S]*$/i;
          const sourceSectionMatch = cleanContent.match(sourceSectionRegex);
          if (sourceSectionMatch) {
            cleanContent = cleanContent.substring(0, cleanContent.indexOf(sourceSectionMatch[0])).trim();
          }

          // Create a mapping of citation numbers to actual URLs 
          const citationMap: Record<string, string> = {}
          
          // Use the citation numbers from the actual text as keys if possible
          const citationNumbers = Array.from(cleanContent.matchAll(/\[(\d+)\]/g)).map(match => parseInt(match[1]));
          let citations: string[] = []

          // Assign URLs to citation numbers that appear in the text
          if (citationNumbers.length > 0) {
            // Find all unique citation numbers
            const uniqueCitations = Array.from(new Set(citationNumbers)).sort((a, b) => a - b);
            
            // Assign URLs to each citation number that appears in the text
            uniqueCitations.forEach((num, index) => {
              if (index < citations.length) {
                citationMap[num] = citations[index];
              }
            });
          } else {
            // If no citation numbers in text, assign sequentially
            citations.forEach((url, index) => {
              citationMap[index + 1] = url;
            });
          }
          citations.forEach((url: string, index: number) => {
            citationMap[index + 1] = url
          })

          // Another synthesizing update
          await new Promise((resolve) => setTimeout(resolve, 1000))
          sendProgressUpdate(controller, encoder, {
            phase: "SYNTHESIZING",
            progress: 85,
            message: "Preparing final document",
            activity: "Finalizing citations and formatting",
          })

          // Extract sections based on markdown headers
          const sections: Section[] = []
          const lines = cleanContent.split("\n")
          let currentSection: Section = { title: "Summary", content: [] }

          for (const line of lines) {
            if (line.startsWith("###")) {
              // If we find a subheader (###), add it to the current section
              const title = line.replace(/^###\s+/, "")
              currentSection.content.push({ type: "subheader", text: title })
            } else if (line.startsWith("##")) {
              // If we find a new section (##), save the current one and start a new section
              if (currentSection.content.length > 0) {
                sections.push(currentSection)
              }
              const title = line.replace(/^##\s+/, "")
              currentSection = { title, content: [] }
            } else if (line.trim()) {
              // Add non-empty lines to the current section
              currentSection.content.push({ type: "text", text: line })
            }
          }

          // Add the last section if it has content
          if (currentSection.content.length > 0) {
            sections.push(currentSection)
          }

          // Final delay
          await new Promise((resolve) => setTimeout(resolve, 800))

          // Send completion update
          sendProgressUpdate(controller, encoder, {
            phase: "COMPLETE",
            progress: 100,
            message: "Research complete",
            activity: `Completed research on "${query}" with ${citations.length} sources`,
          })

          // Small delay before final result
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Mock usage data similar to what Perplexity would provide
          const usage = {
            prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
            completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: (response.usageMetadata?.promptTokenCount || 0) + (response.usageMetadata?.candidatesTokenCount || 0)
          }

          // Finally send the full result
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "result",
                content: cleanContent,
                citations: sources,
                citationMap,
                citationsInText,
                sections,
                usage: usage,
              }) + "\n",
            ),
          )

          // Track research query usage after successful completion
          await trackFeatureUsage(req, "research_queries")

          controller.close()
        } catch (error) {
          // Make sure to clear the interval if there's an error
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = undefined
          }
          
          console.error("Error in research API:", error)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "An error occurred while processing your request",
              }) + "\n",
            ),
          )
          controller.close()
        }
      },
    })

    // Return the streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in research API:", error)
    return new Response(JSON.stringify({ error: "An error occurred while processing your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}