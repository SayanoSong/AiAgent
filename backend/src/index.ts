import express from "express";
import dotenv from "dotenv";
import formRouter from "./routes/form";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/form", formRouter);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
