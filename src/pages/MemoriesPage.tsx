import { PenSquare, BookOpen } from 'lucide-react';

export default function MemoriesPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <header className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-4xl font-serif text-sage-800 mb-2">My Memories</h1>
          <p className="text-ink-400">Chapters of my life, written by me.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <PenSquare size={20} />
          <span>New Entry</span>
        </button>
      </header>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {['All', 'School', 'College', 'Family', 'Travel', 'Thoughts'].map((category, idx) => (
          <button 
            key={category}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              idx === 0 
                ? 'bg-sage-600 text-white shadow-sm' 
                : 'bg-cream-100 text-ink-500 hover:bg-cream-200 border border-cream-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <MemoryCard 
          date="August 12, 2014"
          category="College"
          title="First Day at University"
          content="The campus was huge, and I felt completely lost. I remember walking into the wrong lecture hall and sitting through 20 minutes of Advanced Physics before realizing. Met Sarah at the campus cafe later, which made the day much better. The start of a new chapter!"
        />
        <MemoryCard 
          date="June 05, 2018"
          category="Travel"
          title="Summer in Kyoto"
          content="We visited the bamboo forest early in the morning. The light filtering through the tall green stalks was magical. The air felt completely different there. We spent the afternoon wandering through small streets and trying local sweets."
        />
        <MemoryCard 
          date="December 24, 2020"
          category="Family"
          title="Christmas Eve Dinner"
          content="Mom made her famous roast. The whole family was together for the first time in three years. We stayed up until 2 AM playing board games and laughing until our sides hurt. These are the moments I want to hold on to forever."
        />
        <MemoryCard 
          date="March 15, 2010"
          category="School"
          title="Winning the Science Fair"
          content="I couldn't believe it when they called my name. My volcano project actually won first place! Mr. Davis was so proud. I still have the blue ribbon saved in my old memory box at home."
        />
      </div>
    </div>
  );
}

function MemoryCard({ date, category, title, content }: { date: string, category: string, title: string, content: string }) {
  return (
    <div className="glass-panel p-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-full bg-sage-300 group-hover:bg-sage-500 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-sage-600 bg-sage-50 px-3 py-1 rounded-full border border-sage-100">
          {category}
        </span>
        <span className="text-sm text-ink-400 font-serif italic">{date}</span>
      </div>
      <h3 className="text-2xl font-serif text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-500 leading-relaxed font-sans">{content}</p>
      <div className="mt-6 pt-4 border-t border-cream-200 flex justify-end">
        <button className="text-sage-600 hover:text-sage-800 text-sm font-medium flex items-center gap-1">
          <BookOpen size={16} /> Read full entry
        </button>
      </div>
    </div>
  );
}
