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
import { useEffect, useState } from "react";
import { TypingDots } from "./TypingDots"; // ton composant de points animés

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean; // true si l'analyse est en streaming
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

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";
  const [parsed, setParsed] = useState<ParsedResponse | null>(null);

  useEffect(() => {
    try {
      const json = JSON.parse(content) as ParsedResponse;
      setParsed(json);
    } catch {
      setParsed(null);
    }
  }, [content]);

  const renderGraph = (g: Graph, idx: number) => {
    const chartData = g.data.labels.map((label, i) => {
      const obj: Record<string, string | number> = { name: label };
      g.data.datasets.forEach((ds) => {
        obj[ds.label] = ds.data[i];
      });
      return obj;
    });

    if (g.type === "bar") {
      return (
        <BarChart key={idx} width={500} height={300} data={chartData} className="mb-6">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {g.data.datasets.map((ds, i) => (
            <Bar key={i} dataKey={ds.label} fill={ds.backgroundColor ?? "#8884d8"} />
          ))}
        </BarChart>
      );
    } else {
      return (
        <LineChart key={idx} width={500} height={300} data={chartData} className="mb-6">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {g.data.datasets.map((ds, i) => (
            <Line key={i} type="monotone" dataKey={ds.label} stroke={ds.backgroundColor ?? "#8884d8"} />
          ))}
        </LineChart>
      );
    }
  };

  return (
    <div className="flex justify-center">
      <div
        className={`w-full md:w-2/3 lg:w-1/2 p-5 rounded-xl shadow-md transition-all duration-300 ${
          isUser ? "bg-blue-500 text-white" : "bg-white text-gray-900 border"
        }`}
      >
        {parsed ? (
          <div>
            {/* Tableau */}
            {parsed.table.length > 0 && (
              <table className="min-w-full border mb-4 text-center">
                <thead className="bg-gray-100">
                  <tr>
                    {parsed.table[0].map((header, i) => (
                      <th key={i} className="border px-3 py-1 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.table.slice(1).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {row.map((cell, j) => (
                        <td key={j} className="border px-3 py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Graphiques */}
            {parsed.graph.map((g, idx) => renderGraph(g, idx))}

            {/* Analyse */}
            {isStreaming ? (
              <TypingDots />
            ) : (
              parsed.analysis && (
                <p className="mt-4 font-medium whitespace-pre-line">{parsed.analysis}</p>
              )
            )}
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  );
}
