import { useRef, useState } from "react";

type TokenMessage = { type: "token"; content: string };
type ErrorMessage = { type: "error"; message: string };
type CompleteMessage = {
  type: "complete";
  analysis: {
    id: string;
    root_cause: string;
    error_chain: string;
    affected_services: string;
    severity: "critical" | "warning" | "info";
    suggested_fix: string;
    raw_response: string;
  };
};

type IncomingMessage = TokenMessage | ErrorMessage | CompleteMessage;

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = (
    wsUrl: string,
    onComplete: (analysis: CompleteMessage["analysis"]) => void
  ) => {
    setError(null);
    setStreamedText("");
    setIsStreaming(true);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data: IncomingMessage = JSON.parse(event.data);
      if (data.type === "token") {
        setStreamedText((prev) => prev + data.content);
      }
      if (data.type === "error") {
        setError(data.message);
        setIsStreaming(false);
      }
      if (data.type === "complete") {
        onComplete(data.analysis);
        setIsStreaming(false);
      }
    };

    socket.onerror = () => {
      setError("WebSocket connection failed.");
      setIsStreaming(false);
    };

    socket.onclose = () => {
      setIsStreaming(false);
    };
  };

  const disconnect = () => {
    socketRef.current?.close();
    socketRef.current = null;
    setIsStreaming(false);
  };

  return { streamedText, isStreaming, error, connect, disconnect };
}
