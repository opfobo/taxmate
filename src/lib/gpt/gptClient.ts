
import { useAuth } from "@/context/AuthContext";
import OpenAI from "openai";

// Default API configuration
const defaultConfig = {
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true, // For client-side usage
};

// Create OpenAI instance
export const openai = new OpenAI(defaultConfig);

// Function to get OpenAI client with user API key
export const getOpenAIClient = async (userId?: string) => {
  if (!userId) {
    return openai;
  }

  try {
    // Get user's API key from the database
    const response = await fetch(`/api/ai/key?userId=${userId}`);
    if (!response.ok) {
      console.warn("Failed to get user API key, using default configuration");
      return openai;
    }

    const { apiKey } = await response.json();
    
    if (!apiKey) {
      return openai;
    }

    // Create a new instance with the user's API key
    return new OpenAI({
      ...defaultConfig,
      apiKey,
    });
  } catch (error) {
    console.error("Error getting OpenAI client:", error);
    return openai;
  }
};

// Hook to use OpenAI in components
export const useOpenAI = () => {
  const { user } = useAuth();
  
  const callOpenAI = async (
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ) => {
    try {
      const client = await getOpenAIClient(user?.id);
      
      const completion = await client.chat.completions.create({
        model: options.model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw error;
    }
  };

  return { callOpenAI };
};

export default useOpenAI;
