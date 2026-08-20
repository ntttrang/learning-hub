import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Stub the content seam: a pack that lists as installed but fails validation,
// plus a healthy pack whose id collides with a placeholder (dp-800).
const stubSubjects = vi.hoisted(() => [
  {
    id: 'broken',
    code: 'BRK-1',
    title: 'Broken Pack',
    accent: 'sky-cyan',
    enabledModes: ['learn'],
  },
  {
    id: 'dp-800',
    code: 'DP-800',
    title: 'DP-800 Installed Pack',
    accent: 'sky-cyan',
    enabledModes: ['learn', 'labs'],
  },
]);

vi.mock('../content/registry', () => ({
  contentSource: {
    listSubjectIds: () => stubSubjects.map((s) => s.id),
    listSubjects: () => stubSubjects,
    loadSubject: (id: string) => ({ subject: stubSubjects.find((s) => s.id === id) }),
  },
  loadSubjectWithIndex: () => {
    throw new Error('subject.json: missing required field "enabledModes"');
  },
}));

import SubjectWorkspace from './SubjectWorkspace';
import { findSubject, listSubjectCards, PLACEHOLDER_SUBJECTS } from './subjects';

describe('SubjectWorkspace broken-pack handling', () => {
  it('renders an error state naming the pack, not a crashed app', () => {
    render(<SubjectWorkspace subjectId="broken" />);
    expect(screen.getByRole('heading', { name: 'BRK-1 study hub' })).toBeInTheDocument();
    expect(screen.getByText('This pack failed to load')).toBeInTheDocument();
    expect(
      screen.getByText(/missing required field "enabledModes"/),
    ).toBeInTheDocument();
  });
});

describe('subject list merge', () => {
  it('lets an installed pack override the same-id placeholder — installed wins', () => {
    const dpCards = listSubjectCards().filter((card) => card.id === 'dp-800');
    expect(dpCards).toHaveLength(1); // placeholder replaced, not duplicated
    expect(dpCards[0].installed).toBe(true);
    expect(dpCards[0].enabledModes).toEqual(['learn', 'labs']);
    expect(dpCards[0].modes).toEqual(['Learn', 'Labs']); // registry labels
    expect(dpCards[0].subtitle).toBe('DP-800 Installed Pack'); // pack copy wins
    expect(findSubject('dp-800')?.installed).toBe(true);
  });

  it('keeps the remaining placeholders honest and uninstalled', () => {
    const placeholders = listSubjectCards().filter((card) => !card.installed);
    expect(placeholders).toHaveLength(PLACEHOLDER_SUBJECTS.length - 1);
    expect(placeholders.every((card) => card.enabledModes.length === 0)).toBe(true);
  });
});
