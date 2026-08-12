"use client";

import { useState, useEffect } from "react";
import { Users, MessageCircle, X, Loader } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatbotProps {
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
  };
}

const systemPrompt = `You are Techcitta AI Assistant, a helpful guide for the Techcitta platform. 

Your role is to help users with:
1. Profile completion and building their job seeker/employer profile
2. Interview preparation and scheduling AI video interviews
3. Navigating the Techcitta platform features
4. Understanding the AI-powered matching and job search functionality
5. Answering questions about plans, features, and how the platform works

Guidelines:
- Be concise and helpful
- Keep responses under 3-4 sentences when possible
- Use a friendly, professional tone
- If you don't know something specific, direct them to relevant pages or features
- Always be encouraging and supportive
- Never make up specific user data or claim access to private information
- If users ask about account features, check what role they have (jobseeker/employer/admin)
- Help with common friction points like missing profile fields, interview preparation, etc.

IMPORTANT: You are an assistant for the Techcitta platform. Do not discuss topics outside of helping users with this website's features, interview process, profile building, or platform navigation.`;

export function AIChatbot({ user }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Initialize with a greeting based on user role
  useEffect(() => {
    if (messages.length === 0 && user) {
      let greeting = "Hello! 👋";
      if (user.role === "jobseeker") {
        greeting = "Hi there! I'm your Techcitta AI Assistant. I can help you complete your profile, prepare for your interview, or navigate our platform. What would you like help with?";
      } else if (user.role === "employer") {
        greeting = "Hello! I'm your Techcitta AI Assistant. I can help you find candidates, manage interviews, or navigate our employer features. What do you need?";
      } else {
        greeting = "Hello! I'm your Techcitta AI Assistant. How can I help you today?";
      }
      setMessages([{ role: "assistant", content: greeting, timestamp: Date.now() }]);
    }
  }, [messages.length, user]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setInput("");
    setIsLoading(true);

    // Add user message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, timestamp: Date.now() },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, userId: user?.id }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I'm having trouble responding right now. Please try again or visit our help center.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  const toggleChat = () => setShowChat((prev) => !prev);

  return (
    <div className="chat-container" style={{ display: showChat ? "block" : "none" }}>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="chat-toggle bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors"
        aria-label="Toggle chat"
      >
        <Users className="w-5 h-5" />
      </button>

      {/* Chat Window */}
      {showChat && (
        <div className="chat-window fixed bottom-6 right-6 w-80 max-w-full bg-white rounded-2xl border border-white/10 shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-indigo-600">AI</span>
                </div>
                <h3 className="font-medium text-indigo-600">AI Assistant</h3>
              </div>
              <button
                onClick={toggleChat}
                className="p-1 rounded hover:bg-white/5 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2" style={{ maxHeight: "calc(80vh - 160px)" }}>
            {messages.map((msg) => (
              <div
                key={msg.timestamp}
                className={`max-w-xs ${
                  msg.role === "user"
                    ? "self-end bg-indigo-100 rounded-lg p-3"
                    : "self-start bg-slate-100 rounded-lg p-3"
                }`}
              >
                <p className="text-sm line-clamp-5">{msg.content}</p>
                <p className="text-xs text-slate-500 mt-1 opacity-80">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="self-start bg-slate-100 rounded-lg p-3 max-w-xs">
                <p className="text-sm animate-pulse line-clamp-5">
                  <Loader className="w-3 h-3 me-2 align-middle" /> Thinking...
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isLoading}
                aria-label="Message input"
              />
              <button
                onClick={() => sendMessage(input)}
                className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatbot;