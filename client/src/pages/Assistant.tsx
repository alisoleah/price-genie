import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Assistant() {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations } = trpc.assistant.conversations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: messages } = trpc.assistant.getMessages.useQuery(
    { conversationId: conversationId! },
    { enabled: conversationId !== null }
  );

  const createConversationMutation = trpc.assistant.createConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      utils.assistant.conversations.invalidate();
    },
  });

  const sendMessageMutation = trpc.assistant.sendMessage.useMutation({
    onSuccess: () => {
      utils.assistant.getMessages.invalidate();
      setMessage("");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Create initial conversation if none exists
    if (isAuthenticated && !conversationId && conversations && conversations.length === 0) {
      createConversationMutation.mutate({ title: "Shopping Assistant" });
    } else if (conversations && conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [isAuthenticated, conversations, conversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    sendMessageMutation.mutate({
      conversationId,
      message: message.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container py-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </header>

        <div className="container py-12 text-center">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login to use AI Assistant</h2>
          <p className="text-muted-foreground mb-6">
            Get personalized shopping recommendations and product suggestions
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">AI Shopping Assistant</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-4">
          {/* Welcome Message */}
          {(!messages || messages.length === 0) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg">Welcome to PriceGenie Assistant!</h3>
                </div>
                <p className="text-muted-foreground">
                  I can help you find the best prices and optimize your shopping. Try asking:
                </p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="mr-2">
                    "Find me the cheapest iPhone 13"
                  </Badge>
                  <Badge variant="secondary" className="mr-2">
                    "I need keto groceries under 200 AED"
                  </Badge>
                  <Badge variant="secondary">
                    "Compare milk prices across platforms"
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </CardContent>
              </Card>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="container py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask me anything about shopping..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 h-12"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="lg" 
              className="px-6"
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
