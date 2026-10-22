import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, User as UserIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { formatSupabaseError } from '../utils/supabaseError';
import {
  buildIlikeFilters,
  getMissingMemoryResponse,
  getSearchConcepts,
  getSearchTerms,
  isContextualFollowUp,
  matchesAuthenticatedUser,
  rankSearchResults,
  type SearchResult,
} from '../utils/memorySearch';

type Message = {
  role: 'assistant' | 'user';
  content: string;
  results?: SearchResult[];
};

const welcomeMessage: Message = {
  role: 'assistant',
  content:
    'Hi! I can search your saved memories using keywords. This version searches your memory records directly and is not connected to an AI model. Ask about a specific person, place, event, or topic you saved.',
};

const memorySearchFields = [
  'title',
  'description',
  'category',
  'location',
  'mood',
  'memory_date',
];
const educationSearchFields = [
  'level',
  'institution_name',
  'course_or_branch',
  'description',
  'grade_or_result',
];

export default function AgentPage({ userId }: { userId: string }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    return () => {
      requestVersion.current += 1;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchQuery = query.trim();
    if (!searchQuery || loading) return;

    const request = ++requestVersion.current;
    const requestingUserId = userId;
    const isCurrentRequest = () =>
      requestVersion.current === request;

    setMessages((current) => [
      ...current,
      { role: 'user', content: searchQuery },
    ]);
    setErrorMessage('');
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isCurrentRequest()) return;
      if (authError) {
        if (authError.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        throw authError;
      }
      if (!user) {
        throw new Error('Please sign in to search your saved memories.');
      }
      if (!matchesAuthenticatedUser(user.id, requestingUserId)) {
        throw new Error('Your account changed. Please retry your search.');
      }

      const followUpContext = isContextualFollowUp(searchQuery)
        ? messages
            .slice(-4)
            .reverse()
            .find((message) => message.role === 'assistant' && message.results?.length)
            ?.results?.flatMap((result) => [
              result.title,
              result.description ?? '',
              ...result.metadata,
            ])
            .join(' ') ?? ''
        : '';
      const concepts = getSearchConcepts(
        `${searchQuery} ${followUpContext}`.slice(0, 1200)
      );
      const terms = getSearchTerms(concepts);
      if (concepts.length === 0) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content:
              'Please include a specific keyword, person, place, date, event, or topic to search your saved memories.',
          },
        ]);
        setQuery('');
        return;
      }

      const memoryFilters = buildIlikeFilters(memorySearchFields, terms);
      const years = concepts
        .map(({ term }) => term)
        .filter((term) => /^\d{4}$/.test(term));
      for (const year of years) {
        const nextYear = Number(year) + 1;
        memoryFilters.push(
          `and(memory_date.gte.${year}-01-01,memory_date.lt.${nextYear}-01-01)`
        );
      }

      const educationFilters = buildIlikeFilters(
        educationSearchFields,
        terms.filter((term) => !years.includes(term))
      );
      for (const year of years) {
        educationFilters.push(`start_year.eq.${year}`, `end_year.eq.${year}`);
      }

      const memoryRequest = supabase
        .from('memories')
        .select('id, title, description, category, memory_date, location, mood, updated_at')
        .eq('user_id', user.id)
        .or(memoryFilters.join(','))
        .order('updated_at', { ascending: false })
        .limit(50);

      const educationRequest = supabase
        .from('education_memories')
        .select(
          'id, level, institution_name, course_or_branch, start_year, end_year, description, grade_or_result, updated_at'
        )
        .eq('user_id', user.id)
        .or(educationFilters.join(','))
        .order('updated_at', { ascending: false })
        .limit(50);

      const [memoryResponse, educationResponse] = await Promise.all([
        memoryRequest,
        educationRequest,
      ]);

      if (!isCurrentRequest()) return;
      if (memoryResponse.error) throw memoryResponse.error;
      if (educationResponse.error) throw educationResponse.error;

      const memoryResults: SearchResult[] = (memoryResponse.data ?? []).map(
        (memory) => ({
          id: `memory-${memory.id}`,
          kind: 'memory',
          title: memory.title,
          description: memory.description,
          metadata: [memory.category, memory.memory_date, memory.location, memory.mood]
            .filter((value): value is string => Boolean(value)),
          searchFields: [
            memory.title,
            memory.description ?? '',
            memory.category ?? '',
            memory.location ?? '',
            memory.mood ?? '',
            memory.memory_date ?? '',
          ],
          updatedAt: memory.updated_at,
        })
      );
      const educationResults: SearchResult[] = (
        educationResponse.data ?? []
      ).map((education) => ({
        id: `education-${education.id}`,
        kind: 'education',
        title: education.institution_name,
        description: education.description,
        metadata: [
          education.level,
          education.course_or_branch,
          education.start_year && education.end_year
            ? `${education.start_year}–${education.end_year}`
            : education.start_year
              ? `From ${education.start_year}`
              : education.end_year
                ? `Until ${education.end_year}`
                : null,
          education.grade_or_result,
        ].filter((value): value is string => Boolean(value)),
        searchFields: [
          education.level,
          education.institution_name,
          education.course_or_branch ?? '',
          education.description ?? '',
          education.grade_or_result ?? '',
          education.start_year?.toString() ?? '',
          education.end_year?.toString() ?? '',
        ],
        updatedAt: education.updated_at,
      }));

      const results = rankSearchResults(
        [...memoryResults, ...educationResults],
        concepts
      );

      if (!isCurrentRequest()) return;
      setMessages((current) => [
        ...current,
        results.length > 0
          ? {
              role: 'assistant',
              content: `From your saved memories, I found ${results.length} relevant ${
                results.length === 1 ? 'record' : 'records'
              }:`,
              results,
            }
          : {
              role: 'assistant',
              content:
                  getMissingMemoryResponse(),
            },
      ]);
      setQuery('');
    } catch (error) {
      if (!isCurrentRequest()) return;
      setErrorMessage(
        `Could not search your memories: ${formatSupabaseError(error, 'Please try again.')}`
      );
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-120px)] min-h-[480px] flex flex-col">
      <header className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-sage-100 rounded-full text-sage-600">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-sage-800">MyLife Assistant</h1>
          <p className="text-ink-400 text-sm flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" />
            Private memory search · No AI model configured
          </p>
        </div>
      </header>

      <div className="flex-1 glass-panel p-6 flex flex-col overflow-hidden relative">
        <div
          className="flex-1 overflow-y-auto space-y-6 pr-2 pb-24"
          aria-live="polite"
          aria-busy={loading}
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-cream-200 text-ink-600'
                    : 'bg-sage-100 text-sage-600'
                }`}
              >
                {message.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
              </div>
              <div
                className={`p-4 rounded-2xl shadow-sm max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-sage-600 rounded-tr-none text-white'
                    : 'bg-white rounded-tl-none border border-cream-200 text-ink-600'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.results && (
                  <div className="mt-3 space-y-3">
                    {message.results.map((result) => (
                      <article
                        key={result.id}
                        className="rounded-xl border border-cream-200 bg-cream-50 p-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-sage-600">
                          {result.kind === 'education'
                            ? 'Saved education record'
                            : 'Saved memory'}
                        </p>
                        <h2 className="mt-1 font-serif text-lg text-sage-800">
                          {result.title}
                        </h2>
                        {result.metadata.length > 0 && (
                          <p className="mt-1 text-xs text-ink-400">
                            {result.metadata.join(' · ')}
                          </p>
                        )}
                        {result.description && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">
                            {result.description}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-ink-400" role="status">
              <LoaderCircle size={18} className="animate-spin text-sage-600" />
              Searching your saved memories...
            </div>
          )}
          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="absolute bottom-6 left-6 right-6"
        >
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your saved memories..."
              aria-label="Search your saved memories"
              maxLength={500}
              className="w-full bg-white/90 backdrop-blur-sm border-2 border-cream-200 rounded-full py-4 pl-6 pr-14 shadow-sm focus:outline-none focus:border-sage-400 focus:ring-4 focus:ring-sage-100 transition-all disabled:opacity-60"
              disabled={loading}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 p-2 bg-sage-500 text-white rounded-full hover:bg-sage-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
