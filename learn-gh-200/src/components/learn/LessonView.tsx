import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Domain, LessonBlock } from '../../content/types';
import { domainById, domainsByCert } from '../../content/domains';
import { labsForDomain } from '../../content/labs';
import { docTitle, docUrl } from '../../content/docs';
import { useProgress } from '../../hooks/useProgress';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Callout } from '../ui/Callout';
import { Card } from '../ui/Card';
import { CodeBlock } from '../ui/CodeBlock';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui/EmptyState';
import { InlineText } from '../ui/InlineText';

/** Render one typed lesson block with brand styling. */
function Block({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case 'h3':
      return <h3>{block.text}</h3>;
    case 'p':
      return (
        <p>
          <InlineText text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'code':
      return <CodeBlock code={block.code} lang={block.language} />;
    case 'tip':
      return <Callout text={block.text} />;
    case 'table':
      return <DataTable headers={block.headers} rows={block.rows} />;
  }
}

/** The sub-skill checklist: every outline item with its official doc links. */
function SubSkillList({ domain }: { domain: Domain }) {
  return (
    <aside className="checklist">
      <h3>Skills this lesson covers</h3>
      <ul>
        {domain.subSkills.map((skill) => (
          <li key={skill.id}>
            <span>{skill.title}</span>
            <span className="doc-chips">
              {skill.docIds.map((docId) => {
                const url = docUrl(docId);
                return url ? (
                  <a key={docId} href={url} target="_blank" rel="noopener noreferrer">
                    {docTitle(docId)}
                  </a>
                ) : null;
              })}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Lesson page: prose blocks, sub-skill checklist, mark-as-read, prev/next. */
export function LessonView({ domainId }: { domainId?: string }) {
  const { progress, markLessonRead } = useProgress();
  const domain = domainById(domainId);

  if (!domain) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No such lesson"
        message={`We could not find a domain called “${domainId}”. Pick a domain from the Learn index instead.`}
      >
        <Button href="#/learn">Back to Learn</Button>
      </EmptyState>
    );
  }

  const siblings = domainsByCert(domain.cert);
  const position = siblings.findIndex((item) => item.id === domain.id);
  const prev = siblings[position - 1];
  const next = siblings[position + 1];
  const readOn = progress.lessonsRead[domain.id];
  const lab = labsForDomain(domain.id)[0];

  return (
    <article className="lesson enter">
      <a className="back-link" href="#/learn">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden /> All domains
      </a>

      <header className="lesson-head">
        <div className="lesson-head-tags">
          <Badge tone={domain.cert}>GH-{domain.cert === 'gh900' ? '900' : '200'}</Badge>
          <Pill>
            Domain {domain.number} of {siblings.length}
          </Pill>
          <Pill>
            Weight {domain.weightMin}–{domain.weightMax}%
          </Pill>
          <Pill>{domain.lesson.minutes} min</Pill>
        </div>
        <h2>{domain.title}</h2>
        <p className="lead">{domain.summary}</p>
      </header>

      <div className="lesson-body">
        {domain.lesson.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>

      <SubSkillList domain={domain} />

      {lab ? (
        <Card className="lesson-lab-link" href={`#/lab/${lab.id}`}>
          <p>
            <strong>Lab:</strong> {lab.title} · {lab.minutes} min
          </p>
        </Card>
      ) : null}

      <footer className="lesson-actions">
        {readOn ? (
          <span className="done-flag done-flag-big">
            <Check size={16} strokeWidth={2.5} aria-hidden /> Read on{' '}
            {new Date(readOn).toLocaleDateString()}
          </span>
        ) : (
          <Button onClick={() => markLessonRead(domain.id)}>Mark as read</Button>
        )}
        <div className="block-nav">
          {prev ? (
            <a className="block-nav-link" href={`#/learn/${prev.id}`}>
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
              <span>
                <small>Previous</small>
                {prev.title}
              </span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a className="block-nav-link block-nav-next" href={`#/learn/${next.id}`}>
              <span>
                <small>Next</small>
                {next.title}
              </span>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
            </a>
          ) : (
            <span />
          )}
        </div>
      </footer>
    </article>
  );
}
