import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import VercelDeploy from "./VercelDeploy";
import { aiService } from "@/services/aiService";
import { Send, Code, Terminal, FileCode, Zap, Copy, Download, ArrowLeft, Rocket, Play } from "lucide-react";
import PandaLogo from "./PandaLogo";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  code?: string;
  language?: string;
}

interface CodeInterfaceProps {
  onBack: () => void;
}

const CodeInterface = ({ onBack }: CodeInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "🚀 Welcome to PandaNexus Code Studio! I'm your AI coding assistant. I can help you write, debug, optimize, and deploy code. What would you like to build today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { value: "javascript", label: "JavaScript", icon: "🟨" },
    { value: "typescript", label: "TypeScript", icon: "🔷" },
    { value: "python", label: "Python", icon: "🐍" },
    { value: "react", label: "React", icon: "⚛️" },
    { value: "nodejs", label: "Node.js", icon: "🟢" },
    { value: "html", label: "HTML", icon: "🌐" },
    { value: "css", label: "CSS", icon: "🎨" },
    { value: "sql", label: "SQL", icon: "🗄️" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Code copied to clipboard!", {
        description: "Ready to paste in your editor",
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast("Copy failed", {
        description: "Please select and copy manually",
        duration: 2000,
      });
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast("Code downloaded!", {
      description: `Saved as ${filename}`,
      duration: 2000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const codePrompt = `[CODING REQUEST - ${selectedLanguage.toUpperCase()}]\n\n${inputValue}\n\nPlease provide clean, well-commented code with explanations. Include best practices and optimization tips.`;

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
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      console.log('Sending code request...');
      const response = await aiService.sendMessage(conversationHistory, 'code');
      console.log('Code response received:', response);

      // Extract code blocks from response
      const codeMatch = response.content.match(/```(\w+)?\n([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[2] : '';
      const language = codeMatch ? codeMatch[1] || selectedLanguage : selectedLanguage;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        code: code,
        language: language
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      toast("Code generated!", {
        description: `${language} code ready`,
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Code generation error:', error);
      
      // Provide helpful fallback code examples
      const fallbackCode = {
        javascript: `// JavaScript Example\nfunction greetUser(name) {\n  return \`Hello, \${name}! Welcome to PandaNexus!\`;\n}\n\nconsole.log(greetUser('Developer'));`,
        typescript: `// TypeScript Example\ninterface User {\n  name: string;\n  email: string;\n}\n\nfunction createUser(userData: User): User {\n  return {\n    ...userData,\n    createdAt: new Date()\n  };\n}`,
        python: `# Python Example\ndef greet_user(name: str) -> str:\n    return f"Hello, {name}! Welcome to PandaNexus!"\n\nprint(greet_user("Developer"))`,
        react: `// React Component Example\nimport React from 'react';\n\nconst Welcome = ({ name }) => {\n  return (\n    <div className="p-4">\n      <h1>Hello, {name}!</h1>\n      <p>Welcome to PandaNexus!</p>\n    </div>\n  );\n};\n\nexport default Welcome;`
      };

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Here's a ${selectedLanguage} example to get you started:`,
        role: 'assistant',
        timestamp: new Date(),
        code: fallbackCode[selectedLanguage as keyof typeof fallbackCode] || fallbackCode.javascript,
        language: selectedLanguage
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast("Using offline examples", {
        description: "Code examples provided",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Mobile-First Header */}
      <Card className="border-0 border-b border-glass-border bg-gradient-glass backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-accent/20 h-8 w-8 p-0 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <PandaLogo className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-text bg-clip-text text-transparent flex items-center gap-2">
                  <Code className="w-4 h-4 shrink-0" />
                  <span className="truncate">Code Studio</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Development</p>
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="flex items-center gap-2 shrink-0">
            <VercelDeploy>
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300"
              >
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Deploy</span>
              </Button>
            </VercelDeploy>
            
            <Badge variant="outline" className="bg-gradient-glass border-glass-border hidden md:flex">
              <Terminal className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>
        
        {/* Language Selector - Mobile Responsive */}
        <div className="px-3 md:px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {languages.map(lang => (
              <Button
                key={lang.value}
                variant={selectedLanguage === lang.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLanguage(lang.value)}
                className={cn(
                  "shrink-0 h-8 px-3 text-xs bg-gradient-glass border-glass-border hover:shadow-glow transition-all duration-300",
                  selectedLanguage === lang.value && "bg-gradient-primary text-primary-foreground"
                )}
              >
                <span className="mr-1">{lang.icon}</span>
                {lang.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Code Messages - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4 min-h-0">
        {messages.map((message) => (
          <div key={message.id}>
            <ChatMessage message={message} />
            
            {/* Enhanced Code Block - Mobile Responsive */}
            {message.code && (
              <Card className="mt-3 bg-gradient-glass border-glass-border shadow-glass overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-glass-border bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{message.language}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {message.code.split('\n').length} lines
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(message.code!)}
                      className="h-7 w-7 sm:w-auto sm:px-2 p-0 sm:p-2"
                    >
                      <Copy className="w-3 h-3" />
                      <span className="hidden sm:inline ml-1">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCode(message.code!, `code.${message.language}`)}
                      className="h-7 w-7 sm:w-auto sm:px-2 p-0 sm:p-2"
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline ml-1">Save</span>
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <pre className="p-3 md:p-4 overflow-x-auto text-xs sm:text-sm bg-muted/10 max-h-96">
                    <code className="text-foreground">{message.code}</code>
                  </pre>
                  <div className="absolute top-2 right-2 opacity-50">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area - Mobile First */}
      <Card className="border-0 border-t border-glass-border bg-gradient-glass backdrop-blur-xl m-2 md:m-4 md:mt-0 shrink-0">
        <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3">
          {/* Quick Actions - Mobile Responsive */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              "Create a React component",
              "Debug this code", 
              "Optimize performance",
              "Add error handling",
              "Write unit tests"
            ].map(action => (
              <Button
                key={action}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(action)}
                className="text-xs whitespace-nowrap bg-gradient-glass border-glass-border hover:shadow-glow shrink-0 h-8"
              >
                {action}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={`Describe your ${selectedLanguage} coding task...`}
                className="min-h-[80px] bg-input/50 border-glass-border backdrop-blur-sm focus:ring-2 focus:ring-primary/20 resize-none text-sm"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Press Ctrl+Enter to send • Use natural language to describe what you want to build
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 h-12 w-12 sm:w-auto sm:px-6 shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Generate</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CodeInterface;