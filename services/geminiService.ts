
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, ReceiptScanResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinances = async (
  transactions: Transaction[],
  categories: Category[]
) => {
  const transactionData = transactions.map(t => ({
    amount: t.amount,
    type: t.type,
    category: categories.find(c => c.id === t.categoryId)?.name,
    date: t.date
  }));

  const prompt = `
    Analyze these financial transactions and provide 3 actionable insights or tips to save money.
    Format the response as a JSON array of objects with 'title', 'description', and 'severity' (one of: 'info', 'warning', 'success').
    Transactions: ${JSON.stringify(transactionData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING }
            },
            required: ["title", "description", "severity"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const scanReceipt = async (base64Image: string): Promise<ReceiptScanResult | null> => {
  const prompt = "Extract the merchant name, total amount, date, and suggest a category for this receipt. Return as JSON.";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["amount", "date", "category"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};
