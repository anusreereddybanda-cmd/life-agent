
import { useEffect, useState, type FormEvent } from 'react';
import { PenSquare, BookOpen } from 'lucide-react';
import { supabase } from '../supabase';
import PageBackground from '../components/PageBackground';

type Memory = {
  id: string;
  title: string;
  description: string;
  category: string;
  memory_date: string | null;
};

export default function MemoriesPage({ userId }: { userId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('College');
  const [content, setContent] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadMemories() {
    const { data, error } = await supabase
      .from('memories')
      .select('id, title, description, category, memory_date')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMemories(data ?? []);
  }

  useEffect(() => {
    void loadMemories();
  }, []);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      const { error } = await supabase.from('memories').insert({
        user_id: user.id,
        title: title.trim(),
        description: content.trim(),
        category,
        memory_date: new Date().toISOString().slice(0, 10),
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setCategory('College');
      setShowForm(false);

      await loadMemories();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not save memory.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageBackground userId={userId} column="memories_background_path">
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <header className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-4xl font-serif text-sage-800 mb-2">
            My Memories
          </h1>
          <p className="text-ink-400">
            Chapters of my life, written by me.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setErrorMessage('');
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PenSquare size={20} />
          <span>{showForm ? 'Cancel' : 'New Entry'}</span>
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="glass-panel p-6 space-y-4"
        >
          <h2 className="text-2xl font-serif text-sage-800">
            New Memory
          </h2>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Memory title"
            required
            className="w-full rounded-lg border border-cream-300 p-3"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-cream-300 p-3"
          >
            {['School', 'College', 'Family', 'Travel', 'Thoughts'].map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              )
            )}
          </select>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about this memory..."
            required
            rows={5}
            className="w-full rounded-lg border border-cream-300 p-3"
          />

          {errorMessage && (
            <p role="alert" className="text-red-600 text-sm">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Memory'}
          </button>
        </form>
      )}

      {!showForm && errorMessage && (
        <p role="alert" className="text-red-600 text-sm">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {['All', 'School', 'College', 'Family', 'Travel', 'Thoughts'].map(
          (item, idx) => (
            <span
              key={item}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                idx === 0
                  ? 'bg-sage-600 text-white shadow-sm'
                  : 'bg-cream-100 text-ink-500 border border-cream-200'
              }`}
            >
              {item}
            </span>
          )
        )}
      </div>

      {memories.length === 0 ? (
        <p className="text-ink-400 py-8">
          No saved memories yet. Click New Entry to add your first memory.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              date={memory.memory_date ?? ''}
              category={memory.category}
              title={memory.title}
              content={memory.description}
            />
          ))}
        </div>
      )}
    </div>
    </PageBackground>
  );
}

function MemoryCard({
  date,
  category,
  title,
  content,
}: {
  date: string;
  category: string;
  title: string;
  content: string;
}) {
  return (
    <div className="glass-panel p-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-full bg-sage-300 group-hover:bg-sage-500 transition-colors" />

      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-sage-600 bg-sage-50 px-3 py-1 rounded-full border border-sage-100">
          {category}
        </span>
        <span className="text-sm text-ink-400 font-serif italic">
          {date}
        </span>
      </div>

      <h3 className="text-2xl font-serif text-ink-900 mb-3">
        {title}
      </h3>

      <p className="text-ink-500 leading-relaxed font-sans whitespace-pre-wrap">
        {content}
      </p>

      <div className="mt-6 pt-4 border-t border-cream-200 flex justify-end">
        <span className="text-sage-600 text-sm font-medium flex items-center gap-1">
          <BookOpen size={16} /> Saved Memory
        </span>
      </div>
    </div>
  );
}
