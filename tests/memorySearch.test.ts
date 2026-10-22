import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMissingMemoryResponse,
  getSearchConcepts,
  isContextualFollowUp,
  matchesAuthenticatedUser,
  rankSearchResults,
  type SearchResult,
} from '../src/utils/memorySearch.ts';
import { formatSupabaseError } from '../src/utils/supabaseError.ts';

function memory(
  id: string,
  title: string,
  searchFields: string[],
  updatedAt: string | null = null
): SearchResult {
  return {
    id,
    kind: 'memory',
    title,
    description: null,
    metadata: [],
    searchFields,
    updatedAt,
  };
}

function education(
  id: string,
  level: string,
  institution: string
): SearchResult {
  return {
    id,
    kind: 'education',
    title: institution,
    description: null,
    metadata: [level],
    searchFields: [level, institution, '', '', '', '', ''],
    updatedAt: null,
  };
}

test('ranks exact saved keyword matches above partial context matches', () => {
  const concepts = getSearchConcepts('Show my winter festival memories');
  const results = rankSearchResults(
    [
      memory('trip', 'Lake weekend', ['Lake weekend', 'A winter walk']),
      memory('festival', 'Winter festival', ['Winter festival', 'Campus lights']),
    ],
    concepts
  );

  assert.deepEqual(results.map(({ id }) => id), ['festival']);
});

test('maps related college wording to saved BTech education records', () => {
  const concepts = getSearchConcepts('What happened at my university?');
  const results = rankSearchResults(
    [
      education('school', 'school', 'Riverside High'),
      education('inter', 'intermediate', 'Central Junior College'),
      education('degree', 'btech', 'North Engineering College'),
    ],
    concepts
  );

  assert.deepEqual(results.map(({ id }) => id), ['degree']);
});

test('finds school, intermediate, and college records by their supported stages', () => {
  const cases = [
    ['school', 'school', 'School'],
    ['intermediate', 'intermediate', 'Intermediate'],
    ['btech', 'btech', 'College'],
  ] as const;

  for (const [query, level, title] of cases) {
    const results = rankSearchResults(
      [education(level, level, title)],
      getSearchConcepts(query)
    );
    assert.equal(results.length, 1, `${query} should find its education record`);
  }
});

test('matches a saved memory date and safely ranks records with no date', () => {
  const concepts = getSearchConcepts('What did I save in 2019?');
  const results = rankSearchResults(
    [
      memory('undated', 'A saved trip', ['A saved trip', 'travel'], null),
      memory('dated', 'A saved trip', ['A saved trip', '2019-06-14'], '2020-01-01'),
    ],
    concepts
  );

  assert.deepEqual(results.map(({ id }) => id), ['dated']);
});

test('uses the latest fetched version and omits records no longer returned', () => {
  const currentVersion = memory(
    'memory-1',
    'Updated school reunion',
    ['Updated school reunion'],
    '2026-10-20T00:00:00Z'
  );

  const results = rankSearchResults(
    [currentVersion],
    getSearchConcepts('school reunion')
  );

  assert.deepEqual(results.map(({ title }) => title), ['Updated school reunion']);
  assert.deepEqual(
    rankSearchResults([], getSearchConcepts('school reunion')),
    []
  );
});

test('returns a clear unavailable message when no memory matched', () => {
  assert.match(getMissingMemoryResponse(), /couldn't find this information/i);
});

test('uses recent retrieved records only for explicit follow-up wording', () => {
  assert.equal(isContextualFollowUp('What year was that?'), true);
  assert.equal(isContextualFollowUp('Where did I travel in 2019?'), false);
});

test('does not authorize missing or different authenticated user IDs', () => {
  assert.equal(matchesAuthenticatedUser('user-a', 'user-a'), true);
  assert.equal(matchesAuthenticatedUser('user-b', 'user-a'), false);
  assert.equal(matchesAuthenticatedUser(null, 'user-a'), false);
});

test('preserves Supabase errors and network failure detail', () => {
  assert.match(
    formatSupabaseError(
      { message: 'column missing', code: '42703', hint: 'Apply migration' },
      'Fallback'
    ),
    /42703.*Apply migration/
  );
  assert.equal(
    formatSupabaseError(new Error('Failed to fetch'), 'Fallback'),
    'Failed to fetch'
  );
});
