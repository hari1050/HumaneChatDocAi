"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, XCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LimitWarning } from "@/components/subscription/limit-warning"

type WebSource = {
  url: string
  title?: string
  isLoading?: boolean
  error?: string
}

interface ResearchResult {
  content: string
  citations: string[]
  citationMap: Record<string, string>
  citationsInText: string[]
  sections: {
    title: string
    content: Array<{ type: string; text: string }>
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    citation_tokens?: number
    num_search_queries?: number
    reasoning_tokens?: number
  }
}

interface ResearchPanelProps {
  webSources: WebSource[]
  setWebSources: React.Dispatch<React.SetStateAction<WebSource[]>>
}

// Research progress phases
const PHASES = {
  INITIAL_SEARCH: {
    progress: 10,
    title: "Initiating research",
  },
  SEARCHING: {
    progress: 25,
    title: "Searching for relevant information",
  },
  ANALYZING: {
    progress: 50,
    title: "Analyzing findings",
  },
  SYNTHESIZING: {
    progress: 75,
    title: "Preparing final analysis",
  },
  COMPLETE: {
    progress: 100,
    title: "Research complete",
  },
}

export function ResearchPanel({ webSources, setWebSources }: ResearchPanelProps) {
  const { toast } = useToast()
  const [researchQuery, setResearchQuery] = useState("")
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [isResearching, setIsResearching] = useState(false)
  const [researchError, setResearchError] = useState("")

  // Subscription limit states
  const [webSourceLimitReached, setWebSourceLimitReached] = useState(false)
  const [researchLimitReached, setResearchLimitReached] = useState(false)

  // Streaming research progress state
  const [currentPhase, setCurrentPhase] = useState<keyof typeof PHASES | null>(null)
  const [progressValue, setProgressValue] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [activities, setActivities] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handle research query
  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!researchQuery.trim()) return

    // Check if we've reached the research limit
    try {
      const limitResponse = await fetch("/api/subscription/check-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feature: "research_queries", increment: true }),
      })

      if (!limitResponse.ok) {
        const error = await limitResponse.json()

        // Check if this is a limit reached error
        if (error.limitReached) {
          setResearchLimitReached(true)
          throw new Error(`Feature limit reached: ${error.message}`)
        }

        throw new Error(error.error || "Failed to check limit")
      }
    } catch (error) {
      console.error("Error checking research limit:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check research limit",
        variant: "destructive",
      })
      return
    }

    // Reset states
    setIsResearching(true)
    setResearchResult(null)
    setResearchError("")
    setCurrentPhase(null)
    setProgressValue(0)
    setProgressMessage("")
    setActivities([])

    // Create a new AbortController for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // Create the URL with the query
      const apiUrl = `/api/web-search?query=${encodeURIComponent(researchQuery)}`

      // Make the fetch request with streaming response
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to perform research")
      }

      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response stream")
      }

      let buffer = ""

      // Function to process streaming data
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // End of stream
          break
        }

        // Decode the chunk and add to buffer
        buffer += new TextDecoder().decode(value)

        // Process complete lines in the buffer
        while (buffer.includes("\n")) {
          const lineEndIndex = buffer.indexOf("\n")
          const line = buffer.substring(0, lineEndIndex).trim()
          buffer = buffer.substring(lineEndIndex + 1)

          if (line) {
            try {
              const data = JSON.parse(line)

              // Handle different message types
              if (data.type === "progress") {
                // Update progress state
                const phase = data.phase as keyof typeof PHASES
                setCurrentPhase(phase)
                setProgressValue(data.progress)
                setProgressMessage(data.message)

                if (data.activity) {
                  // Add new activity at the beginning of the list
                  setActivities((prev) => [data.activity, ...prev])
                }
              } else if (data.type === "result") {
                // Got the final result
                setResearchResult(data)
                setIsResearching(false)
              } else if (data.type === "error") {
                throw new Error(data.error || "Research error")
              }
            } catch (parseError) {
              console.warn("Error parsing streaming response line:", parseError, line)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error performing research:", error)

      // Ignore abort errors
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Research request was aborted")
        return
      }

      setResearchError(error instanceof Error ? error.message : "Failed to perform research")
      setIsResearching(false)
      setCurrentPhase(null)

      toast({
        title: "Research Error",
        description: error instanceof Error ? error.message : "Failed to perform detailed research",
        variant: "destructive",
      })
    }
  }

  // Handle adding a source
  const handleAddSource = async (url: string) => {
    if (webSources.some((source) => source.url === url)) {
      toast({
        title: "Already Added",
        description: "This URL is already in your web sources",
      })
      return
    }

    try {
      // Check if adding another web source would exceed the limit
      const response = await fetch("/api/subscription/check-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feature: "web_sources", currentCount: webSources.length }),
      })

      if (!response.ok) {
        const error = await response.json()

        // Check if this is a limit reached error
        if (error.limitReached) {
          setWebSourceLimitReached(true)
          throw new Error(`Feature limit reached: ${error.message}`)
        }

        throw new Error(error.error || "Failed to check limit")
      }

      setWebSources((prev) => [...prev, { url }])

      toast({
        title: "Source Added",
        description: "The web source has been added to your context",
      })
    } catch (error) {
      console.error("Error adding web source:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add web source",
        variant: "destructive",
      })
    }
  }

  // Format citation reference in text
  const formatCitationText = (text: string) => {
    if (!researchResult) return text

    // Replace citation markers [1], [2], etc. with linked citations
    return text.replace(/\[(\d+)\]/g, (match, number) => {
      const url = researchResult.citationMap[number]
      if (url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-400 hover:underline">[${number}]</a>`
      }
      return match
    })
  }

  // Generate activity items with appropriate status indicators
  const renderActivities = () => {
    return activities.map((activity, index) => (
      <div key={index} className="flex items-start gap-2 text-sm">
        {index > 0 ? (
          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-blue-400 mt-0.5" />
        )}
        <span>{activity}</span>
      </div>
    ))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Subscription limit warnings */}
      {webSourceLimitReached && (
        <div className="p-4">
          <LimitWarning feature="web_sources" onClose={() => setWebSourceLimitReached(false)} />
        </div>
      )}

      {researchLimitReached && (
        <div className="p-4">
          <LimitWarning feature="research_queries" onClose={() => setResearchLimitReached(false)} />
        </div>
      )}

      {/* Result section - appears above the search input */}
      <div className="flex-1 overflow-y-auto p-4">
        {isResearching ? (
          <div className="space-y-4">
            <Card className="border-[#2a2a2a] bg-[#0a0a0a]">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Research in Progress...</span>
                  <Badge variant="outline" className="bg-[#1a1a1a]">
                    {progressValue}% Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressValue} className="h-2 bg-[#1a1a1a]" />

                <div className="mt-4">
                  <h3 className="text-base font-medium mb-2">
                    {currentPhase && PHASES[currentPhase].title}
                    {currentPhase === "SEARCHING" && ` for "${researchQuery}"`}
                  </h3>

                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Activity Log</span>
                      <span>{activities.length} activities</span>
                    </div>
                    <div className="space-y-2 border border-[#1a1a1a] rounded-md p-3 bg-[#0d0d0d]">
                      {renderActivities()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : researchError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-8 w-8 text-red-500 mb-2" />
            <h3 className="font-medium mb-1">Research Error</h3>
            <p className="text-sm text-muted-foreground">{researchError}</p>
          </div>
        ) : researchResult ? (
          <div className="space-y-6">
            {/* Stats */}
            {researchResult.usage && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs bg-[#1a1a1a]">
                  Search Queries: {researchResult.usage.num_search_queries || 0}
                </Badge>
                <Badge variant="outline" className="text-xs bg-[#1a1a1a]">
                  Sources: {researchResult.citations?.length || 0}
                </Badge>
              </div>
            )}

            {/* Research content */}
            <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{researchQuery}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2">
                  {researchResult.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-6">
                      {section.title !== "Summary" && (
                        <h2 className="text-lg font-semibold border-b border-[#2a2a2a] pb-1 mb-3">{section.title}</h2>
                      )}

                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="mb-2">
                          {item.type === "subheader" ? (
                            <h3 className="text-base font-medium mt-4 mb-2">{item.text}</h3>
                          ) : (
                            <p
                              className="text-sm mb-3 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatCitationText(item.text) }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Citations */}
            {researchResult.citations && researchResult.citations.length > 0 && (
              <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
                <CardHeader className="py-2">
                  <CardTitle className="text-base">Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1.5">
                    {researchResult.citations.map((citation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-1.5 text-muted-foreground">[{index + 1}]</span>
                        <a
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline truncate flex-1"
                        >
                          {citation}
                        </a>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 ml-2"
                          onClick={() => handleAddSource(citation)}
                        >
                          Add Source
                        </Button> */}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Research Assistant</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a topic below to receive comprehensive research with citations from authoritative sources.
            </p>
          </div>
        )}
      </div>

      {/* Search input - fixed at the bottom */}
      <div className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
        <form onSubmit={handleResearch} className="flex gap-2">
          <Input
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="Research a topic (e.g., 'GTM strategies for startups')"
            className="h-10 bg-[#1a1a1a] border-none"
            disabled={isResearching || researchLimitReached}
          />
          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 bg-white text-black hover:bg-white/90"
            disabled={!researchQuery.trim() || isResearching || researchLimitReached}
          >
            {isResearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Research
          </Button>
        </form>
      </div>
    </div>
  )
}
