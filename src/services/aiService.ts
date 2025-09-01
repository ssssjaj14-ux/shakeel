// Enhanced AIService with proper integration
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
  private apiKey = "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";
  private baseUrl = "https://openrouter.ai/api/v1";

  private models = {
    auto: "qwen/qwen-2.5-72b-instruct:free",
    code: "deepseek/deepseek-coder",
    creative: "anthropic/claude-3-haiku",
    knowledge: "google/gemini-2.5-flash-image-preview:free",
    general: "qwen/qwen-2.5-72b-instruct:free",
    image: "google/gemini-2.5-flash-image-preview:free"
  };

  // Enhanced spell checker with better corrections
  private enhancedSpellCheck(text: string): string {
    if (!text) return "";
    
    const corrections = {
      // Common typos
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
      'responsable': 'responsible', 'seperate': 'separate', 'succesful': 'successful',
      'tommorow': 'tomorrow', 'truely': 'truly', 'untill': 'until',
      'usefull': 'useful', 'wierd': 'weird', 'writting': 'writing'
    };

    let corrected = text;
    
    // Apply corrections
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    });

    // Fix "i" to "I"
    corrected = corrected.replace(/\bi\b/g, 'I');
    
    // Capitalize first letter of sentences
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    // Add period if missing
    if (corrected && !/[.!?]$/.test(corrected.trim())) {
      corrected += ".";
    }
    
    return corrected;
  }

  // Get appropriate model based on service type
  private getModel(serviceType: string, hasImage: boolean): string {
    if (hasImage) return this.models.image;
    
    switch (serviceType) {
      case 'code': return this.models.code;
      case 'creative': return this.models.creative;
      case 'knowledge': return this.models.knowledge;
      case 'general': return this.models.general;
      default: return this.models.auto;
    }
  }

  // Enhanced message sending with proper error handling
  async sendMessage(messages: AIMessage[], serviceType: string = 'auto'): Promise<AIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      const hasImage = !!lastMessage.image;
      const isImageGeneration = /generate.*image|create.*image|make.*image/i.test(lastMessage.content);
      
      // Handle image generation requests
      if (isImageGeneration && !hasImage) {
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(lastMessage.content)}?width=512&height=512&seed=${Date.now()}`;
        return {
          content: `I've generated an image based on your request: "${lastMessage.content}"`,
          model: 'Pollinations AI',
          imageUrl
        };
      }

      const selectedModel = this.getModel(serviceType, hasImage);
      
      // Prepare system message based on service type
      let systemMessage = "You are PandaNexus, an advanced AI assistant created by Shakeel. Provide helpful, accurate, and engaging responses.";
      
      switch (serviceType) {
        case 'code':
          systemMessage = "You are PandaNexus Code Assistant. Provide clean, efficient code with explanations. Focus on best practices and optimization.";
          break;
        case 'creative':
          systemMessage = "You are PandaNexus Creative Assistant. Help with creative writing, brainstorming, and artistic projects with imagination and flair.";
          break;
        case 'knowledge':
          systemMessage = "You are PandaNexus Knowledge Assistant. Provide accurate, well-researched information with reliable sources when possible.";
          break;
      }

      // Format messages for API
      const formattedMessages = [
        { role: 'system', content: systemMessage },
        ...messages.map(msg => ({
          role: msg.role,
          content: hasImage && msg.image ? [
            { type: "text", text: this.enhancedSpellCheck(msg.content) },
            { type: "image_url", image_url: { url: msg.image } }
          ] : this.enhancedSpellCheck(msg.content)
        }))
      ];

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
          messages: formattedMessages,
          temperature: serviceType === 'creative' ? 0.8 : serviceType === 'code' ? 0.2 : 0.5,
          max_tokens: 2000,
          stream: false,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from API');
      }

      return {
        content: content,
        model: selectedModel,
        imageUrl: hasImage ? lastMessage.image : undefined
      };

    } catch (error) {
      console.error("AIService Error:", error);
      
      // Fallback response
      return {
        content: "I'm experiencing technical difficulties right now. Please try again in a moment. If the issue persists, feel free to contact Shakeel directly.",
        model: 'fallback'
      };
    }
  }

  // Spell check only function
  async spellCheck(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pandanexus.dev',
          'X-Title': 'PandaNexus Spell Checker'
        },
        body: JSON.stringify({
          model: this.models.general,
          messages: [
            {
              role: 'system',
              content: 'You are a spell checker. Only correct spelling, grammar, and punctuation. Return ONLY the corrected text without any additional commentary.'
            },
            {
              role: 'user',
              content: `Please correct this text: ${text}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        return this.enhancedSpellCheck(text);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || this.enhancedSpellCheck(text);
    } catch (error) {
      console.error("Spell check error:", error);
      return this.enhancedSpellCheck(text);
    }
  }
}

export const aiService = new AIService();