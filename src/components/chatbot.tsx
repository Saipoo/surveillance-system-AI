"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { getContextualHelp } from "@/ai/flows/provide-contextual-help";
import { useSidebar } from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { state: sidebarState } = useSidebar();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { helpText } = await getContextualHelp({ featureName: input });
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: helpText,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching help:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: "Sorry, I couldn't fetch help for that topic. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen) {
        setMessages([
            {
                id: 1,
                role: 'assistant',
                text: "Hello! I'm GuardianEye's assistant. How can I help you today? You can ask me things like 'How to use Uniform Detection?' or 'Tell me about the attendance system'."
            }
        ])
    }
  }, [isOpen])

  const triggerButton =
    sidebarState === "expanded" ? (
      <Button variant="outline" className="w-full justify-start text-base py-6">
        <Bot className="mr-2" />
        AI Assistant
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Bot />
        <span className="sr-only">AI Assistant</span>
      </Button>
    );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px] h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="text-accent" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me anything about GuardianEye's features.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
          <div className="pr-4 space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Thinking...</span>
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., How does mask detection work?"
              autoComplete="off"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
