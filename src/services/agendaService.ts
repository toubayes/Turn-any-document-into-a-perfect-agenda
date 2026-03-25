import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import { MeetingAgenda } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (extension === "md" || extension === "txt") {
    return await file.text();
  } else {
    throw new Error("Unsupported file format. Please upload a .docx or .md file.");
  }
}

export async function generateAgenda(content: string): Promise<MeetingAgenda> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze the following document and craft a structured meeting agenda. 
            For each topic, provide:
            1. A concise summary.
            2. Specific action items.
            3. Key stakeholders involved.
            4. Estimated time for the topic in minutes.

            Also provide an overall title and summary for the meeting.

            Document Content:
            ${content}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overallSummary: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                summary: { type: Type.STRING },
                actionItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                stakeholders: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                durationMinutes: { type: Type.NUMBER },
              },
              required: ["topic", "summary", "actionItems", "stakeholders", "durationMinutes"],
            },
          },
        },
        required: ["title", "overallSummary", "items"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate agenda. Please try again.");
  }

  return JSON.parse(response.text) as MeetingAgenda;
}
