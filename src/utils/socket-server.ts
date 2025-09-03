import { Server } from "socket.io";
import { Room } from "../models/roomModel";
import { User } from "../models/userModel";

let io: Server;

// Track connected agents and users
export const onlineAgents = new Map<string, string>(); // agentId → socketId
export const onlineUsers = new Map<string, string>(); // userId → socketId

export const SocketServiceInit = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5174", "http://localhost:5173"], // ✅ restrict origins
      credentials: true,
    },
  });

  console.log("✅ Socket server is running");

  io.on("connection", (socket) => {
    console.log("🔌 New connection:", socket.id);

    /**
     * 📩 Handle sending messages
     */
    socket.on(
      "send-message",
      ({ roomId, from, text, senderRole }: { roomId: string; from: string; text: string; senderRole: string }) => {
        if (!roomId || !text) return;

        io.to(roomId).emit("receive-message", {
          from,
          text,
          senderRole,
          timestamp: new Date().toISOString(),
        });

        console.log(`💬 Message in room ${roomId}: ${text}`);
      }
    );

    /**
     * 🟢 Agent goes online
     */
    socket.on("agent-online", async (data: { firebaseUID: string }) => {
      const { firebaseUID } = data;
      const user = await User.findOne({ firebaseUID, isAgent: true });

      if (user) {
        onlineAgents.set(user._id.toString(), socket.id);
        console.log(`🟢 Agent ${user._id} is now online`);
      }
    });

    /**
     * 🟢 User goes online
     */
    socket.on("user-online", async (data: { firebaseUID: string }) => {
      const { firebaseUID } = data;
      const user = await User.findOne({
        firebaseUID,
        isAdmin: false,
        isAgent: false,
      });

      if (user) {
        onlineUsers.set(user._id.toString(), socket.id);
        console.log(`🟢 User ${user._id} is now online`);
      }
    });

    /**
     * 👥 Join a room
     */
    socket.on(
      "join-room",
      async (data: { roomId: string }, callback?: (res: any) => void) => {
        const { roomId } = data;

        if (!roomId) {
          const res = { valid: false, msg: "Room ID is required" };
          if (callback) callback(res);
          return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
          const res = { valid: false, msg: "Room not found" };
          if (callback) callback(res);
          return;
        }

        socket.join(roomId);
        const res = { valid: true, msg: `Joined room: ${roomId}` };
        if (callback) callback(res);

        console.log(`👥 Socket ${socket.id} joined room ${roomId}`);
      }
    );

    /**
     * ❌ Disconnect handling
     */
    socket.on("disconnect", () => {
      for (const [agentId, sockId] of onlineAgents.entries()) {
        if (sockId === socket.id) {
          onlineAgents.delete(agentId);
          console.log(`🔴 Agent ${agentId} is now offline`);
          io.emit("agent-disconnected", { agentId });
        }
      }

      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} is now offline`);
          io.emit("user-disconnected", { userId });
        }
      }

      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });

    /**
     * 🔚 End chat
     */
    socket.on("end-chat", ({ roomId }: { roomId: string }) => {
      if (!roomId) return;

      io.to(roomId).emit("chat-ended", { roomId });
      socket.leave(roomId);

      console.log(`🔚 Chat ended for room ${roomId}`);
    });
  });

  return io;
};

export { io };
