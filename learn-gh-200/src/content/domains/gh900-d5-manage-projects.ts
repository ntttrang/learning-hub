import type { Domain } from '../types';

/**
 * GH-900 domain 5 — Manage projects with GitHub (5–10%).
 *
 * The planning layer: Projects as flexible databases over issues and PRs,
 * layouts, labels and milestones, the small workflow helpers (saved replies,
 * assignees), and project insights.
 */
export const domain: Domain = {
  id: 'gh900-d5',
  cert: 'gh900',
  number: 5,
  title: 'Manage projects with GitHub',
  weightMin: 5,
  weightMax: 10,
  summary:
    'Projects and layouts, labels and milestones, saved replies and assignees, and project insights.',
  subSkills: [
    {
      id: 'd5-projects-layouts',
      title: 'Projects and layout options',
      docIds: ['about-projects', 'project-view-layouts'],
    },
    {
      id: 'd5-labels-milestones',
      title: 'Labels, milestones, and workflows',
      docIds: ['managing-labels', 'about-milestones'],
    },
    {
      id: 'd5-saved-replies-assignees',
      title: 'Saved replies and assignees',
      docIds: ['about-saved-replies'],
    },
    {
      id: 'd5-project-insights',
      title: 'Project insights',
      docIds: ['about-project-insights'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d5',
    domainId: 'gh900-d5',
    title: 'Managing projects on GitHub',
    minutes: 10,
    blocks: [
      { kind: 'h3', text: 'Projects: a spreadsheet that knows your issues' },
      {
        kind: 'p',
        text: '[Projects](about-projects) is GitHub’s planning surface — a flexible table of items where items can be issues, pull requests, or draft ideas, enriched with custom fields (status, date, single-select, iteration). A project is not a folder: one issue can appear in many projects, and the project adds its own fields and views on top without changing the issue itself.',
      },
      {
        kind: 'p',
        text: 'Every project ships multiple **views**, and each view picks a [layout](project-view-layouts): **table** for fields and editing, **board** for status-by-column flow, and **roadmap** or **timeline** when dates matter. Views are saved lenses on the same data — filter and group freely; nothing is moved or copied.',
      },
      { kind: 'h3', text: 'Labels and milestones: the shared vocabulary' },
      {
        kind: 'p',
        text: '**Labels** ([managing labels](managing-labels)) tag issues and PRs for filtering and routing — every repo starts with defaults like `bug`, `enhancement`, `documentation`. **Milestones** ([about milestones](about-milestones)) group work toward a dated goal and show a progress bar of open versus closed items. Labels answer "what kind of thing is this?", milestones answer "which deadline does it belong to?"',
      },
      {
        kind: 'list',
        items: [
          'Label per kind of work; keep the set small and meaningful.',
          'Milestone per release or sprint; dates optional but progress is automatic.',
          'A project workflow can automate label/board moves — see [built-in automations](built-in-automations) for field-sync and item-archiving presets.',
        ],
      },
      { kind: 'h3', text: 'Small helpers with exam weight' },
      {
        kind: 'p',
        text: '**Saved replies** ([about saved replies](about-saved-replies)) are canned responses for the comments you type twice a day — clarifications, merge-request checklists, thanks. **Assignees** put a person on the hook for an issue or PR (up to ten each); assigning is a signal of ownership, not a permission. On pull requests, being requested as **reviewer** and being **assignee** are different roles — the exam checks that you know the difference.',
      },
      { kind: 'h3', text: 'Project insights' },
      {
        kind: 'p',
        text: 'A project can chart its own data — [insights](about-project-insights) builds configurable charts (burn-up, cumulative flow, custom) from the items in the project, and the charts can be shared with people outside the project. Where repository insights (domain 2) show code activity, project insights show planning progress.',
      },
      {
        kind: 'table',
        headers: ['Tool', 'Question it answers'],
        rows: [
          ['Project (board/table)', 'What is the state of the work?'],
          ['Milestone', 'How far along is this dated goal?'],
          ['Label', 'What kind of item is this?'],
          ['Project insights', 'Is the work trending toward done?'],
        ],
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Projects hold issues, PRs, and drafts; custom fields and multiple views with different layouts.',
          'Labels classify; milestones group toward dated goals.',
          'Saved replies speed up repeated comments; assignees signal ownership.',
          'Project insights chart planning progress and can be shared.',
        ],
      },
    ],
  },
};
