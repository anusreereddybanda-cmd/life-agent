import { Plus } from 'lucide-react';

export default function GalleryPage() {
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80', caption: 'Graduation Day', date: 'May 2018' },
    { id: 2, url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', caption: 'Lake trip with friends', date: 'Aug 2019' },
    { id: 3, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80', caption: 'Kyoto streets', date: 'Jun 2016' },
    { id: 4, url: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=600&q=80', caption: 'First apartment', date: 'Sep 2019' },
    { id: 5, url: 'https://images.unsplash.com/photo-1529156069898-49953eb1b5b6?auto=format&fit=crop&w=600&q=80', caption: 'Road trip to Oregon', date: 'Jul 2021' },
    { id: 6, url: 'https://images.unsplash.com/photo-1506869640319-baa1f2d24492?auto=format&fit=crop&w=600&q=80', caption: 'Coffee shop mornings', date: 'Current' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-serif text-sage-800 mb-2">My Gallery</h1>
          <p className="text-ink-400">Flashes of time, captured forever.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          <span>Upload</span>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo) => (
          <div key={photo.id} className="polaroid">
            <div className="aspect-square mb-4 bg-cream-100 overflow-hidden relative">
              <img 
                src={photo.url} 
                alt={photo.caption} 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="text-center">
              <p className="font-serif text-ink-900 text-lg">{photo.caption}</p>
              <p className="font-sans text-ink-400 text-sm mt-1">{photo.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
