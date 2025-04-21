
import { useToast } from "@/hooks/use-toast";
import { getAddressPrompt } from "@/lib/gpt/prompts/address";
import { openai, getOpenAIClient } from "@/lib/gpt/gptClient";
import { ParsedAddress } from "@/lib/types/parsedAddress";

export const parseAddressWithGPT = async (
  addressText: string,
  userId?: string
): Promise<ParsedAddress | null> => {
  try {
    const prompt = getAddressPrompt(addressText);
    const client = await getOpenAIClient(userId);
    
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.error("No content in GPT response");
      return null;
    }

    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;
      
      return JSON.parse(jsonContent) as ParsedAddress;
    } catch (jsonError) {
      console.error("Error parsing JSON from GPT response:", jsonError);
      console.log("Raw response:", content);
      return null;
    }
  } catch (error) {
    console.error("Error processing address with GPT:", error);
    return null;
  }
};

export const useAddressGPT = () => {
  const { toast } = useToast();
  
  const parseAddress = async (addressText: string, userId?: string): Promise<ParsedAddress | null> => {
    try {
      const result = await parseAddressWithGPT(addressText, userId);
      return result;
    } catch (error) {
      console.error("GPT address parsing error:", error);
      toast({
        title: "Address parsing failed",
        description: "Could not parse the address using AI. Please try again or enter manually.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  return { parseAddress };
};
