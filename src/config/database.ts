import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

config({
    path: '.env'
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in .env file");
}

// init Neon Client
const client = neon(process.env.DATABASE_URL);

// init Drizzle ORM
export const db = drizzle(client);
