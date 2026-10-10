import { Briefcase, GraduationCap, Star, MapPin } from 'lucide-react';

export default function TimelinePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">My Timeline</h1>
        <p className="text-ink-400">The milestones that shaped my journey.</p>
      </header>

      <div className="relative max-w-3xl mx-auto">
        {/* Vertical Line */}
        <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-cream-300"></div>

        <div className="space-y-12">
          <TimelineEvent 
            year="2021"
            title="Started as Senior UX Designer"
            description="Joined Creative Tech Inc. to lead the redesign of their core product suite."
            icon={<Briefcase size={20} />}
            align="right"
          />
          <TimelineEvent 
            year="2019"
            title="Moved to Seattle"
            description="Packed my bags and moved across the country for a new adventure and job opportunity."
            icon={<MapPin size={20} />}
            align="left"
          />
          <TimelineEvent 
            year="2018"
            title="Graduated University"
            description="Earned my BFA in Interaction Design with honors from the University of Washington."
            icon={<GraduationCap size={20} />}
            align="right"
          />
          <TimelineEvent 
            year="2016"
            title="Studied Abroad in Japan"
            description="Spent six months in Tokyo learning about eastern design philosophies and culture."
            icon={<Star size={20} />}
            align="left"
          />
          <TimelineEvent 
            year="2014"
            title="Started College"
            description="Began my journey at UW. Met my best friends in the dorms on the first day."
            icon={<GraduationCap size={20} />}
            align="right"
          />
        </div>
      </div>
    </div>
  );
}


function TimelineEvent({ year, title, description, icon, align }: { year: string, title: string, description: string, icon: React.ReactNode, align: 'left' | 'right' }) {
  const isLeft = align === 'left';
  
  return (
    <div className={`relative flex items-center justify-between md:justify-normal w-full ${isLeft ? 'md:flex-row-reverse' : ''}`}>
      <div className="hidden md:block w-5/12"></div>
      
      {/* Center Dot */}
      <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-sage-100 border-4 border-white shadow-sm z-10 text-sage-600">
        {icon}
      </div>

      <div className={`w-full pl-16 md:pl-0 md:w-5/12 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
        <div className="glass-panel p-6 hover:shadow-md transition-shadow">
          <span className="inline-block px-3 py-1 bg-cream-200 text-ink-600 font-serif font-bold text-sm rounded-full mb-3">
            {year}
          </span>
          <h3 className="text-xl font-serif text-ink-900 mb-2">{title}</h3>
          <p className="text-ink-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
