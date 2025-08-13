import dotenv from "dotenv";
import { PrismaClient } from "./generated/prisma/index.js";

export const prisma = new PrismaClient();
dotenv.config();
