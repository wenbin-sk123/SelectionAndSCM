import { create } from "zustand";
import { WebSocketMessage } from "@/lib/websocket";

interface MarketUpdate {
  timestamp: string;
  marketVolume: number;
  competitionLevel: number;
  consumerActivity: number;
}

interface BusinessEvent {
  type: "order" | "inventory" | "finance";
  data: any;
  timestamp: string;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  read: boolean;
}

interface RealtimeState {
  isConnected: boolean;
  marketData: MarketUpdate | null;
  businessEvents: BusinessEvent[];
  notifications: SystemNotification[];
  
  setConnectionStatus: (connected: boolean) => void;
  handleMessage: (message: WebSocketMessage) => void;
  addNotification: (notification: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateMarketData: (data: MarketUpdate) => void;
  addBusinessEvent: (event: Omit<BusinessEvent, "timestamp">) => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  isConnected: false,
  marketData: null,
  businessEvents: [],
  notifications: [],
  
  setConnectionStatus: (connected) => 
    set({ isConnected: connected }),
  
  handleMessage: (message) => {
    const { updateMarketData, addBusinessEvent, addNotification } = get();
    
    switch (message.type) {
      case "market:update":
        if (message.data) {
          updateMarketData(message.data);
        }
        break;
        
      case "business:order":
      case "business:inventory":
      case "business:finance":
        if (message.data) {
          addBusinessEvent({
            type: message.type.split(":")[1] as "order" | "inventory" | "finance",
            data: message.data,
          });
        }
        break;
        
      case "system:notification":
        if (message.data) {
          addNotification({
            title: message.data.title || "系统通知",
            message: message.data.message || "",
            type: message.data.type || "info",
          });
        }
        break;
        
      case "system:achievement":
        if (message.data) {
          addNotification({
            title: "成就解锁",
            message: message.data.message || "您获得了新的成就！",
            type: "success",
          });
        }
        break;
        
      default:
        console.log("Unhandled WebSocket message type:", message.type);
    }
  },
  
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50), // Keep only the latest 50 notifications
    })),
  
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
    })),
  
  clearNotifications: () =>
    set({ notifications: [] }),
  
  updateMarketData: (data) =>
    set({ marketData: data }),
  
  addBusinessEvent: (event) =>
    set((state) => ({
      businessEvents: [
        {
          ...event,
          timestamp: new Date().toISOString(),
        },
        ...state.businessEvents,
      ].slice(0, 100), // Keep only the latest 100 events
    })),
}));
