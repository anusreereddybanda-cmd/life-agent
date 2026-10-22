export type SearchResult = {
  id: string;
  kind: 'memory' | 'education';
  title: string;
  description: string | null;
  metadata: string[];
  searchFields: string[];
  updatedAt: string | null;
};

export type SearchConcept = {
  term: string;
  variants: string[];
};

const ignoredSearchTerms = new Set([
  'a', 'about', 'an', 'and', 'are', 'can', 'did', 'do', 'for', 'find',
  'have', 'how', 'i', 'in', 'is', 'it', 'me', 'memory', 'memories', 'my',
  'of', 'on', 'please', 'saved', 'show', 'tell', 'the', 'to', 'was', 'what',
  'when', 'where', 'which', 'who', 'you', 'during', 'from', 'with',
  'happen', 'happened', 'experience', 'experiences', 'recall', 'remember',
  'remembered', 'at', 'as', 'by', 'that', 'those', 'there', 'they', 'he',
  'she', 'this', 'these', 'them', 'go', 'went', 'attend', 'attended',
  'study', 'studied', 'learn', 'learned',
]);

const searchAliases: Record<string, string[]> = {
  campus: ['campus', 'college', 'btech'],
  college: ['college', 'btech'],
  university: ['university', 'btech'],
  engineering: ['engineering', 'btech'],
  btech: ['btech', 'engineering'],
  inter: ['inter', 'intermediate'],
  intermediate: ['intermediate', 'inter'],
  highschool: ['highschool', 'school'],
  schooling: ['schooling', 'school'],
  graduation: ['graduation', 'graduated'],
  graduated: ['graduated', 'graduation'],
  save: ['save', 'saved'],
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

function tokenize(value: string) {
  return normalizeText(value).match(/[a-z0-9]+/g) ?? [];
}

export function getSearchConcepts(query: string): SearchConcept[] {
  const tokens = Array.from(
    new Set(
      tokenize(query)
        .filter((term) => term.length > 1 && !ignoredSearchTerms.has(term))
        .map((term) => term.slice(0, 50))
    )
  ).slice(0, 8);

  return tokens.map((term) => ({
    term,
    variants: searchAliases[term] ?? [term],
  }));
}

export function getSearchTerms(concepts: SearchConcept[]) {
  return Array.from(
    new Set(concepts.flatMap((concept) => concept.variants))
  ).slice(0, 16);
}

export function buildIlikeFilters(fields: string[], terms: string[]) {
  return terms.flatMap((term) =>
    fields.map((field) => `${field}.ilike.%${term}%`)
  );
}

function getFieldWeight(kind: SearchResult['kind'], fieldIndex: number) {
  const weights =
    kind === 'memory'
      ? [4, 2, 3, 2, 1, 2]
      : [2, 4, 3, 1, 2, 2, 2];
  return weights[fieldIndex] ?? 1;
}

export function getSearchScore(result: SearchResult, concepts: SearchConcept[]) {
  const allFields = result.searchFields.map((field) => new Set(tokenize(field)));

  return concepts.reduce((score, concept) => {
    let bestFieldScore = 0;
    allFields.forEach((tokens, fieldIndex) => {
      if (concept.variants.some((variant) => tokens.has(variant))) {
        bestFieldScore = Math.max(
          bestFieldScore,
          getFieldWeight(result.kind, fieldIndex)
        );
      }
    });
    return score + bestFieldScore;
  }, 0);
}

function getMatchedConceptCount(result: SearchResult, concepts: SearchConcept[]) {
  const allFields = result.searchFields.map((field) => new Set(tokenize(field)));
  return concepts.filter((concept) =>
    allFields.some((tokens) =>
      concept.variants.some((variant) => tokens.has(variant))
    )
  ).length;
}

export function rankSearchResults(
  results: SearchResult[],
  concepts: SearchConcept[],
  limit = 5
) {
  const minimumMatchedConcepts = Math.min(2, concepts.length);
  return results
    .map((result) => ({
      result,
      score: getSearchScore(result, concepts),
      matchedConcepts: getMatchedConceptCount(result, concepts),
    }))
    .filter(
      ({ score, matchedConcepts }) =>
        score > 0 && matchedConcepts >= minimumMatchedConcepts
    )
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (b.result.updatedAt ?? '').localeCompare(a.result.updatedAt ?? '');
    })
    .slice(0, limit)
    .map(({ result }) => result);
}

export function isContextualFollowUp(query: string) {
  const normalized = normalizeText(query);
  return /\b(that|those|them|there|it|this|they|he|she|these)\b|\b(what about|what year|when was|which one|tell me more|more details)\b/.test(
    normalized
  );
}

export function getMissingMemoryResponse() {
  return "I couldn't find this information in your saved memories. Try searching with different keywords.";
}

export function matchesAuthenticatedUser(
  authenticatedUserId: string | null,
  expectedUserId: string
) {
  return Boolean(authenticatedUserId && authenticatedUserId === expectedUserId);
}
