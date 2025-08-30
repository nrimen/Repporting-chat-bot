import React, { useEffect, useState, useRef } from 'react'

export default function LogStream() {
  const [logs, setLogs] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchLogs() {
      try {
        const response = await fetch('http://dilly-server:8001/logs', {
          signal: controller.signal,
        })
        if (!response.body) {
          console.error('ReadableStream not supported')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')

        let done = false
        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            setLogs((prev) => prev + chunk)
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error fetching logs:', error)
        }
      }
    }

    fetchLogs()
    return () => {
      controller.abort()
    }
  }, [])

  return (
    <section className="col-span-1 lg:col-span-1 border border-gray-700 rounded-2xl p-6 overflow-auto bg-black shadow-xl max-h-[600px]">
      <h2 className="font-semibold mb-6 text-green-400 text-xl border-b border-green-600 pb-2">
        Logs :
      </h2>
      <div
        ref={containerRef}
        className="h-[520px] w-full bg-black text-green-400 p-4 rounded-xl overflow-y-scroll font-mono text-sm whitespace-pre-wrap shadow-inner"
      >
        {logs || 'Waiting for logs...'}
      </div>
    </section>
  )
}
