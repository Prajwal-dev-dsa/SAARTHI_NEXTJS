import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { messages, userRole } = await req.json();

    // Get the most recent message to feed into the prompt
    let recentMessage = "Hello";
    if (messages && messages.length > 0) {
      recentMessage = messages[messages.length - 1].content;
    }

    const prompt = `You are an AI reply suggestion system for a vehicle booking chat app.

Generate short, smart, human-like quick reply suggestions based on:
- ROLE (DRIVER or USER)
- RECENT_MESSAGE

Rules:
- Return exactly 4 suggestions
- Keep replies short (3-12 words)
- Match the conversation context and tone
- Driver replies should sound professional and helpful
- User replies should sound natural and realistic
- Avoid repetition
- Return ONLY valid JSON

Output format:
{
  "suggestions": [
    "Reply 1",
    "Reply 2",
    "Reply 3",
    "Reply 4"
  ]
}

Input:
ROLE: ${userRole === "USER" ? "USER" : "DRIVER"}
RECENT_MESSAGE: "${recentMessage}"`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean markdown formatting if Gemini adds it
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(text);

    return NextResponse.json(
      { suggestions: parsed.suggestions },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI_SUGGESTIONS_ERR:", error);
    const fallback = [
      "Okay.",
      "Yes.",
      "I am on my way.",
      "Please wait.",
      "Call me.",
      "Where are you?",
    ];
    return NextResponse.json({ suggestions: fallback }, { status: 200 });
  }
}
