import type { Domain } from '../types';

/**
 * GH-900 domain 6 — Understand privacy, security, and administration
 * (10–15%).
 *
 * Who can do what: account hardening with 2FA and passkeys, permission
 * ladders from repo to org, EMU identity, visibility, branch protection, and
 * the org admin surface.
 */
export const domain: Domain = {
  id: 'gh900-d6',
  cert: 'gh900',
  number: 6,
  title: 'Understand privacy, security, and administration',
  weightMin: 10,
  weightMax: 15,
  summary:
    '2FA and passkeys, repository and organization permissions, Enterprise Managed Users, visibility, branch protection, and org settings.',
  subSkills: [
    {
      id: 'd6-2fa-passkeys',
      title: 'Two-factor authentication and passkeys',
      docIds: ['configure-2fa', 'about-passkeys'],
    },
    {
      id: 'd6-permissions-roles',
      title: 'Repository and organization permissions and roles',
      docIds: ['repository-roles', 'roles-in-an-organization'],
    },
    {
      id: 'd6-emu-policy',
      title: 'Enterprise Managed Users and Copilot policy',
      docIds: ['enterprise-managed-users', 'copilot-plans'],
    },
    {
      id: 'd6-visibility-protection',
      title: 'Visibility settings and branch protection',
      docIds: ['setting-repository-visibility', 'about-protected-branches'],
    },
    {
      id: 'd6-org-settings-teams',
      title: 'Organization settings, teams, and roles',
      docIds: ['about-organizations', 'about-teams'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d6',
    domainId: 'gh900-d6',
    title: 'Privacy, security, and administration',
    minutes: 12,
    blocks: [
      { kind: 'h3', text: 'Locking the front door: 2FA and passkeys' },
      {
        kind: 'p',
        text: 'Passwords alone are the weakest link, so GitHub leans hard on a second factor. **Two-factor authentication** ([configuring 2FA](configure-2fa)) adds a TOTP app or SMS code on top of the password — and code contributors on GitHub.com are required to enable it. **Passkeys** ([about passkeys](about-passkeys)) go further: a cryptographic credential bound to your device (Face ID, Touch ID, Windows Hello, a security key) that cannot be phished the way a one-time code can. On the exam: passkeys can serve as a second factor or as passwordless sign-in.',
      },
      { kind: 'h3', text: 'The permission ladder' },
      {
        kind: 'p',
        text: 'On your own repositories, collaborators get one level: read/write. In an organization, [repository roles](repository-roles) stack: **read**, **triage**, **write**, **maintain**, **admin** — each adding capabilities (triage can manage labels and close issues; maintain can manage the repo without touching dangerous settings; admin owns everything including access). Roles like these apply per repository.',
      },
      {
        kind: 'p',
        text: 'One level up, [organization roles](roles-in-an-organization) govern the org itself — **owner** and **member** by default, plus fine-grained custom roles and base permissions that set what a plain member can do on new repositories. **Teams** ([about teams](about-teams)) are the delivery mechanism: group people, give the team a permission once, and every member inherits it. Prefer team-based access over per-person grants — that sentence is nearly an exam answer.',
      },
      { kind: 'h3', text: 'Enterprise identity: EMU' },
      {
        kind: 'p',
        text: '[Enterprise Managed Users](enterprise-managed-users) lets an enterprise provision and control member accounts through its own identity provider — members sign in with corporate credentials, and the enterprise manages usernames, usernames’ lifecycle, and where those accounts can act. Copilot follows the same pattern at the policy layer: which plans exist and who gets what features is administered per organization or enterprise (see [Copilot plans](copilot-plans)).',
      },
      { kind: 'h3', text: 'Visibility: public, private, internal' },
      {
        kind: 'p',
        text: '[Repository visibility](setting-repository-visibility) decides who can see the code: **public** (everyone), **private** (you and invited collaborators), and — in organizations on paid plans — **internal** (visible to org members by default). Visibility can change over a repository’s life, with consequences: making a private repo public exposes stars and watchers, forks of a privatized repo stay visible to those who forked them.',
      },
      { kind: 'h3', text: 'Branch protection: policy where the code lives' },
      {
        kind: 'p',
        text: '[Protected branches](about-protected-branches) put rules on the default branch (or any branch): require pull request reviews before merge, require status checks to pass, require signed commits, dismiss stale approvals, or lock the branch entirely read-only. This is how "nobody pushes straight to `main`" becomes enforced fact rather than convention — and it connects domain 1’s GitHub Flow to real guardrails.',
      },
      {
        kind: 'tip',
        text: 'Exam pattern: "How do we guarantee no direct pushes to `main` and at least one review?" — branch protection with required reviews and status checks. Not CODEOWNERS alone, not a CONTRIBUTING.md: those guide, they do not enforce.',
      },
      { kind: 'h3', text: 'The organization admin surface' },
      {
        kind: 'p',
        text: 'Org settings ([about organizations](about-organizations)) centralize membership, billing, security (2FA requirements, SSO), and repository defaults. The mental model for the whole domain is three nested scopes: **repository** (code-level rules like branch protection), **organization** (people, teams, defaults), **enterprise** (identity and policy across orgs). Questions usually hand you an action and ask which scope owns it.',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          '2FA is required for contributors; passkeys are phishing-resistant factors or passwordless sign-in.',
          'Repo roles: read → triage → write → maintain → admin.',
          'Org roles govern the org; teams deliver permissions to groups.',
          'EMU = enterprise-managed identity via your IdP.',
          'Visibility: public, private, internal (org plans).',
          'Branch protection enforces reviews, checks, and no direct pushes to `main`.',
        ],
      },
    ],
  },
};
