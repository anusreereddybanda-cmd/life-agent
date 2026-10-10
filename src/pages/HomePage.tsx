import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Bot, Image as ImageIcon, GraduationCap, Heart, Star, Compass } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="animate-in fade-in duration-1000">
      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32 px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between min-h-[90vh]">
        {/* Text Content */}
        <div className="lg:w-1/2 z-10 flex flex-col space-y-6 md:space-y-8 pr-0 lg:pr-8 max-w-2xl mx-auto lg:mx-0">
          <div className="inline-flex items-center self-start gap-2 px-4 py-1.5 bg-cream-200/50 rounded-full border border-cream-300 text-ink-500 text-sm font-medium tracking-wide shadow-sm">
            <Star size={14} className="text-amber-600" />
            Your story, beautifully preserved
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif text-ink-900 leading-[1.1] tracking-tight">
            Every moment <br className="hidden sm:block" /> 
            <span className="text-sage-700 italic">deserves a place.</span>
          </h1>
          <p className="text-lg md:text-xl text-ink-500 font-serif leading-relaxed max-w-lg">
            Preserve your life's memories, milestones, photographs, and personal stories in an elegant digital scrapbook designed just for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 sm:pt-6">
            <Link to="/memories" className="w-full sm:w-auto px-8 py-4 bg-ink-900 text-white rounded-full font-medium hover:bg-sage-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              Begin Your Story <ChevronRight size={18} />
            </Link>
            <Link to="/gallery" className="w-full sm:w-auto px-8 py-4 bg-white border border-cream-300 text-ink-900 rounded-full font-medium hover:bg-cream-100 transition-colors flex items-center justify-center text-center">
              Explore Memories
            </Link>
          </div>
        </div>

        {/* Hero Collage */}
        <div className="lg:w-1/2 relative h-[400px] md:h-[500px] lg:h-[600px] w-full mt-16 lg:mt-0 flex items-center justify-center">
          <div className="relative w-full max-w-md h-full flex items-center justify-center">
            {/* Polaroid 1 (Left/Back) */}
            <div className="absolute left-0 md:-left-12 lg:-left-20 top-[10%] md:top-[15%] w-48 md:w-56 lg:w-64 p-3 md:p-4 bg-white shadow-polaroid rounded-sm rotate-[-8deg] z-10 hover:rotate-[-4deg] transition-transform duration-500 hover:z-40">
              <div className="aspect-[4/5] overflow-hidden mb-3 md:mb-4 bg-cream-100">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" alt="Memory" className="w-full h-full object-cover sepia-[.15]" />
              </div>
              <p className="font-serif text-center text-ink-800 text-base md:text-lg">Kyoto, 2018</p>
            </div>
            {/* Polaroid 2 (Right/Middle) */}
            <div className="absolute right-0 md:-right-8 lg:-right-12 top-[5%] md:top-[10%] w-56 md:w-64 lg:w-72 p-4 md:p-5 bg-white shadow-polaroid rounded-sm rotate-[10deg] z-20 hover:rotate-[6deg] transition-transform duration-500 hover:z-40">
              <div className="aspect-square overflow-hidden mb-3 md:mb-4 bg-cream-100">
                <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80" alt="Graduation" className="w-full h-full object-cover sepia-[.05]" />
              </div>
              <p className="font-serif text-center text-ink-800 text-lg md:text-xl">Graduation Day</p>
            </div>
            {/* Polaroid 3 (Bottom Center/Front) */}
            <div className="absolute bottom-[5%] md:bottom-[10%] left-[15%] md:left-[20%] w-52 md:w-60 lg:w-64 p-3 md:p-4 bg-white shadow-[0_12px_30px_-5px_rgba(0,0,0,0.15)] rounded-sm rotate-[-3deg] z-30 hover:rotate-[0deg] transition-transform duration-500 hover:z-40 border border-cream-100">
              <div className="aspect-[3/4] overflow-hidden mb-3 md:mb-4 bg-cream-100">
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80" alt="Lake" className="w-full h-full object-cover" />
              </div>
              <p className="font-serif text-center text-ink-800 text-base md:text-lg">Summer by the lake</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Life journey preview */}
      <section className="py-24 px-6 md:px-12 bg-cream-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-ink-900">A life made of little moments.</h2>
            <p className="text-lg text-ink-500 font-serif max-w-2xl mx-auto">Organize your memories into beautiful chapters that reflect the different eras of your journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <JourneyCard title="School Days" icon={<GraduationCap />} image="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80" link="/memories" />
            <JourneyCard title="College Life" icon={<ImageIcon />} image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80" link="/memories" />
            <JourneyCard title="Family & Friends" icon={<Heart />} image="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80" link="/memories" />
            <JourneyCard title="Adventures" icon={<Compass />} image="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80" link="/memories" />
          </div>
        </div>
      </section>

      {/* 4. Timeline preview */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-ink-900">Your story, chapter by chapter.</h2>
          <p className="text-lg text-ink-500 font-serif">Visualize your milestones beautifully arranged in time. <span className="italic opacity-70">(Sample view)</span></p>
        </div>
        
        <div className="relative border-l-2 border-sage-300 ml-4 md:ml-1/2 space-y-12 pb-8">
          <TimelineItem year="2014" title="Graduated High School" desc="Valedictorian of the senior class." />
          <TimelineItem year="2018" title="First Solo Trip" desc="Backpacking across Europe for two months." />
          <TimelineItem year="2021" title="Moved to the City" desc="Started my first full-time role as a designer." />
        </div>
        
        <div className="text-center mt-12">
          <Link to="/timeline" className="inline-flex items-center gap-2 text-sage-700 font-medium hover:text-sage-900 underline underline-offset-4 decoration-sage-300">
            View full timeline <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* 5. Personal AI section */}
      <section className="py-24 px-6 md:px-12 bg-white border-y border-cream-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-50 rounded-full border border-sage-200 text-sage-700 text-sm font-medium">
              <Bot size={16} /> Demo feature
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-ink-900">Meet your personal memory companion.</h2>
            <p className="text-lg text-ink-500">
              The MyLife AI Agent helps you seamlessly find, organize, and recall memories using natural language. 
              Looking for a specific photo from years ago? Just ask.
            </p>
            <ul className="space-y-3 mt-4 text-ink-600 font-medium">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-sage-500"></div> "Show my college memories"</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-sage-500"></div> "Find photos from my 25th birthday"</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-sage-500"></div> "Add this trip to my timeline"</li>
            </ul>
            <Link to="/agent" className="inline-block mt-4 px-6 py-3 bg-cream-200 text-ink-900 rounded-full font-medium hover:bg-cream-300 transition-colors">
              Try the Demo
            </Link>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="bg-cream-50 rounded-2xl p-6 shadow-soft border border-cream-200">
              <div className="flex gap-4 mb-6 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-sage-200 flex-shrink-0 flex items-center justify-center text-sage-800 font-medium">You</div>
                <div className="bg-sage-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                  Show my college memories from sophomore year.
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-cream-300 flex-shrink-0 flex items-center justify-center text-ink-600"><Bot size={20}/></div>
                <div className="bg-white border border-cream-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-ink-700">I found 12 memories from your sophomore year. Here's a photo you saved from the winter festival:</p>
                  <div className="mt-3 w-40 h-32 bg-cream-200 rounded-lg overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80" alt="Winter" className="w-full h-full object-cover opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing section */}
      <section className="py-32 px-6 text-center">
        <h2 className="text-5xl font-serif text-ink-900 mb-8">Your memories belong <br/> <span className="italic text-sage-700">somewhere special.</span></h2>
        <Link to="/memories" className="inline-flex items-center gap-2 px-10 py-5 bg-ink-900 text-white rounded-full text-lg font-medium hover:bg-sage-800 transition-colors shadow-xl hover:-translate-y-1 transform duration-300">
          Start Your Journey
        </Link>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-cream-200 bg-white py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-sage-600" />
            <span className="text-xl font-serif font-bold text-ink-900 italic">MyLife</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-ink-500">
            <Link to="/" className="hover:text-sage-600">Home</Link>
            <Link to="/memories" className="hover:text-sage-600">Memories</Link>
            <Link to="/settings" className="hover:text-sage-600">Privacy & Settings</Link>
          </div>
          <p className="text-sm text-ink-400">© 2026 MyLife Archive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function JourneyCard({ title, icon, image, link }: { title: string, icon: React.ReactNode, image: string, link: string }) {
  return (
    <Link to={link} className="group block relative h-80 rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
        <div className="mb-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-2xl font-serif mb-1">{title}</h3>
        <p className="text-sm text-white/80 font-medium group-hover:translate-x-1 transition-transform">Explore chapter →</p>
      </div>
    </Link>
  );
}

function TimelineItem({ year, title, desc }: { year: string, title: string, desc: string }) {
  return (
    <div className="relative pl-10 md:pl-0 md:w-1/2 md:pr-12 md:text-right group">
      <div className="absolute left-[-9px] md:left-auto md:-right-[9px] top-1 w-4 h-4 rounded-full bg-sage-300 border-2 border-cream-50 group-hover:bg-sage-600 transition-colors z-10"></div>
      <span className="block text-sm font-bold text-sage-600 mb-1">{year}</span>
      <h4 className="text-2xl font-serif text-ink-900 mb-2">{title}</h4>
      <p className="text-ink-500">{desc}</p>
    </div>
  );
}
