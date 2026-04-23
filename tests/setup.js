import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js"


dotenv.config();

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});