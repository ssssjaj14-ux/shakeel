// AIService.ts
import OpenAI from "openai";

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  imageUrl?: string;
}

export class AIService {
  private client: OpenAI;

  private models = {
    auto: "deepseek/deepseek-chat-v3.1:free",
    code: "qwen/qwen3-coder:free",
    creative: "mistralai/mistral-nemo:free",
    knowledge: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    general: "deepseek/deepseek-chat-v3.1:free",
    image: "google/gemini-2.5-flash-image-preview:free"
  };

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1"
    });
  }

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
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (m,p1,p2)=>p1+p2.toUpperCase());
    if (corrected && !/[.!?]$/.test(corrected.trim())) corrected += ".";
    return corrected;
  }

  private getModel(serviceType: string, hasImage: boolean): string {
    if (hasImage) return this.models.image;
    switch(serviceType) {
      case 'code': return this.models.code;
      case 'creative': return this.models.creative;
      case 'knowledge': return this.models.knowledge;
      case 'general': return this.models.general;
      default: return this.models.auto;
    }
  }

  async sendMessage(messages: AIMessage[], serviceType: string = 'auto'): Promise<AIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      const hasImage = !!lastMessage.image;
      const isImageGeneration = /generate.*image|create.*image|make.*image|draw|picture|photo/i.test(lastMessage.content);

      const selectedModel = this.getModel(serviceType, hasImage);

      // Image handling
      if (isImageGeneration && !hasImage) {
        const prompt = lastMessage.content.replace(/generate|create|make|draw/gi, '').trim();
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${Date.now()}&enhance=true`;
        return {
          content: `I've generated an image for: "${prompt}"`,
          model: 'Pollinations AI',
          imageUrl
        };
      }

      // Format messages for OpenAI client
      const formattedMessages = [
        { role: 'system', content: `You are PandaNexus, a helpful AI assistant.` },
        ...messages.slice(-5).map(msg => ({
          role: msg.role,
          content: msg.image ? [
            { type: "text", text: this.enhancedSpellCheck(msg.content) },
            { type: "image_url", image_url: { url: msg.image } }
          ] : this.enhancedSpellCheck(msg.content)
        }))
      ];

      const response = await this.client.chat.completions.create({
        model: selectedModel,
        messages: formattedMessages,
        temperature: serviceType === 'creative' ? 0.8 : serviceType === 'code' ? 0.3 : 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false,
        extra_headers: {
          "HTTP-Referer": "https://pandanexus.dev",
          "X-Title": "PandaNexus AI Platform"
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content received from API');

      return { content, model: selectedModel };
    } catch (error) {
      console.error("AIService Error:", error);
      const fallback: Record<string,string> = {
        auto: "Hi! I'm PandaNexus AI assistant. How can I help?",
        code: "Here's a simple code example: console.log('Hello PandaNexus');",
        creative: "Let's create something amazing! What project are you working on?",
        knowledge: "I can provide detailed knowledge and explanations on any topic.",
        general: "Hello! I'm PandaNexus, your AI assistant. How can I assist you today?"
      };
      return { content: fallback[serviceType] || fallback.auto, model: 'PandaNexus Offline' };
    }
  }

  async spellCheck(text: string): Promise<string> {
    try {
      const localCorrection = this.enhancedSpellCheck(text);
      if (localCorrection !== text) return localCorrection;

      const response = await this.client.chat.completions.create({
        model: this.models.general,
        messages: [
          { role: 'system', content: 'Correct spelling, grammar, and punctuation. Return ONLY the corrected text.' },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      return response.choices?.[0]?.message?.content || localCorrection;
    } catch (error) {
      console.error("Spell check error:", error);
      return this.enhancedSpellCheck(text);
    }
  }
}

// Instantiate with your API key
export const aiService = new AIService("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");
