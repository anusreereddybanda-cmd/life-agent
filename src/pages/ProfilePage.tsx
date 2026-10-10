import { Camera, MapPin, Briefcase, GraduationCap, Calendar, Heart } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">My Profile</h1>
        <p className="text-ink-400">The story of who I am.</p>
      </header>

      <div className="glass-panel p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-polaroid rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button className="flex items-center space-x-2 text-sm text-sage-600 hover:text-sage-700 font-medium">
              <Camera size={16} />
              <span>Update Photo</span>
            </button>
          </div>

          <div className="flex-1 w-full space-y-8">
            <div className="border-b border-cream-300 pb-6">
              <h2 className="text-3xl font-serif mb-2">Jane Doe</h2>
              <div className="flex flex-wrap gap-4 text-ink-400">
                <span className="flex items-center gap-1.5"><MapPin size={16}/> Seattle, WA</span>
                <span className="flex items-center gap-1.5"><Calendar size={16}/> Born Oct 15, 1995</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-serif flex items-center gap-2 text-sage-700">
                  <Briefcase size={20} /> Profession
                </h3>
                <div className="bg-cream-50 p-4 rounded-lg border border-cream-200">
                  <p className="font-medium text-ink-500">Senior UX Designer</p>
                  <p className="text-sm text-ink-400">Creative Tech Inc. • 2021 - Present</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-serif flex items-center gap-2 text-sage-700">
                  <GraduationCap size={20} /> Education
                </h3>
                <div className="bg-cream-50 p-4 rounded-lg border border-cream-200">
                  <p className="font-medium text-ink-500">BFA Interaction Design</p>
                  <p className="text-sm text-ink-400">University of Washington • 2014 - 2018</p>
                </div>
              </div>
              
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xl font-serif flex items-center gap-2 text-sage-700">
                  <Heart size={20} /> About Me
                </h3>
                <div className="bg-cream-50 p-6 rounded-lg border border-cream-200">
                  <p className="text-ink-500 leading-relaxed">
                    I'm a designer who loves capturing moments and telling stories through digital mediums. 
                    In my free time, I enjoy hiking, watercolor painting, and collecting vintage cameras. 
                    This space is dedicated to remembering the little things that make life beautiful.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
               <button className="btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
