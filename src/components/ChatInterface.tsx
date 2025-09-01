import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ServiceSelector from "./ServiceSelector";
import ContactDialog from "./ContactDialog";
import CodeInterface from "./CodeInterface";
import VercelDeploy from "./VercelDeploy";
import { aiService } from "@/services/aiService";
import { Send, Plus, Copy, Code, MessageCircle, Phone, Mail, Rocket, Image, Sparkles } from "lucide-react";
import PandaLogo from "./PandaLogo";
import { useTheme } from "./ThemeProvider";
import { toast } from "@/components/ui/sonner";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  image?: string;
  imageUrl?: string;
}

type ServiceType = 'auto' | 'code' | 'creative' | 'knowledge' | 'general';

const ChatInterface = () => {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm PandaNexus, your advanced AI assistant created by Shakeel. I can help you with coding, creative projects, knowledge questions, and much more. What would you like to explore today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType>('auto');
  const [showCodeInterface, setShowCodeInterface] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Show code interface
  if (showCodeInterface) {
    return <CodeInterface onBack={() => setShowCodeInterface(false)} />;
  }

  // Enhanced file upload with image preview
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const fileMessage: Message = {
          id: Date.now().toString(),
          content: "I've uploaded an image. Can you analyze it?",
          role: 'user',
          timestamp: new Date(),
          image: imageUrl
        };
        setMessages(prev => [...prev, fileMessage]);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileMessage: Message = {
          id: Date.now().toString(),
          content: `File content:\n\n${e.target?.result as string}`,
          role: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fileMessage]);
      };
      reader.readAsText(file);
    }
  };

  // Enhanced spell check
  const handleSpellCheck = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    try {
      const correctedText = await aiService.spellCheck(inputValue);
      setInputValue(correctedText);
      toast("Text corrected!", {
        description: "Spelling and grammar have been improved",
        duration: 2000,
      });
    } catch (error) {
      console.error("Spell check failed:", error);
      toast("Spell check failed", {
        description: "Please try again",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced message submission with proper API integration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare conversation history for AI
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
        image: m.image
      }));

      const response = await aiService.sendMessage(conversationHistory, selectedService);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        imageUrl: response.imageUrl
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please check your internet connection and try again. If the issue persists, contact Shakeel for support.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast("Message copied!", {
        description: "Content copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast("Copy failed", {
        description: "Please try again",
        duration: 2000,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Enhanced Responsive Header */}
      <Card className="border-0 border-b border-glass-border bg-gradient-glass backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <PandaLogo className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-text bg-clip-text text-transparent truncate">
                PandaNexus
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">AI Hub • Lightning Fast</p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {/* Code Interface Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeInterface(true)}
              className="h-8 w-8 md:w-auto md:px-3 bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300"
            >
              <Code className="w-4 h-4" />
              <span className="hidden md:inline ml-1">Code</span>
            </Button>
            
            {/* Deploy Button */}
            <VercelDeploy>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 md:w-auto md:px-3 bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300"
              >
                <Rocket className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Deploy</span>
              </Button>
            </VercelDeploy>
            
            {/* Contact Button */}
            <ContactDialog>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 md:w-auto md:px-3 bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Contact</span>
              </Button>
            </ContactDialog>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 px-0 shrink-0"
            >
              {theme === 'dark' ? "☀️" : "🌙"}
            </Button>
          </div>
        </div>
        
        {/* Service Selector - Mobile Responsive */}
        <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3">
          <ServiceSelector
            selectedService={selectedService}
            onServiceChange={setSelectedService}
            className="w-full"
          />
        </div>
      </Card>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
        {messages.map((message) => (
          <div key={message.id} className="relative group">
            <ChatMessage message={message} />
            {/* Copy Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyMessage(message.content)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0 bg-gradient-glass border border-glass-border hover:shadow-glow"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area - Mobile Optimized */}
      <Card className="border-0 border-t border-glass-border bg-gradient-glass backdrop-blur-xl m-2 sm:m-3 md:m-4 md:mt-0 shrink-0">
        <form onSubmit={handleSubmit} className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
          {/* Quick Actions - Mobile Responsive */}
          <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1">
            {[
              { text: "Help me code", icon: Code },
              { text: "Generate image", icon: Image },
              { text: "Creative writing", icon: Sparkles },
              { text: "Explain concept", icon: MessageCircle }
            ].map(action => (
              <Button
                key={action.text}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(action.text)}
                className="text-xs whitespace-nowrap bg-gradient-glass border-glass-border hover:shadow-glow shrink-0"
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.text}
              </Button>
            ))}
          </div>

          {/* Input Row */}
          <div className="flex items-end gap-2 sm:gap-3">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 h-9 w-9 md:h-10 md:w-10 font-bold text-lg bg-gradient-glass border-glass-border hover:shadow-glow"
            >
              +
            </Button>

            {/* Input Field */}
            <div className="flex-1 min-w-0">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={`Ask PandaNexus anything...`}
                className="bg-input/50 border-glass-border backdrop-blur-sm focus:ring-2 focus:ring-primary/20 text-sm md:text-base"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
            </div>

            {/* Spell Check Button */}
            <Button
              type="button"
              onClick={handleSpellCheck}
              variant="outline"
              size="icon"
              disabled={isLoading || !inputValue.trim()}
              className="shrink-0 h-9 md:h-10 w-9 md:w-10 bg-gradient-glass border-glass-border hover:shadow-glow"
            >
              ✨
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 shrink-0 h-9 md:h-10 w-9 md:w-10 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Mobile Helper Text */}
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Press Enter to send • ✨ for spell check • + to upload files
          </p>
        </form>
      </Card>
    </div>
  );
};

export default ChatInterface;