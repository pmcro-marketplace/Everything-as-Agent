import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRepoHealth, evaluateSingleRepoHealth } from './repoHealth';
import { PMCRO_ORG_SNAPSHOT } from '../data/pmcroOrgSnapshot';

test('returns Synced when live data is fresh and non-empty', () => {
  const now = Date.parse('2026-11-15T03:00:00Z');
  const assessment = evaluateRepoHealth({
    source: 'live',
    updatedAt: '2026-11-15T02:56:00Z',
    reposCount: 26,
    nowMs: now,
  });
  assert.equal(assessment.status, 'Synced');
  assert.equal(assessment.ageMinutes, 4);
  assert.equal(evaluateSingleRepoHealth(PMCRO_ORG_SNAPSHOT[0], assessment.status), 'Synced');
});

test('returns Stale when serving snapshot fallback', () => {
  const now = Date.parse('2026-11-15T03:00:00Z');
  const assessment = evaluateRepoHealth({
    source: 'snapshot',
    updatedAt: '2026-11-15T01:18:00Z',
    reposCount: 26,
    nowMs: now,
  });
  assert.equal(assessment.status, 'Stale');
  assert.equal(evaluateSingleRepoHealth(PMCRO_ORG_SNAPSHOT[0], assessment.status), 'Stale');
});

test('returns Stale when live sync timestamp exceeds threshold', () => {
  const now = Date.parse('2026-11-15T03:00:00Z');
  const assessment = evaluateRepoHealth({
    source: 'live',
    updatedAt: '2026-11-15T02:30:00Z',
    reposCount: 26,
    nowMs: now,
  });
  assert.equal(assessment.status, 'Stale');
  assert.equal(assessment.ageMinutes, 30);
});

test('returns Error when rateLimited, HTTP error, explicit error, or empty repos', () => {
  assert.equal(
    evaluateRepoHealth({
      source: 'snapshot',
      updatedAt: '2026-11-15T01:18:00Z',
      reposCount: 26,
      rateLimited: true,
      statusCode: 403,
    }).status,
    'Error'
  );

  assert.equal(
    evaluateRepoHealth({
      source: 'snapshot',
      updatedAt: '2026-11-15T01:18:00Z',
      reposCount: 26,
      error: 'Network timeout calling GitHub',
    }).status,
    'Error'
  );

  assert.equal(
    evaluateRepoHealth({
      source: 'live',
      updatedAt: '2026-11-15T03:00:00Z',
      reposCount: 0,
      nowMs: Date.parse('2026-11-15T03:00:00Z'),
    }).status,
    'Error'
  );
});
