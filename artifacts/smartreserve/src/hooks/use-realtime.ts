import { useEffect, useRef } from "react";

export type RealtimeEvent = {
  type: string;
  data: unknown;
  timestamp: string;
};

type Handler = (event: RealtimeEvent) => void;

function getWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function useRealtime(onEvent: Handler): void {
  const handlerRef = useRef<Handler>(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      try {
        ws = new WebSocket(getWsUrl());

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data as string) as RealtimeEvent;
            if (msg.type !== "connected") {
              handlerRef.current(msg);
            }
          } catch {
          }
        };

        ws.onclose = () => {
          if (!destroyed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
