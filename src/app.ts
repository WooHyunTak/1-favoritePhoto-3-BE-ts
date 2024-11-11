import { PORT } from "./env";
import express from "express";
import cors, { CorsOptions } from "cors";
import { Server } from "socket.io";
import http from "http";
import errorHandler from "./middlewares/error/errorHandler";
import userRouter from "./controllers/userController";
import shopRouter from "./controllers/shopController";
import cardRouter from "./controllers/cardController";
import purchaseRouter from "./controllers/purchaseController";
import notificationRouter from "./controllers/notificationController";
import exchangeRouter from "./controllers/exchangeController";
import pointRouter from "./controllers/pointController";
import { setupSocket } from "./utils/socket/socket";

const app = express();
app.use(express.json());

const allowedOrigins: string[] = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://willowy-gingersnap-13564c.netlify.app",
  "https://favorite-photo-3.netlify.app",
];
// CORS 설정
const corsOptions: CorsOptions = {
  credentials: true,
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, origin?: string) => void
  ) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin); // 허용
    } else {
      callback(new Error("Not allowed by CORS")); // 허용하지 않음
    }
  },
  exposedHeaders: ["set-cookie"],
};

// Express app에 CORS 적용
app.use(cors(corsOptions));

const server = http.createServer(app);

// Socket.IO 초기화 및 CORS 설정 적용
export const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: corsOptions.credentials,
  },
});

app.use("/users", userRouter);
app.use("/shop", shopRouter);
app.use("/cards", cardRouter);
app.use("/purchases", purchaseRouter);
app.use("/exchange", exchangeRouter);
app.use("/notifications", notificationRouter);
app.use("/point", pointRouter);

// socket.ts에 io 객체 전달
setupSocket(io);

app.use(errorHandler);

server.listen(PORT || 3000, () => console.log("SERVER START"));
