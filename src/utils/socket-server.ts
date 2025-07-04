import { Server } from "socket.io";
import { Room } from "../models/roomModel";

let io: Server;

export const SocketServiceInit = (server:any) => {
  io = new Server(server, { cors: { origin: "*" } });
  console.log("Socket server is serving")

  io.on("connection", (socket) => {
    console.log("New Connection connected :", socket.id);

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
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io
};

export {io}
