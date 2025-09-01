// src/services/AIService.ts

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  image?: string; // optional uploaded image URL
}

export interface AIResponse {
  content: string;
  model: string;
  imageUrl?: string; // generated image URL
}

export class AIService {
  private apiKey = "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";
  private baseUrl = "https://openrouter.ai/api/v1";

  private models = {
    auto: "meta-llama/llama-3.2-3b-instruct:free",
    code: "qwen/qwen3-coder:free",
    creative: "deepseek/deepseek-chat-v3.1:free",
    knowledge: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    general: "mistralai/mistral-nemo:free",
    image: "google/gemini-2.5-flash-image-preview:free"
  };

  // Enhanced local spell checker
  private enhancedSpellCheck(text: string): string {
    if (!text) return "";
    const corrections: Record<string, string> = {
      'teh': 'the', 'recieve': 'receive', 'seperate': 'separate',
      'definately': 'definitely', 'occured': 'occurred', 'neccessary': 'necessary',
      'accomodate': 'accommodate', 'begining': 'beginning', 'beleive': 'believe',
      'calender': 'calendar', 'cemetary': 'cemetery', 'changable': 'changeable',
      'collegue': 'colleague', 'comming': 'coming', 'commited': 'committed',
      'concious': 'conscious', 'definite': 'definite', 'embarass': 'embarrass',
      'enviroment': 'environment', 'existance': 'existence', 'experiance': 'experience',
      'familar': 'familiar', 'finaly': 'finally', 'foriegn': 'foreign',
      'goverment': 'government', 'grammer': 'grammar', 'independant': 'independent',
      'intergrate': 'integrate', 'knowlege': 'knowledge', 'maintainance': 'maintenance',
      'occassion': 'occasion', 'persue': 'pursue', 'priviledge': 'privilege',
      'recomend': 'recommend', 'refered': 'referred', 'relevent': 'relevant',
      'responsable': 'responsible', 'succesful': 'successful',
      'tommorow': 'tomorrow', 'truely': 'truly', 'untill': 'until',
      'usefull': 'useful', 'wierd': 'weird', 'writting': 'writing'
    };

    let corrected = text;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    });

    corrected = corrected.replace(/\bi\b/g, 'I');
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    if (corrected && !/[.!?]$/.test(corrected.trim())) corrected += ".";
    return corrected;
  }

  private getModel(serviceType: string, hasImage: boolean): string {
    if (hasImage) return this.models.image;
    return this.models[serviceType as keyof typeof this.models] || this.models.auto;
  }

  // Main function to send messages to OpenRouter AI
  async sendMessage(messages: AIMessage[], serviceType: string = 'auto'): Promise<AIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      const hasImage = !!lastMessage.image;
      const isImageGeneration = /generate.*image|create.*image|make.*image|draw|picture|photo/i.test(lastMessage.content);
      const selectedModel = this.getModel(serviceType, hasImage);

      // Handle image generation fallback (Pollinations)
      if (isImageGeneration && !hasImage) {
        const prompt = lastMessage.content.replace(/generate|create|make|draw/gi, '').trim();
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${Date.now()}&enhance=true`;
        return {
          content: `I've generated an image for: "${prompt}". Here's your custom AI-generated image!`,
          model: 'Pollinations AI',
          imageUrl
        };
      }

      // Prepare messages
      const apiMessages = [
        { role: 'system', content: "You are PandaNexus, an advanced AI assistant created by Shakeel. Provide accurate and helpful responses." },
        ...messages.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.image ? [
            { type: "text", text: this.enhancedSpellCheck(msg.content) },
            { type: "image_url", image_url: { url: msg.image } }
          ] : this.enhancedSpellCheck(msg.content)
        }))
      ];

      // Fetch from OpenRouter
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pandanexus.dev',
          'X-Title': 'PandaNexus AI Platform'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: serviceType === 'creative' ? 0.8 : serviceType === 'code' ? 0.3 : 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content || lastMessage.content,
        model: selectedModel,
        imageUrl: lastMessage.image
      };
    } catch (error) {
      console.error("AIService Error:", error);
      return {
        content: "Hi! I'm PandaNexus. I am here to help you, but the AI service is currently unavailable.",
        model: 'Offline'
      };
    }
  }

  // Spell check helper
  async spellCheck(text: string): Promise<string> {
    try {
      const corrected = this.enhancedSpellCheck(text);
      if (corrected !== text) return corrected;
      return text;
    } catch (error) {
      console.error("Spell check error:", error);
      return text;
    }
  }
}

export const aiService = new AIService();
