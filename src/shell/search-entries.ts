import { loadSubjectWithIndex } from '../content/registry';
import type { SearchEntry } from '../engines/search';
import { listSubjectCards } from './subjects';

/**
 * Map installed packs and roadmap placeholders to searchable entries for the
 * topbar search. Subjects always make the list (a placeholder's workspace is
 * a real destination); lessons and labs come from installed packs only.
 */
export function buildHubSearchEntries(): SearchEntry[] {
  const cards = listSubjectCards();
  const entries: SearchEntry[] = [];

  for (const card of cards) {
    entries.push({
      kind: 'subject',
      title: card.code,
      // The full subject name + subtitle gives the matcher (and the reader)
      // more than the bare code.
      context: [card.subtitle, card.description].filter(Boolean).join(' — '),
      subjectCode: card.code,
      route: `#/subject/${card.id}`,
    });

    if (!card.installed) continue;
    const { content, index } = loadSubjectWithIndex(card.id);
    const subjectTitle = content.subject.title;

    for (const lesson of index.lessonSequence()) {
      const trail = [lesson.moduleId && index.getModule(lesson.moduleId)?.title, index.getDomain(lesson.domainId)?.title]
        .filter(Boolean)
        .join(' · ');
      entries.push({
        kind: 'lesson',
        title: lesson.title,
        context: [subjectTitle, trail].filter(Boolean).join(' · '),
        subjectCode: card.code,
        route: `#/subject/${card.id}/learn/${lesson.slug ?? lesson.id}`,
      });
    }

    for (const lab of content.labs) {
      entries.push({
        kind: 'lab',
        title: lab.title,
        context: subjectTitle,
        subjectCode: card.code,
        route: `#/subject/${card.id}/labs/${lab.id}`,
      });
    }
  }

  return entries;
}
