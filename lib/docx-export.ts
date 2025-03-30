/**
 * Simple utility to export HTML content as a DOCX file in the browser
 */

// Function to convert HTML to a Word-compatible format
export function htmlToDocx(htmlContent: string, fileName: string): Blob {
    // Create a complete HTML document with Word-specific XML
    const wordCompatibleHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${fileName}</title>
        <style>
          /* Basic styling for Word */
          body { font-family: 'Calibri', sans-serif; font-size: 11pt; }
          h1 { font-size: 16pt; font-weight: bold; }
          h2 { font-size: 14pt; font-weight: bold; }
          h3 { font-size: 12pt; font-weight: bold; }
          
          /* Word-specific styling */
          @page { size: 8.5in 11in; margin: 1in; }
          @page Section1 { margin: 1in; }
          div.Section1 { page: Section1; }
        </style>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
      </head>
      <body>
        <div class="Section1">
          ${htmlContent}
        </div>
      </body>
      </html>
    `
  
    // Create a blob with the Word-compatible HTML
    const blob = new Blob([wordCompatibleHtml], {
      type: "application/vnd.ms-word;charset=utf-8",
    })
  
    return blob
  }
  
  // Function to download a blob as a file
  export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Main function to export HTML as DOCX
  export function exportHtmlAsDocx(htmlContent: string, fileName: string): void {
    const docxBlob = htmlToDocx(htmlContent, fileName)
    downloadBlob(docxBlob, fileName)
  }
  
  