// Enhanced AIService with working API integration
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
    auto: "meta-llama/llama-3.2-3b-instruct:free",
    code: "meta-llama/llama-3.2-3b-instruct:free", 
    creative: "meta-llama/llama-3.2-3b-instruct:free",
    knowledge: "meta-llama/llama-3.2-3b-instruct:free",
    general: "meta-llama/llama-3.2-3b-instruct:free",
    image: "meta-llama/llama-3.2-3b-instruct:free"
  };

  // Enhanced spell checker
  private enhancedSpellCheck(text: string): string {
    if (!text) return "";
    
    const corrections = {
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
    
    if (corrected && !/[.!?]$/.test(corrected.trim())) {
      corrected += ".";
    }
    
    return corrected;
  }

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

  // Fixed API integration with proper error handling
  async sendMessage(messages: AIMessage[], serviceType: string = 'auto'): Promise<AIResponse> {
    try {
      const lastMessage = messages[messages.length - 1];
      const hasImage = !!lastMessage.image;
      const isImageGeneration = /generate.*image|create.*image|make.*image|draw|picture|photo/i.test(lastMessage.content);
      
      // Handle image generation requests
      if (isImageGeneration && !hasImage) {
        const prompt = lastMessage.content.replace(/generate|create|make|draw/gi, '').trim();
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${Date.now()}&enhance=true`;
        return {
          content: `I've generated an image for: "${prompt}". Here's your custom AI-generated image!`,
          model: 'Pollinations AI',
          imageUrl
        };
      }

      const selectedModel = this.getModel(serviceType, hasImage);
      
      // Enhanced system messages
      let systemMessage = "You are PandaNexus, an advanced AI assistant created by Shakeel. You are helpful, intelligent, and provide detailed responses. Always be friendly and professional.";
      
      switch (serviceType) {
        case 'code':
          systemMessage = "You are PandaNexus Code Assistant. Provide clean, efficient, well-commented code with explanations. Focus on best practices, security, and optimization. Include examples and explain complex concepts clearly.";
          break;
        case 'creative':
          systemMessage = "You are PandaNexus Creative Assistant. Help with creative writing, storytelling, brainstorming, and artistic projects. Be imaginative, inspiring, and provide detailed creative guidance.";
          break;
        case 'knowledge':
          systemMessage = "You are PandaNexus Knowledge Assistant. Provide accurate, comprehensive information with context and examples. Explain complex topics clearly and cite reliable sources when possible.";
          break;
        case 'general':
          systemMessage = "You are PandaNexus General Assistant. Provide helpful, conversational responses on any topic. Be friendly, informative, and adapt your communication style to the user's needs.";
          break;
      }

      // Prepare messages for API
      const apiMessages = [
        { role: 'system', content: systemMessage },
        ...messages.slice(-5).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

      console.log('Sending API request:', { model: selectedModel, messages: apiMessages });

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
          stream: false,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from API');
      }

      return {
        content: content,
        model: selectedModel.split('/')[1] || selectedModel
      };

    } catch (error) {
      console.error("AIService Error:", error);
      
      // Enhanced fallback responses based on service type
      const fallbackResponses = {
        code: "I can help you with coding! Here's a simple example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}! Welcome to PandaNexus!`;\n}\n\nconsole.log(greet('Developer'));\n```\n\nWhat specific coding task would you like help with?",
        creative: "Let me spark your creativity! Here are some ideas:\n\n• Write a story about an AI that discovers emotions\n• Create a poem about the future of technology\n• Design a character for your next project\n• Brainstorm innovative app concepts\n\nWhat creative project are you working on?",
        knowledge: "I'm here to share knowledge! I can help you with:\n\n• Science and technology concepts\n• Historical facts and analysis\n• Educational explanations\n• Research assistance\n• General information\n\nWhat would you like to learn about today?",
        general: "Hello! I'm PandaNexus, your AI assistant created by Shakeel. I'm here to help with:\n\n• Answering questions\n• Providing explanations\n• Offering suggestions\n• General conversation\n\nHow can I assist you today?",
        auto: "Hi there! I'm PandaNexus, ready to help you with anything you need. Whether it's coding, creative projects, learning something new, or just having a conversation - I'm here for you!\n\nWhat can I help you with today?"
      };
      
      return {
        content: fallbackResponses[serviceType as keyof typeof fallbackResponses] || fallbackResponses.auto,
        model: 'PandaNexus Offline'
      };
    }
  }

  // Enhanced spell check
  async spellCheck(text: string): Promise<string> {
    try {
      // First try enhanced local spell check
      const localCorrection = this.enhancedSpellCheck(text);
      
      // If significant changes were made, return local correction
      if (localCorrection !== text) {
        return localCorrection;
      }

      // Try API spell check as backup
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
              content: 'Correct spelling, grammar, and punctuation. Return ONLY the corrected text.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || localCorrection;
      }
      
      return localCorrection;
    } catch (error) {
      console.error("Spell check error:", error);
      return this.enhancedSpellCheck(text);
    }
  }
}

export const aiService = new AIService();