import { AlertTriangle, PackageOpen } from 'lucide-react';
import { loadSubjectWithIndex } from '../content/registry';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { TOOL_LIST } from '../sdk/registry/tools';
import { registryResolver, DocResolverProvider } from '../ui/doc-context';
import { EmptyState } from '../ui/EmptyState';
import SubjectOverview from '../ui/SubjectOverview';
import { navigate } from './router';
import { accentVar, findSubject } from './subjects';
import { TOOL_VIEWS } from './tool-views';

export interface WorkspaceProps {
  subjectId: string;
  /** Active mode (tool id) from the route; undefined means the overview. */
  mode?: string;
  /** Route item id inside the mode (lesson slug, exam id, …). */
  id?: string;
  /** Route rest segments (exam run/review shapes). */
  rest?: string[];
}

/**
 * Session-scoped pack cache: content is static per build, so each pack loads
 * and validates exactly once. Load failures are cached too — a broken pack
 * renders its error state on every visit instead of rethrowing per render.
 */
const packCache = new Map<string, { content: SubjectContent; index: SubjectIndex }>();
const packErrors = new Map<string, string>();

function loadPack(
  subjectId: string,
): { pack?: { content: SubjectContent; index: SubjectIndex }; error?: string } {
  if (packCache.has(subjectId)) return { pack: packCache.get(subjectId) };
  if (packErrors.has(subjectId)) return { error: packErrors.get(subjectId) };
  try {
    const pack = loadSubjectWithIndex(subjectId);
    packCache.set(subjectId, pack);
    return { pack };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    packErrors.set(subjectId, message);
    return { error: message };
  }
}

/** Overview pseudo-tab id — not a tool, always present. */
const OVERVIEW = 'overview';

interface WorkspaceTab {
  id: string;
  label: string;
}

/**
 * One subject's workspace. Installed packs drive live tabs from
 * `enabledModes` + the tool registry; uninstalled subjects render honest
 * "pack not installed" chrome, unknown ids an "Unknown subject" state —
 * never a blank page. An unknown or disabled mode falls back to the overview.
 */
export default function SubjectWorkspace({ subjectId, mode, id, rest }: WorkspaceProps) {
  const subject = findSubject(subjectId);
  const { pack, error } = subject?.installed ? loadPack(subjectId) : {};

  // Tabs: Overview + registry-ordered tools the pack enables.
  const enabled = pack?.content.subject.enabledModes ?? [];
  const tabs: WorkspaceTab[] = [
    { id: OVERVIEW, label: 'Overview' },
    ...TOOL_LIST.filter((tool) => enabled.includes(tool.id)).map((tool) => ({
      id: tool.id,
      label: tool.label,
    })),
  ];
  const activeTab = tabs.some((tab) => tab.id === mode) ? mode! : OVERVIEW;

  const goTab = (tabId: string) => {
    navigate(tabId === OVERVIEW ? `/subject/${subjectId}` : `/subject/${subjectId}/${tabId}`);
  };

  const onTablistKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = (current + delta + tabs.length) % tabs.length;
    goTab(tabs[nextIndex].id);
    // Move DOM focus with selection (ARIA tabs pattern): the buttons are
    // stable across the re-render, so focus the next one directly.
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[nextIndex]?.focus();
  };

  return (
    <section className="view" aria-label="Subject workspace">
      <div className="subject-head">
        {subject && (
          <div
            className="badge badge-lg"
            style={{ background: accentVar(subject.accent) }}
          >
            {subject.code}
          </div>
        )}
        <div className="head-text">
          {subject ? (
            <>
              <div className="eyebrow">{subject.subtitle}</div>
              <h1 className="ws-title">{subject.code} study hub</h1>
              <p className="sub ws-sub">{subject.description}</p>
            </>
          ) : (
            <>
              <div className="eyebrow">Subject workspace</div>
              <h1 className="ws-title">Unknown subject</h1>
              <p className="sub ws-sub">
                No installed subject pack matches this address.
              </p>
            </>
          )}
        </div>
      </div>

      {subject && (
        <div
          className="tabs"
          role="tablist"
          aria-label="Subject modes"
          onKeyDown={onTablistKeyDown}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={tab.id === activeTab ? 'tab on' : 'tab'}
              aria-selected={tab.id === activeTab}
              tabIndex={tab.id === activeTab ? 0 : -1}
              onClick={() => goTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!subject ? (
        <EmptyState
          icon={PackageOpen}
          title="No pack at this address"
          message="Check the link, or pick a subject from the hub home. Installed packs will appear here."
        />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="This pack failed to load"
          message={`The ${subject.code} pack is installed but invalid: ${error}`}
        />
      ) : !pack ? (
        <EmptyState
          icon={PackageOpen}
          title="This pack is not in the hub yet"
          message="Content lands in later phases — the shell, navigation, and theming you see now are the foundation it plugs into."
        />
      ) : activeTab === OVERVIEW ? (
        <SubjectOverview subjectId={subjectId} content={pack.content} index={pack.index} />
      ) : (
        <DocResolverProvider resolveDoc={registryResolver(pack.content.docs)}>
          {(() => {
            const ToolView = TOOL_VIEWS[activeTab as keyof typeof TOOL_VIEWS];
            return (
              <ToolView subjectId={subjectId} content={pack.content} index={pack.index} id={id} rest={rest} />
            );
          })()}
        </DocResolverProvider>
      )}
    </section>
  );
}
