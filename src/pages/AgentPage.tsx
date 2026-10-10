import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function AgentPage() {
  const [query, setQuery] = useState('');
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-120px)] flex flex-col">
      <header className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-sage-100 rounded-full text-sage-600">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-sage-800">MyLife Assistant</h1>
          <p className="text-ink-400 text-sm flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500"/> Demo Mode - Backend not connected
          </p>
        </div>
      </header>

      <div className="flex-1 glass-panel p-6 flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-20">
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600">
              <Bot size={18} />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-cream-200 max-w-[80%]">
              <p className="text-ink-600">Hello Jane! I'm your MyLife assistant. I can help you organize memories, find old photos, or update your timeline. What would you like to do today?</p>
            </div>
          </div>

          <div className="flex gap-4 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0 text-ink-600">
              <UserIcon size={18} />
            </div>
            <div className="bg-sage-600 p-4 rounded-2xl rounded-tr-none shadow-sm text-white max-w-[80%]">
              <p>Find the photos I saved for my graduation.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sage-600">
              <Bot size={18} />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-cream-200 max-w-[80%]">
              <p className="text-ink-600 mb-3">I found 1 photo from your graduation in May 2018:</p>
              <div className="w-48 h-48 rounded-lg overflow-hidden border border-cream-200">
                <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=400&q=80" alt="Graduation" className="w-full h-full object-cover"/>
              </div>
            </div>
          </div>
          
        </div>

        {/* Input Area */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything... (e.g. 'Summarize my college journey')"
              className="w-full bg-white/90 backdrop-blur-sm border-2 border-cream-200 rounded-full py-4 pl-6 pr-14 shadow-sm focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-100 transition-all"
            />
            <button className="absolute right-2 top-2 p-2 bg-sage-500 text-white rounded-full hover:bg-sage-600 transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
