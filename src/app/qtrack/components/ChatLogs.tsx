"use client";

type LogEntry = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  responseTimeMs: number;
  contextBreakdown: string;
};

type ChatLogsProps = {
  logs: LogEntry[];
  isOpen: boolean;
};

export default function ChatLogs({ logs, isOpen }: ChatLogsProps) {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-80 bg-gray-900 text-green-300 text-xs p-4 overflow-auto border-l border-green-700 transform transition-transform duration-300 z-30 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <h2 className="text-white font-semibold mb-4">Logs</h2>
      {logs.length > 0 ? (
        logs.map((log, idx) => (
          <div key={idx} className="mb-4">
            <p> <strong>Model:</strong> {log.model}</p>
            <p> <strong>Input:</strong> {log.inputTokens} tokens</p>
            <p> <strong>Output:</strong> {log.outputTokens} tokens</p>
            <p> <strong>Cost:</strong> ${log.cost.toFixed(4)}</p>
            <p> <strong>Time:</strong> {log.responseTimeMs}ms</p>
            <p> <strong>Context:</strong> {log.contextBreakdown}</p>
            <hr className="my-2 border-green-700" />
          </div>
        ))
      ) : (
        <p className="italic text-gray-400">Aucun log disponible.</p>
      )}
    </aside>
  );
}
