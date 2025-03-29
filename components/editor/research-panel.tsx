"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, ExternalLink, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

export function ResearchPanel({ webSources, setWebSources }: ResearchPanelProps) {
  const { toast } = useToast()
  const [researchQuery, setResearchQuery] = useState("")
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [isResearching, setIsResearching] = useState(false)
  const [researchError, setResearchError] = useState("")

  // Handle research query
  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!researchQuery.trim()) return

    setIsResearching(true)
    setResearchResult(null)
    setResearchError("")

    try {
      const response = await fetch(`/api/web-search?query=${encodeURIComponent(researchQuery)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to perform research")
      }

      const data = await response.json()
      setResearchResult(data)
    } catch (error) {
      console.error("Error performing research:", error)
      setResearchError(error instanceof Error ? error.message : "Failed to perform research")
      toast({
        title: "Research Error",
        description: error instanceof Error ? error.message : "Failed to perform detailed research",
        variant: "destructive",
      })
    } finally {
      setIsResearching(false)
    }
  }

  // Handle adding a source
  const handleAddSource = (url: string) => {
    if (webSources.some((source) => source.url === url)) {
      toast({
        title: "Already Added",
        description: "This URL is already in your web sources",
      })
      return
    }

    setWebSources((prev) => [...prev, { url }])

    toast({
      title: "Source Added",
      description: "The web source has been added to your context",
    })
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Result section - appears above the search input */}
      <div className="flex-1 overflow-y-auto p-4">
        {isResearching ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Researching "{researchQuery}", this may take a moment...</span>
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
                        <h2 className="text-lg font-semibold border-b border-[#2a2a2a] pb-1 mb-3">
                          {section.title}
                        </h2>
                      )}
                      
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="mb-2">
                          {item.type === 'subheader' ? (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 ml-2"
                          onClick={() => handleAddSource(citation)}
                        >
                          Add Source
                        </Button>
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
            placeholder="Research a topic (e.g., 'Lionel Messi')"
            className="h-10 bg-[#1a1a1a] border-none"
            disabled={isResearching}
          />
          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 bg-white text-black hover:bg-white/90"
            disabled={!researchQuery.trim() || isResearching}
          >
            {isResearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Research
          </Button>
        </form>
      </div>
    </div>
  )
}