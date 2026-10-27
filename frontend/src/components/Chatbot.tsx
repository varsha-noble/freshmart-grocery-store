import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Calculator,
  RefreshCw,
  Scale,
  IndianRupee,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage, Product } from '../types/grocery.ts';
import { sendChatMessage } from '../services/api.ts';

interface ChatbotProps {
  externalPrompt?: { product: Product; prompt: string } | null;
  onClearExternalPrompt?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'Price of 500g sugar?',
  'How much sugar for 10 rupees?',
  'Price of 250ml sunflower oil?',
  'How much milk for 20 rupees?',
  'Price of 6 eggs?',
  'What staples do you have in stock?',
];

export const Chatbot: React.FC<ChatbotProps> = ({
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "👋 Welcome to **FreshMart**! I'm your AI Price & Unit Conversion Assistant directly connected to our MongoDB inventory database.\n\nAll items in our database store base rates (e.g. 1kg, 1 liter, 1 dozen). I can perform live unit conversions and budget calculations for you! Try asking below:",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle trigger from card "Ask AI Price"
  useEffect(() => {
    if (externalPrompt) {
      setIsOpen(true);
      handleSend(externalPrompt.prompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calculation: response.calculation,
        matchedProduct: response.matchedProduct,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I encountered an issue fetching data from the database. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: "Chat cleared! Ask me for any grocery item price, custom weight/volume, or budget calculation (e.g. *'How much sugar for 10 rupees'*).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON - Placed in the RIGHT SIDE CORNER */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-stone-900 hover:bg-emerald-800 text-white rounded-2xl shadow-xl shadow-stone-900/20 transition-all duration-300 hover:scale-105 cursor-pointer border border-stone-800"
            aria-label="Open Grocery AI Assistant"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900 animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <span className="block text-xs font-bold leading-tight font-['Outfit']">
                Store AI Assistant
              </span>
              <span className="block text-[10px] text-stone-300 leading-tight">
                Pricing & Unit Converter
              </span>
            </div>
          </button>
        ) : null}

        {/* EXPANDED CHAT PANEL ON THE RIGHT SIDE CORNER */}
        {isOpen && (
          <div className="w-[360px] sm:w-[400px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-['Outfit']">FreshMart AI</h3>
                </div>
              </div>

              <div className="flex items-center gap-1 text-stone-400">
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-1.5 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Chips Bar */}
            <div className="bg-stone-50 border-b border-stone-200/70 p-2 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5">
                {DEFAULT_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sugg)}
                    disabled={isLoading}
                    className="shrink-0 text-[11px] px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-stone-900 text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    {/* Plain or Markdown-rendered text */}
                    <div className="whitespace-pre-line space-y-1">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>
                          {paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? (
                              <strong key={cIdx} className="font-semibold text-emerald-700">
                                {chunk}
                              </strong>
                            ) : (
                              chunk
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Dedicated Unit Conversion Breakdown Card */}
                    {msg.calculation && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 bg-emerald-50/80 -mx-1 p-2.5 rounded-xl border border-emerald-200/70">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900 mb-1">
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-emerald-700" />
                            {msg.calculation.calculationType === 'price_for_quantity'
                              ? 'Quantity Pricing Match'
                              : 'Budget Quantity Match'}
                          </span>
                          <span className="font-mono text-emerald-700">
                            Base: ₹{msg.calculation.product.price}/{msg.calculation.product.unit}
                          </span>
                        </div>

                        <div className="text-base font-extrabold text-stone-900 font-['Outfit']">
                          {msg.calculation.calculationType === 'price_for_quantity'
                            ? `${msg.calculation.requestedQuantity} ${msg.calculation.requestedUnit} = ${msg.calculation.priceFormatted}`
                            : `₹${msg.calculation.budgetAmount} = ${msg.calculation.displayQuantity}`}
                        </div>

                        <div className="mt-1 text-[11px] font-mono text-stone-600 bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                          {msg.calculation.breakdown}
                        </div>
                      </div>
                    )}

                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        msg.sender === 'user' ? 'text-stone-400' : 'text-stone-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-center text-xs text-stone-500">
                  <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 text-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2 text-xs flex items-center gap-2 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-stone-400">Querying MongoDB & calculating math...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask e.g. '500g sugar price' or 'how much for 10 rs'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 text-xs px-3.5 py-2.5 bg-stone-100 hover:bg-stone-100/80 focus:bg-white rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
