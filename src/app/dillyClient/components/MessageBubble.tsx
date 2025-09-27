"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useState, useRef } from "react";
import { TypingDots } from "./TypingDots";
import { Bot, User, Download, Volume2, VolumeX } from "lucide-react";
import { downloadGraphAsPng } from "@/utils/downloadGraph";
import { speak, stopSpeaking } from "@/utils/textToSpeech";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreamingAnalysis?: boolean;
  streamingAnalysisText?: string;
}

interface ChartDataSet {
  label: string;
  data: number[];
  backgroundColor?: string;
}

interface Graph {
  type: "bar" | "line";
  data: {
    labels: string[];
    datasets: ChartDataSet[];
  };
}

interface ParsedResponse {
  table: (string | number)[][];
  graph: Graph[];
  analysis: string;
}

export default function MessageBubble({
  role,
  content,
  isStreamingAnalysis,
  streamingAnalysisText,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [parsed, setParsed] = useState<ParsedResponse | null>(null);
  const graphRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    let newParsed: ParsedResponse | null = null;
    if (content) {
      try {
        newParsed = JSON.parse(content) as ParsedResponse;
        setParsed(newParsed);
      } catch {
        setParsed(null);
      }
    } else {
      setParsed(null);
    }

    stopSpeaking();
    setIsSpeaking(false);

    if (newParsed) {
      currentUtterance.current = null;
    }
  }, [content]);

  useEffect(() => {
    if (currentUtterance.current) {
      currentUtterance.current.onend = () => {
        setIsSpeaking(false);
      };
      currentUtterance.current.onerror = (e) => {
        console.error("TTS Error:", e);
        setIsSpeaking(false);
      };
    }
  }, [isSpeaking, parsed]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    graphRefs.current = graphRefs.current.slice(0, parsed?.graph.length || 0);
  }, [parsed]);

  const downloadGraph = async (index: number) => {
    const graphElement = graphRefs.current[index];
    const graphData = parsed?.graph[index]?.data;

    if (!graphElement || !graphData) return;

    await downloadGraphAsPng(graphElement, graphData, index);
  };

  const toggleSpeech = async () => {
    if (!parsed || isStreamingAnalysis) return;

    const analysisText = parsed.analysis;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);

      try {
        const utterance = await speak(analysisText);
        if (!utterance) {
          setIsSpeaking(false);
        } else {
          currentUtterance.current = utterance;
        }
      } catch (e) {
        console.error("Failed to start speech synthesis:", e);
        setIsSpeaking(false);
      }
    }
  };

  const renderGraph = (g: Graph, idx: number) => {
    const chartData = g.data.labels.map((label, i) => {
      const obj: Record<string, string | number> = { name: label };
      g.data.datasets.forEach((ds) => {
        obj[ds.label] = ds.data[i];
      });
      return obj;
    });

    const ChartComponent = g.type === "bar" ? BarChart : LineChart;

    return (
      <div key={idx} className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => downloadGraph(idx)}
            className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition"
            title="Download Chart as PNG"
          >
            <Download size={16} className="mr-1" />
            Télécharger
          </button>
        </div>

        <div
          ref={(el) => (graphRefs.current[idx] = el)}
          className="flex justify-center"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <ChartComponent
            width={500}
            height={300}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            style={{ fontFamily: "sans-serif" }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {g.data.datasets.map((ds, i) =>
              g.type === "bar" ? (
                <Bar
                  key={i}
                  dataKey={ds.label}
                  fill={ds.backgroundColor ?? "#8884d8"}
                />
              ) : (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={ds.backgroundColor ?? "#8884d8"}
                />
              )
            )}
          </ChartComponent>
        </div>
      </div>
    );
  };

  const analysisTextContent = isStreamingAnalysis
    ? streamingAnalysisText || <TypingDots />
    : parsed?.analysis;

  const isAnalysisReady = parsed && !isStreamingAnalysis && parsed.analysis;

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex w-full max-w-4xl mx-auto">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1">
          {isUser ? (
            <div className="w-full h-full bg-blue-500 text-white rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 text-gray-800 rounded-full flex items-center justify-center">
              <Bot size={18} />
            </div>
          )}
        </div>

        <div
          className={`flex-1 min-w-0 p-4 rounded-xl shadow-sm ${
            isUser
              ? "bg-white text-gray-900 border border-gray-200"
              : "bg-white text-gray-900"
          }`}
        >
          {isUser && <p className="whitespace-pre-line">{content}</p>}

          {!isUser &&
            (content === "" && isStreamingAnalysis ? (
              <TypingDots />
            ) : parsed ? (
              <div>
                {parsed.table.length > 0 && (
                  <table className="min-w-full border mb-4 text-center text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {parsed.table[0].map((header, i) => (
                          <th
                            key={i}
                            className="border px-3 py-2 font-medium text-gray-600"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.table.slice(1).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {row.map((cell, j) => (
                            <td key={j} className="border px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {parsed.graph.map((g, idx) => renderGraph(g, idx))}

                <div className="mt-4 flex items-start">
                  <p className="whitespace-pre-line text-gray-800 flex-1">
                    {analysisTextContent}
                  </p>

                  {isAnalysisReady && (
                    <button
                      onClick={toggleSpeech}
                      className={`ml-3 p-1 rounded-full flex-shrink-0 transition-colors ${
                        isSpeaking
                          ? "text-white bg-blue-500 hover:bg-blue-600"
                          : "text-gray-500 hover:text-blue-500 hover:bg-gray-100"
                      }`}
                      title={
                        isSpeaking ? "Arrêter la lecture" : "Écouter l'analyse"
                      }
                    >
                      {isSpeaking ? (
                        <VolumeX size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line">{content}</p>
            ))}
        </div>
      </div>
    </div>
  );
}
