import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";
import OpenAI from "openai";
import { db } from "./config/database.js";
import { chats, users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { ChatCompletionMessageParam } from "openai/resources";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialze StreamChat client
const apiKey = process.env.STREAM_API_KEY || "";
const apiSecret = process.env.STREAM_API_SECRET || "";
const chatClient = StreamChat.getInstance(apiKey, apiSecret);

// initialize openai client
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

app.post(
  "/register-user",
  async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body;
    // Here you would typically hash the password and save the user to a database

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    try {
      const userId = email.replace(/[^a-zA-Z0-9_-]/g, "_"); // Use email as userId

      // check if user exists
      const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });

      if (!userResponse.users.length) {
        // Create a new user
        await chatClient.upsertUser({
          id: userId,
          name: name,
          email: email,
          role: "user",
        });
      }

      // check if user exists in the database
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));

      if (!existingUser.length) {
        // Insert user into the database
        console.log(
          `User ${userId} does not exist in the database. Adding them...`
        );
        await db.insert(users).values({
          userId,
          name,
          email,
        });
      }

      res.status(200).json({ userId, name, email });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Create a new chat channel
app.post("/chat", async (req: Request, res: Response): Promise<any> => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ message: "Message and userId are required" });
  }

  try {
    // Verify user exists
    const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });
    if (!userResponse.users.length) {
      return res
        .status(404)
        .json({ message: "User not found, please register first" });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!existingUser.length) {
      return res
        .status(404)
        .json({ message: "User not found, please register" });
    }

    // Fetch users past messages for context
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(chats.createdAt)
      .limit(10);

    // Format chat history for Open AI
    const conversation: ChatCompletionMessageParam[] = chatHistory.flatMap(
      (chat) => [
        { role: 'user', content: chat.message },
        { role: 'assistant', content: chat.reply },
      ]
    );

    // Add latest user messages to the conversation
    conversation.push({ role: 'user', content: message });

    // send the message to OpenAI GPT-4
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversation as ChatCompletionMessageParam[],
    });
    const gptMessage: string =
      gptResponse.choices[0].message?.content ?? "No response from AI";

    // Save the chat message and response to the database
    await db.insert(chats).values({
      userId: userId,
      message: message,
      reply: gptMessage,
    });

    // Create or get channel
    const channel = chatClient.channel("messaging", `chat-${userId}`, {
      name: "AI Chat",
      created_by_id: "ai_bot",
    });
    await channel.create();
    await channel.sendMessage({
      text: gptMessage,
      user_id: "ai_bot",
    });

    res.status(200).json({ reply: gptMessage });
  } catch (error) {
    console.error("Error creating chat channel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get chat history for a user
app.post("/get-messages", async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));
    if (chatHistory.length === 0) {
      res.status(404).json({ message: "No chat history found" });
    }

    res.status(200).json({ messages: chatHistory });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
  // Fetch messages from the database
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
