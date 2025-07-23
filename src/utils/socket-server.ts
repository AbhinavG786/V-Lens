import { Server } from "socket.io";
import { Room } from "../models/roomModel";
import { User } from "../models/userModel";

let io: Server;
export const onlineAgents = new Map<string, string>();

export const SocketServiceInit = (server:any) => {
  io = new Server(server, { cors: { origin: "*" } });
  console.log("Socket server is serving")

  io.on("connection", (socket) => {
    console.log("New Connection connected :", socket.id);

    //Agent dashboard should connect to the WebSocket server immediately after login — even if no room has been assigned yet.
    socket.on("agent-online", async (data) => {
      const {firebaseUID}=data
  const user = await User.findOne({ firebaseUID, isAgent: true });
  if (user) {
    onlineAgents.set(user._id.toString(), socket.id);
    console.log(`Agent ${user._id} is now online`);
  }
});

    // event for joining room
    socket.on("join-room", async(data, callback) => {
      const { roomId } = data;
     
            const room = await Room.findById(roomId);

       if (!roomId || roomId==null || !room) {
    const res = { valid: false, msg: "provide a room Id" };
    if (typeof callback === "function") callback(res);
    return;
  }

      socket.join(roomId);
      const res = { valid: true, msg: "joined the room :", roomId };
  if (typeof callback === "function") callback(res);
    });

    // event for disconnecting
    socket.on("disconnect", () => {
       for (const [agentId, sockId] of onlineAgents.entries()) {
    if (sockId === socket.id) {
      onlineAgents.delete(agentId);
      console.log(`Agent ${agentId} is now offline`);
      break;
    }
  }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io
};

export {io}
