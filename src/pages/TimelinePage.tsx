import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  GraduationCap,
  MapPin,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';
import PageBackground from '../components/PageBackground';

type Memory = {
  id: string;
  title: string;
  description: string | null;
  memory_date: string | null;
  location: string | null;
  category: string | null;
  mood: string | null;
};

type EducationMemory = {
  id: string;
  level: 'school' | 'intermediate' | 'btech';
  institution_name: string;
  course_or_branch: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  grade_or_result: string | null;
};

type TimelineItem = {
  id: string;
  source: 'memory' | 'education';
  title: string;
  description: string | null;
  dateLabel: string | null;
  dateSort: number | null;
  category: string | null;
  location: string | null;
  stage: string | null;
  additionalDetails: { label: string; value: string }[];
  memory?: Memory;
};

type MemoryDraft = {
  title: string;
  description: string;
  memory_date: string;
  location: string;
  category: string;
};

const pageSize = 200;
const educationLabels: Record<EducationMemory['level'], string> = {
  school: 'School',
  intermediate: 'Intermediate',
  btech: 'BTech',
};

function toDateSortValue(date: string | null) {
  if (!date) return null;
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function toMemoryTimelineItem(memory: Memory): TimelineItem {
  return {
    id: `memory-${memory.id}`,
    source: 'memory',
    title: memory.title,
    description: memory.description,
    dateLabel: memory.memory_date,
    dateSort: toDateSortValue(memory.memory_date),
    category: memory.category,
    location: memory.location,
    stage: null,
    additionalDetails: memory.mood
      ? [{ label: 'Mood', value: memory.mood }]
      : [],
    memory,
  };
}

function toEducationTimelineItem(education: EducationMemory): TimelineItem {
  const years = [education.start_year, education.end_year].filter(
    (year): year is number => year !== null
  );
  const dateLabel =
    years.length === 2
      ? `${education.start_year}–${education.end_year}`
      : years.length === 1
        ? String(years[0])
        : null;
  const sortYear = education.start_year ?? education.end_year;

  return {
    id: `education-${education.id}`,
    source: 'education',
    title: education.institution_name,
    description: education.description,
    dateLabel,
    dateSort: sortYear === null ? null : Date.UTC(sortYear, 0, 1),
    category: null,
    location: null,
    stage: educationLabels[education.level],
    additionalDetails: [
      education.course_or_branch
        ? { label: 'Course or branch', value: education.course_or_branch }
        : null,
      education.grade_or_result
        ? { label: 'Grade or result', value: education.grade_or_result }
        : null,
    ].filter(
      (detail): detail is { label: string; value: string } => detail !== null
    ),
  };
}

export default function TimelinePage({ userId }: { userId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [draft, setDraft] = useState<MemoryDraft | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeline() {
      setLoading(true);
      setErrorMessage('');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user || user.id !== userId) {
          throw new Error('Please sign in again to view your timeline.');
        }

        const memories: Memory[] = [];
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabase
            .from('memories')
            .select('id, title, description, memory_date, location, category, mood')
            .eq('user_id', user.id)
            .order('memory_date', { ascending: true, nullsFirst: false })
            .range(from, from + pageSize - 1);
          if (error) throw error;
          const page = data ?? [];
          memories.push(...page);
          if (page.length < pageSize) break;
        }

        const education: EducationMemory[] = [];
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabase
            .from('education_memories')
            .select(
              'id, level, institution_name, course_or_branch, start_year, end_year, description, grade_or_result'
            )
            .eq('user_id', user.id)
            .order('start_year', { ascending: true, nullsFirst: false })
            .range(from, from + pageSize - 1);
          if (error) throw error;
          const page = data ?? [];
          education.push(...page);
          if (page.length < pageSize) break;
        }

        if (!cancelled) {
          setItems(
            [...memories.map(toMemoryTimelineItem), ...education.map(toEducationTimelineItem)]
              .sort((a, b) => {
                if (a.dateSort === null) return b.dateSort === null ? 0 : 1;
                if (b.dateSort === null) return -1;
                return a.dateSort - b.dateSort;
              })
          );
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load your timeline.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.category ?? item.stage)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const itemCategory = item.category ?? item.stage;
      if (categoryFilter !== 'all' && itemCategory !== categoryFilter) return false;
      if (!normalizedSearch) return true;

      return [
        item.title,
        item.description ?? '',
        item.dateLabel ?? '',
        item.category ?? '',
        item.location ?? '',
        item.stage ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    });
  }, [categoryFilter, items, search]);

  function openItem(item: TimelineItem) {
    setSelectedItem(item);
    setDraft(
      item.memory
        ? {
            title: item.memory.title,
            description: item.memory.description ?? '',
            memory_date: item.memory.memory_date ?? '',
            location: item.memory.location ?? '',
            category: item.memory.category ?? '',
          }
        : null
    );
    setErrorMessage('');
    setStatusMessage('');
  }

  function closeDetails() {
    if (saving) return;
    setSelectedItem(null);
    setDraft(null);
    setErrorMessage('');
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItem?.memory || !draft || saving) return;

    const title = draft.title.trim();
    const description = draft.description.trim();
    const location = draft.location.trim();
    const category = draft.category.trim();
    if (!title || title.length > 200) {
      setErrorMessage('Title is required and must be 200 characters or fewer.');
      return;
    }
    if (description.length > 10000 || location.length > 200 || category.length > 100) {
      setErrorMessage('One or more fields exceed the database limits.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error('Please sign in again before editing this memory.');
      }

      const { data, error } = await supabase
        .from('memories')
        .update({
          title,
          description: description || null,
          memory_date: draft.memory_date || null,
          location: location || null,
          category: category || null,
        })
        .eq('id', selectedItem.memory.id)
        .eq('user_id', user.id)
        .select('id, title, description, memory_date, location, category, mood')
        .single();

      if (error) throw error;

      const updatedItem = toMemoryTimelineItem(data);
      setItems((current) =>
        current
          .map((item) => (item.id === selectedItem.id ? updatedItem : item))
          .sort((a, b) => {
            if (a.dateSort === null) return b.dateSort === null ? 0 : 1;
            if (b.dateSort === null) return -1;
            return a.dateSort - b.dateSort;
          })
      );
      setSelectedItem(updatedItem);
      setDraft({
        title: data.title,
        description: data.description ?? '',
        memory_date: data.memory_date ?? '',
        location: data.location ?? '',
        category: data.category ?? '',
      });
      setStatusMessage('Memory updated successfully.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update this memory.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedItem?.memory || saving) return;
    if (!window.confirm(`Delete "${selectedItem.title}"? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error('Please sign in again before deleting this memory.');
      }

      const { data, error } = await supabase
        .from('memories')
        .delete()
        .eq('id', selectedItem.memory.id)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (error) throw error;
      if (!data) throw new Error('The memory was not deleted.');

      setItems((current) => current.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setDraft(null);
      setStatusMessage('Memory deleted successfully.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not delete this memory.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageBackground userId={userId} column="timeline_background_path">
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">My Timeline</h1>
        <p className="text-ink-400">Your saved memories, arranged by date.</p>
      </header>

      <div className="glass-panel p-4 flex flex-col md:flex-row gap-3">
        <label className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles, details, dates, and places..."
            aria-label="Search timeline"
            className="w-full rounded-full border border-cream-300 bg-white/80 py-3 pl-11 pr-4"
          />
        </label>
        <label className="sr-only" htmlFor="timeline-category">
          Filter by category or life stage
        </label>
        <select
          id="timeline-category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-full border border-cream-300 bg-white/80 px-4 py-3 text-ink-600"
        >
          <option value="all">All categories and stages</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && !selectedItem && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {statusMessage && !selectedItem && (
        <p role="status" className="rounded-lg bg-sage-50 p-4 text-sm text-sage-800">
          {statusMessage}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-8 text-center text-ink-400">
          Loading your timeline...
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="py-8 text-center text-ink-400">
          {items.length === 0
            ? 'No saved memories or education records to show yet.'
            : 'No records match your search and category filter.'}
        </p>
      ) : (
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-cream-300" />
          <div className="space-y-12">
            {filteredItems.map((item, index) => (
              <TimelineEvent
                key={item.id}
                item={item}
                align={index % 2 === 0 ? 'right' : 'left'}
                onOpen={() => openItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-detail-title"
            className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cream-50 p-6 md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-sage-600">
                  {selectedItem.source === 'education'
                    ? `Saved education record${selectedItem.stage ? ` · ${selectedItem.stage}` : ''}`
                    : selectedItem.category ?? 'Saved memory'}
                </p>
                <h2
                  id="timeline-detail-title"
                  className="mt-1 text-2xl font-serif text-sage-800"
                >
                  {draft?.title ?? selectedItem.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close details"
                className="rounded-full p-2 text-ink-500 hover:bg-cream-200"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {selectedItem.memory && draft ? (
              <form onSubmit={handleSave} className="space-y-4">
                <label className="block space-y-1 text-sm font-medium text-ink-600">
                  Title
                  <input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    required
                    maxLength={200}
                    className="w-full rounded-lg border border-cream-300 bg-white p-3"
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium text-ink-600">
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    maxLength={10000}
                    rows={4}
                    className="w-full rounded-lg border border-cream-300 bg-white p-3"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm font-medium text-ink-600">
                    Date
                    <input
                      type="date"
                      value={draft.memory_date}
                      onChange={(event) =>
                        setDraft({ ...draft, memory_date: event.target.value })
                      }
                      className="w-full rounded-lg border border-cream-300 bg-white p-3"
                    />
                  </label>
                  <label className="block space-y-1 text-sm font-medium text-ink-600">
                    Category
                    <input
                      value={draft.category}
                      onChange={(event) =>
                        setDraft({ ...draft, category: event.target.value })
                      }
                      maxLength={100}
                      className="w-full rounded-lg border border-cream-300 bg-white p-3"
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-sm font-medium text-ink-600">
                  Location
                  <input
                    value={draft.location}
                    onChange={(event) =>
                      setDraft({ ...draft, location: event.target.value })
                    }
                    maxLength={200}
                    className="w-full rounded-lg border border-cream-300 bg-white p-3"
                  />
                </label>

                {errorMessage && (
                  <p role="alert" className="text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}
                {statusMessage && (
                  <p role="status" className="text-sm text-sage-700">
                    {statusMessage}
                  </p>
                )}
                <div className="flex flex-wrap justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openItem(selectedItem)}
                      disabled={saving}
                      className="btn-secondary px-4 py-2"
                    >
                      Cancel edits
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary px-5 py-2 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {selectedItem.dateLabel && (
                  <p className="flex items-center gap-2 text-sm text-ink-500">
                    <CalendarDays size={16} />
                    {selectedItem.dateLabel}
                  </p>
                )}
                {selectedItem.category && (
                  <p className="text-sm text-ink-500">
                    Category: {selectedItem.category}
                  </p>
                )}
                {selectedItem.location && (
                  <p className="flex items-center gap-2 text-sm text-ink-500">
                    <MapPin size={16} />
                    {selectedItem.location}
                  </p>
                )}
                {selectedItem.description && (
                  <p className="whitespace-pre-wrap leading-relaxed text-ink-600">
                    {selectedItem.description}
                  </p>
                )}
                {selectedItem.additionalDetails.map((detail) => (
                  <p key={detail.label} className="text-sm text-ink-500">
                    <span className="font-medium">{detail.label}:</span> {detail.value}
                  </p>
                ))}
                {selectedItem.source === 'education' && (
                  <p className="text-sm text-ink-400">
                    Education record editing is not available on this page.
                  </p>
                )}
                <button
                  type="button"
                  onClick={closeDetails}
                  className="btn-secondary px-5 py-2"
                >
                  Close
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
    </PageBackground>
  );
}

function TimelineEvent({
  item,
  align,
  onOpen,
}: {
  item: TimelineItem;
  align: 'left' | 'right';
  onOpen: () => void;
}) {
  const isLeft = align === 'left';
  const icon =
    item.source === 'education' ? (
      <GraduationCap size={20} />
    ) : item.location ? (
      <MapPin size={20} />
    ) : item.category?.toLowerCase().includes('work') ? (
      <Briefcase size={20} />
    ) : item.category?.toLowerCase().includes('achievement') ? (
      <Star size={20} />
    ) : (
      <BookOpen size={20} />
    );

  return (
    <div
      className={`relative flex items-center justify-between md:justify-normal w-full ${
        isLeft ? 'md:flex-row-reverse' : ''
      }`}
    >
      <div className="hidden md:block w-5/12" />
      <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-sage-100 border-4 border-white shadow-sm z-10 text-sage-600">
        {icon}
      </div>
      <div
        className={`w-full pl-16 md:pl-0 md:w-5/12 ${
          isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'
        }`}
      >
        <article className="glass-panel p-6 hover:shadow-md transition-shadow">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {item.dateLabel ? (
              <span className="inline-block rounded-full bg-cream-200 px-3 py-1 text-sm font-serif font-bold text-ink-600">
                {item.dateLabel}
              </span>
            ) : (
              <span className="text-sm italic text-ink-400">Date not recorded</span>
            )}
            {(item.stage || item.category) && (
              <span className="rounded-full border border-sage-100 bg-sage-50 px-3 py-1 text-xs font-medium text-sage-700">
                {item.stage ?? item.category}
              </span>
            )}
          </div>
          <h2 className="mb-2 text-xl font-serif text-ink-900">{item.title}</h2>
          {item.location && (
            <p className="mb-2 flex items-center gap-1.5 text-sm text-ink-400">
              <MapPin size={15} />
              {item.location}
            </p>
          )}
          {item.description && (
            <p className="text-sm leading-relaxed text-ink-500">
              {item.description}
            </p>
          )}
          {item.additionalDetails.map((detail) => (
            <p key={detail.label} className="mt-2 text-sm text-ink-500">
              <span className="font-medium">{detail.label}:</span> {detail.value}
            </p>
          ))}
          <button
            type="button"
            onClick={onOpen}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sage-700 hover:underline"
          >
            <Pencil size={15} />
            Open details
          </button>
        </article>
      </div>
    </div>
  );
}
