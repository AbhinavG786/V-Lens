import { Server } from "socket.io";
import {Message} from "../models/messageModel";
import { Room } from "../models/roomModel";

const createMessage = async (data: any) => {
  try {
    const savedMessage = await Message.create(data);
    return savedMessage;
  } catch (error) {
    console.error("Error creating message:", error);
    return null;
  }
};


export const SocketServiceInit = (server:any) => {
  const io = new Server(server, { cors: { origin: "*" } });
  console.log("Socket server is serving")

  io.on("connection", (socket) => {
    console.log("New Connection connected :", socket.id);

    // event for joining room
    socket.on("join-room", (data, callback) => {
      const { roomId } = data;

      if (roomId==null) {
      return  callback({ valid: false, msg: "provide a room Id" });
      }

      socket.join(roomId);
      callback({ valid: true, msg: "joined the room :", roomId });
    });

    // event for sending messages
    socket.on("send-message", async (data) => {
      const { senderId, roomId } = data;
      if (!senderId || !roomId) {
        return;
      }
      const room = await Room.findById(roomId);
if (!room || !room.participants.includes(senderId)) {
  return;
}
      const message = await createMessage(data);
      if (message) {
        io.to(roomId).emit("receive-message", {
          message,
          msg: "received message",
        });
      }
    });

    // event for disconnecting
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
