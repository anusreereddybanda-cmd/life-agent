import React from 'react';
import { Trophy, Star, Target, Medal } from 'lucide-react';

export default function AchievementsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">My Achievements</h1>
        <p className="text-ink-400">Moments of pride and hard work.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AchievementCard 
          icon={<Trophy className="text-amber-500" size={28} />}
          title="Best UI Design Award"
          date="November 2022"
          org="Creative Tech Inc."
          desc="Awarded for the complete overhaul of the internal dashboard system, improving task efficiency by 40%."
        />
        <AchievementCard 
          icon={<Medal className="text-indigo-500" size={28} />}
          title="BFA with Honors"
          date="June 2018"
          org="University of Washington"
          desc="Graduated Cum Laude. Senior thesis project featured in the annual design exhibition."
        />
        <AchievementCard 
          icon={<Star className="text-rose-500" size={28} />}
          title="10k Marathon Finisher"
          date="April 2021"
          org="Seattle Spring Run"
          desc="Finished my first 10k run after 3 months of training. Time: 58:20."
        />
        <AchievementCard 
          icon={<Target className="text-emerald-500" size={28} />}
          title="Design Systems Certification"
          date="January 2020"
          org="UX Institute"
          desc="Completed advanced certification in building and maintaining scalable design systems."
        />
      </div>
    </div>
  );
}

function AchievementCard({ icon, title, date, org, desc }: { icon: React.ReactNode, title: string, date: string, org: string, desc: string }) {
  return (
    <div className="glass-panel p-6 border-l-4 border-l-sage-400 flex flex-col h-full group hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-cream-50 p-3 rounded-xl border border-cream-200">
          {icon}
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-cream-200 text-ink-600 rounded-full">
          {date}
        </span>
      </div>
      <h3 className="text-xl font-serif font-bold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm font-medium text-sage-600 mb-4">{org}</p>
      <p className="text-ink-500 text-sm leading-relaxed flex-grow">{desc}</p>
    </div>
  );
}
