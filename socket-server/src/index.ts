import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { prisma } from "./lib/prisma";
import "dotenv/config";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_BASE_URL || "*",
  },
});

// --- SOCKET CONNECTION LOGIC ---
io.on("connection", (socket: Socket) => {
  console.log(`New client connected: ${socket.id}`);

  // 1. Authenticate & Register Partner
  socket.on("register_partner", async (partnerId: string) => {
    try {
      await prisma.user.update({
        where: { id: partnerId },
        data: { socketId: socket.id, isOnline: true },
      });
      socket.join(`partner_${partnerId}`);
      console.log(`Partner ${partnerId} registered with socket ${socket.id}`);
    } catch (error) {
      console.error("Failed to register partner:", error);
    }
  });

  // 2. Authenticate & Register User (Rider)
  socket.on("register_user", (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // 3. Receive Live Location Updates
  socket.on("update_location", async (data: { partnerId: string; lat: number; lng: number }) => {
    try {
      await prisma.user.update({
        where: { id: data.partnerId },
        data: {
          location: { type: "Point", coordinates: [data.lng, data.lat] },
        },
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  });

  // User requests a ride -> Forward to specific Partner
  socket.on("new_ride_request", (data) => {
    console.log(`Forwarding ride request to Partner: ${data.partnerId}`);
    io.to(`partner_${data.partnerId}`).emit("new_ride_request", data);
  });

  // User cancels request -> Forward to specific Partner
  socket.on("ride_cancelled", (data) => {
    console.log(`Forwarding cancellation to Partner: ${data.partnerId}`);
    io.to(`partner_${data.partnerId}`).emit("ride_cancelled", data);
  });

  // Partner accepts ride -> Forward to specific User
  socket.on("ride_accepted", (data) => {
    console.log(`Forwarding acceptance to User: ${data.userId}`);
    io.to(`user_${data.userId}`).emit("ride_accepted", data);
  });

  // Partner rejects ride -> Forward to specific User
  socket.on("ride_rejected", (data) => {
    console.log(`Forwarding rejection to User: ${data.userId}`);
    io.to(`user_${data.userId}`).emit("ride_rejected", data);
  });

  // Handle Disconnection
  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`);
    try {
      const user = await prisma.user.findFirst({ where: { socketId: socket.id } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isOnline: false, socketId: null,
            location: { type: "Point", coordinates: [null, null] },
          },
        });
      }
    } catch (error) {
      console.error("Disconnect handling failed:", error);
    }
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Socket Server running on port ${PORT}`);
});