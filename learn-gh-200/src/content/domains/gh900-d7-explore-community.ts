import type { Domain } from '../types';

/**
 * GH-900 domain 7 — Explore the GitHub community (5–10%).
 *
 * The open-ecosystem domain: open source participation and Sponsors, keeping
 * up with people and orgs, the Marketplace, InnerSource, and the mechanics of
 * forks, templates, and discoverability.
 */
export const domain: Domain = {
  id: 'gh900-d7',
  cert: 'gh900',
  number: 7,
  title: 'Explore the GitHub community',
  weightMin: 5,
  weightMax: 10,
  summary:
    'Open source and Sponsors, following people and organizations, Marketplace, InnerSource, forks and templates.',
  subSkills: [
    {
      id: 'd7-open-source-sponsors',
      title: 'Open source and GitHub Sponsors',
      docIds: ['ways-to-contribute', 'github-sponsors'],
    },
    {
      id: 'd7-following',
      title: 'Following users and organizations',
      docIds: ['following-people', 'following-organizations'],
    },
    {
      id: 'd7-marketplace',
      title: 'GitHub Marketplace',
      docIds: ['github-marketplace'],
    },
    {
      id: 'd7-innersource',
      title: 'InnerSource',
      docIds: ['innersource-module', 'innersource-best-practices'],
    },
    {
      id: 'd7-forks-templates-discovery',
      title: 'Forks, templates, and discoverable repositories',
      docIds: ['about-forks', 'template-repositories'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d7',
    domainId: 'gh900-d7',
    title: 'The GitHub community',
    minutes: 10,
    blocks: [
      { kind: 'h3', text: 'Open source is the default setting' },
      {
        kind: 'p',
        text: 'GitHub grew around public, forkable, contributable code — [finding ways to contribute](ways-to-contribute) is a documented workflow: explore topics, check a repo’s good-first-issue style labels, read the CONTRIBUTING, and open a PR. The whole machinery you learned in domains 1–3 exists to let a stranger say "here is a fix" in five minutes.',
      },
      {
        kind: 'p',
        text: '**[GitHub Sponsors](github-sponsors)** is the funding side: sponsor the people and projects whose work you rely on, monthly or one-time; maintainers set tiers. Know the pairing the exam tests — Stars signal interest, Sponsors move money.',
      },
      { kind: 'h3', text: 'Keeping up: following' },
      {
        kind: 'p',
        text: 'Follow [people](following-people) to see their public activity in your dashboard feed — a discover-communities signal, not a notification firehose. Follow [organizations](following-organizations) to surface their repositories. Following is public; watching a repository (domain 3) is the tool for notifications about that repo.',
      },
      {
        kind: 'tip',
        text: 'Follow ≠ watch. Following shows a person’s public activity in your feed; watching subscribes you to a repository’s notifications.',
      },
      { kind: 'h3', text: 'The Marketplace' },
      {
        kind: 'p',
        text: '[GitHub Marketplace](github-marketplace) lists apps and Actions that extend GitHub — CI providers, dependency bots, deployment tools. Some are free, some paid; anything with broad repository access should be reviewed before installing, and organization installs are governed by org policy. Think of it as the app store for repository automation.',
      },
      { kind: 'h3', text: 'InnerSource: open source mechanics, inside walls' },
      {
        kind: 'p',
        text: '**InnerSource** applies open source practices — transparency, contribution over assignment, discoverable work — to software built inside an organization. The payoff is reuse: anyone can find, read, and propose changes to a teammate team’s repository instead of rebuilding it. GitHub’s guidance ([manage an InnerSource program](innersource-module), [using innersource in your enterprise](innersource-best-practices)) boils down to discoverability, contribution guidelines, and receptive maintainers — the same key files from domain 2, pointed inward.',
      },
      { kind: 'h3', text: 'Forks, templates, and discoverability' },
      {
        kind: 'p',
        text: 'A **fork** ([about forks](about-forks)) is your own copy of someone’s repository, still linked to the original for pull requests back upstream — the unit of open source contribution. A **template repository** starts a new, unlinked project with the original’s structure. One exam-flavored distinction: a fork carries history and a relationship; a template copies a shape and starts fresh.',
      },
      {
        kind: 'table',
        headers: ['Start from', 'You get', 'Linked to original?'],
        rows: [
          ['Fork', 'Full copy with history', 'Yes — PRs can flow back upstream'],
          ['Template repository', 'Structure and files, fresh history', 'No'],
          ['Import', 'Code and history from another host', 'No'],
        ],
      },
      {
        kind: 'p',
        text: 'Discoverability ties the domain together: topics, descriptions, a good README, and stars make repositories findable; for your own organization, discoverability is what makes InnerSource work.',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Contribution path: explore → labels → CONTRIBUTING → PR.',
          'Sponsors fund people; stars bookmark them.',
          'Follow = feed activity; watch = notifications.',
          'Marketplace extends repos with apps and Actions.',
          'InnerSource = open source practices inside an org.',
          'Fork = linked copy for contribution; template = fresh start.',
        ],
      },
    ],
  },
};
