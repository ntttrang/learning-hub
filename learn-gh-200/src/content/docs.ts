/**
 * Registry of official documentation links.
 *
 * Content references docs by `docId` only — never by raw URL — so the link
 * lives in exactly one place. Phase 1 seeded the roots; phase 2 added every
 * page the GH-900 lessons and labs cite; phase 3 added the GH-200 pages plus
 * the two links the living lab needs into this repository itself; phase 5
 * added the Jenkins and AWS pages the Compare section cites. All URLs
 * were resolved (curl -L) against live docs on 2026-08-19 and stored in
 * canonical form — the address GitHub redirects to, not the address that
 * redirects. This is also why `git grep https://` over src/ only ever hits
 * this file.
 */

export interface DocEntry {
  title: string;
  url: string;
}

export const DOCS: Record<string, DocEntry> = {
  // Official study guides for both certifications.
  'gh900-study-guide': {
    title: 'GitHub Foundations (GH-900) study guide',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-900',
  },
  'gh200-study-guide': {
    title: 'GitHub Actions (GH-200) study guide',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-200',
  },

  // docs.github.com roots used across lessons.
  'gh-docs-actions': {
    title: 'GitHub Actions documentation',
    url: 'https://docs.github.com/en/actions',
  },
  'gh-docs-repositories': {
    title: 'Repositories documentation',
    url: 'https://docs.github.com/en/repositories',
  },

  // Domain 1 — Git and GitHub basics.
  'about-git': {
    title: 'About Git',
    url: 'https://docs.github.com/en/get-started/using-git/about-git',
  },
  'hello-world': {
    title: 'Hello World',
    url: 'https://docs.github.com/en/get-started/using-github/hello-world',
  },
  'github-flow': {
    title: 'GitHub flow',
    url: 'https://docs.github.com/en/get-started/using-github/github-flow',
  },
  'types-of-github-accounts': {
    title: 'Types of GitHub accounts',
    url: 'https://docs.github.com/en/get-started/learning-about-github/types-of-github-accounts',
  },
  'markdown-formatting': {
    title: 'Basic writing and formatting syntax',
    url: 'https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax',
  },
  'github-mobile': {
    title: 'GitHub Mobile',
    url: 'https://docs.github.com/en/get-started/using-github/github-mobile',
  },
  'github-desktop': {
    title: 'GitHub Desktop documentation',
    url: 'https://docs.github.com/en/desktop',
  },

  // Domain 2 — Work with GitHub repositories.
  'creating-a-repository': {
    title: 'Creating a new repository',
    url: 'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository',
  },
  'about-readmes': {
    title: 'About READMEs',
    url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes',
  },
  'licensing-a-repository': {
    title: 'Licensing a repository',
    url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository',
  },
  'contributing-guidelines': {
    title: 'Setting guidelines for repository contributors',
    url: 'https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors',
  },
  'about-code-owners': {
    title: 'About code owners',
    url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners',
  },
  'add-security-policy': {
    title: 'Adding a security policy to your repository',
    url: 'https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/add-security-policy',
  },
  'community-health-files': {
    title: 'Creating a default community health file',
    url: 'https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file',
  },
  'about-repository-graphs': {
    title: 'About repository graphs',
    url: 'https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/about-repository-graphs',
  },

  // Domain 3 — Collaborate using GitHub.
  'about-issues': {
    title: 'About issues',
    url: 'https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues',
  },
  'about-pull-requests': {
    title: 'About pull requests',
    url: 'https://docs.github.com/en/pull-requests/reference/pull-requests',
  },
  'linking-pr-to-issue': {
    title: 'Linking a pull request to an issue',
    url: 'https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue',
  },
  'filtering-issues': {
    title: 'Filtering and searching issues and pull requests',
    url: 'https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests',
  },
  'issue-pr-templates': {
    title: 'About issue and pull request templates',
    url: 'https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates',
  },
  'about-discussions': {
    title: 'About discussions',
    url: 'https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/about-discussions',
  },
  'about-notifications': {
    title: 'About notifications',
    url: 'https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications',
  },
  'about-gists': {
    title: 'Creating gists',
    url: 'https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists',
  },
  'about-wikis': {
    title: 'About wikis',
    url: 'https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis',
  },
  'about-github-pages': {
    title: 'What is GitHub Pages?',
    url: 'https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages',
  },

  // Domain 4 — Apply modern development practices.
  'copilot-get-started': {
    title: 'Get started with GitHub Copilot',
    url: 'https://docs.github.com/en/copilot/get-started',
  },
  'copilot-plans': {
    title: 'Copilot plans',
    url: 'https://docs.github.com/en/copilot/get-started/plans',
  },
  'copilot-cloud-agent': {
    title: 'About the GitHub Copilot cloud agent',
    url: 'https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent',
  },
  'copilot-agent-mode': {
    title: 'Build applications with GitHub Copilot Agent Mode',
    url: 'https://learn.microsoft.com/en-us/training/modules/github-copilot-agent-mode/',
  },
  'what-are-codespaces': {
    title: 'What are GitHub Codespaces?',
    url: 'https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces',
  },
  'codespaces-quickstart': {
    title: 'Codespaces quickstart',
    url: 'https://docs.github.com/en/codespaces/quickstart',
  },
  'dev-containers': {
    title: 'Introduction to dev containers',
    url: 'https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers',
  },
  'githubdev-editor': {
    title: 'The github.dev web-based editor',
    url: 'https://docs.github.com/en/codespaces/the-githubdev-web-based-editor',
  },
  'codespaces-list': {
    title: 'Your codespaces (github.com/codespaces)',
    url: 'https://github.com/codespaces',
  },

  // Domain 5 — Manage projects with GitHub.
  'projects-docs': {
    title: 'Planning and tracking with Projects',
    url: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects',
  },
  'about-projects': {
    title: 'About Projects',
    url: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects',
  },
  'project-view-layouts': {
    title: 'Changing the layout of a view',
    url: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view',
  },
  'managing-labels': {
    title: 'Managing labels',
    url: 'https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels',
  },
  'about-milestones': {
    title: 'About milestones',
    url: 'https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones',
  },
  'built-in-automations': {
    title: 'Using the built-in automations',
    url: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations',
  },
  'about-saved-replies': {
    title: 'About saved replies',
    url: 'https://docs.github.com/en/get-started/writing-on-github/working-with-saved-replies/about-saved-replies',
  },
  'about-project-insights': {
    title: 'About insights for Projects',
    url: 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects',
  },

  // Domain 6 — Privacy, security, and administration.
  'configure-2fa': {
    title: 'Configuring two-factor authentication',
    url: 'https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication',
  },
  'about-passkeys': {
    title: 'About passkeys',
    url: 'https://docs.github.com/en/authentication/authenticating-with-a-passkey/about-passkeys',
  },
  'repository-roles': {
    title: 'Repository roles for an organization',
    url: 'https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization',
  },
  'roles-in-an-organization': {
    title: 'Roles in an organization',
    url: 'https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization',
  },
  'about-teams': {
    title: 'About teams',
    url: 'https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams',
  },
  'about-organizations': {
    title: 'About organizations',
    url: 'https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations',
  },
  'enterprise-managed-users': {
    title: 'About Enterprise Managed Users',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users',
  },
  'setting-repository-visibility': {
    title: 'Setting repository visibility',
    url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility',
  },
  'about-protected-branches': {
    title: 'About protected branches',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches',
  },

  // Domain 7 — Explore the GitHub community.
  'github-sponsors': {
    title: 'GitHub Sponsors documentation',
    url: 'https://docs.github.com/en/sponsors',
  },
  'following-people': {
    title: 'Following people',
    url: 'https://docs.github.com/en/get-started/exploring-projects-on-github/following-people',
  },
  'following-organizations': {
    title: 'Following organizations',
    url: 'https://docs.github.com/en/get-started/exploring-projects-on-github/following-organizations',
  },
  'github-marketplace': {
    title: 'GitHub Marketplace',
    url: 'https://docs.github.com/en/apps/github-marketplace',
  },
  'innersource-module': {
    title: 'Manage an InnerSource program by using GitHub',
    url: 'https://learn.microsoft.com/en-us/training/modules/manage-innersource-program-github/',
  },
  'innersource-best-practices': {
    title: 'Using innersource in your enterprise',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-best-practices/use-innersource',
  },
  'about-forks': {
    title: 'About forks',
    url: 'https://docs.github.com/en/pull-requests/reference/forks',
  },
  'template-repositories': {
    title: 'Creating a template repository',
    url: 'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository',
  },
  'ways-to-contribute': {
    title: 'Finding ways to contribute to open source on GitHub',
    url: 'https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github',
  },

  // GH-200 reference: workflow syntax, events, commands, contexts, expressions.
  'workflow-syntax': {
    title: 'Workflow syntax for GitHub Actions',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax',
  },
  'workflow-events': {
    title: 'Events that trigger workflows',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows',
  },
  'workflow-commands': {
    title: 'Workflow commands for GitHub Actions',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands',
  },
  'contexts': {
    title: 'Contexts',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/contexts',
  },
  'expressions': {
    title: 'Expressions',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/expressions',
  },
  'metadata-syntax': {
    title: 'Metadata syntax for GitHub Actions',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax',
  },

  // GH-200 authoring: reuse, templates, and action publishing.
  'reuse-workflows': {
    title: 'Reusing workflows',
    url: 'https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows',
  },
  'reuse-config': {
    title: 'Reusing workflow configurations (YAML anchors)',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations',
  },
  'share-with-enterprise': {
    title: 'Share actions and workflows with your enterprise',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/reuse-automations/share-with-your-enterprise',
  },
  'workflow-templates': {
    title: 'Using starter workflows and workflow templates',
    url: 'https://docs.github.com/en/actions/how-tos/write-workflows/use-workflow-templates',
  },
  'create-composite-action': {
    title: 'Creating a composite action',
    url: 'https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action',
  },
  'release-actions': {
    title: 'Releasing and maintaining actions',
    url: 'https://docs.github.com/en/actions/how-tos/create-and-publish-actions/release-and-maintain-actions',
  },
  'publish-actions': {
    title: 'Publishing actions in the GitHub Marketplace',
    url: 'https://docs.github.com/en/actions/how-tos/create-and-publish-actions/publish-in-github-marketplace',
  },

  // GH-200 execution mechanics: services, caching, artifacts, variables, secrets.
  'service-containers': {
    title: 'About service containers',
    url: 'https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers',
  },
  'dependency-caching': {
    title: 'Caching dependencies to speed up workflows',
    url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching',
  },
  'store-artifacts': {
    title: 'Storing and sharing data from your workflow',
    url: 'https://docs.github.com/en/actions/tutorials/store-and-share-data',
  },
  'use-variables': {
    title: 'Variables and environment files',
    url: 'https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables',
  },
  'use-secrets': {
    title: 'Using secrets in GitHub Actions',
    url: 'https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets',
  },
  'manage-environments': {
    title: 'Using environments for deployment',
    url: 'https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments',
  },

  // GH-200 monitoring, troubleshooting, and workflow lifecycle.
  'view-run-history': {
    title: 'Viewing workflow run history',
    url: 'https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history',
  },
  'troubleshoot-workflows': {
    title: 'Troubleshooting workflows',
    url: 'https://docs.github.com/en/actions/how-tos/troubleshoot-workflows',
  },
  'disable-workflows': {
    title: 'Disabling and enabling a workflow',
    url: 'https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows',
  },
  'status-badges': {
    title: 'Adding a workflow status badge',
    url: 'https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge',
  },

  // GH-200 runners and enterprise management.
  'github-hosted-runners': {
    title: 'About GitHub-hosted runners',
    url: 'https://docs.github.com/en/actions/concepts/runners/github-hosted-runners',
  },
  'self-hosted-runners': {
    title: 'About self-hosted runners',
    url: 'https://docs.github.com/en/actions/concepts/runners/self-hosted-runners',
  },
  'runner-groups': {
    title: 'Managing access to self-hosted runners using groups',
    url: 'https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access',
  },
  'org-actions-policy': {
    title: 'Disabling or limiting GitHub Actions for your organization',
    url: 'https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization',
  },
  'ip-allow-lists': {
    title: 'Restricting network traffic with an IP allow list',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/hardening-security-for-your-enterprise/restricting-network-traffic-to-your-enterprise-with-an-ip-allow-list',
  },
  'runner-images': {
    title: 'GitHub-hosted runner images (preinstalled software)',
    url: 'https://github.com/actions/runner-images',
  },
  'rest-actions': {
    title: 'GitHub Actions REST API',
    url: 'https://docs.github.com/en/rest/actions',
  },

  // GH-200 security and optimization.
  'secure-use': {
    title: 'Security hardening for GitHub Actions',
    url: 'https://docs.github.com/en/actions/reference/security/secure-use',
  },
  'github-token': {
    title: 'Authenticating with the GITHUB_TOKEN',
    url: 'https://docs.github.com/en/actions/tutorials/authenticate-with-github_token',
  },
  'openid-connect': {
    title: 'About security hardening with OpenID Connect',
    url: 'https://docs.github.com/en/actions/concepts/security/openid-connect',
  },
  'artifact-attestations': {
    title: 'Using artifact attestations to establish provenance for builds',
    url: 'https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations',
  },
  'billing-actions': {
    title: 'About billing for GitHub Actions',
    url: 'https://docs.github.com/en/billing/concepts/product-billing/github-actions',
  },

  // Compare-section counterparts — the first non-GitHub pages in the registry.
  // Verified against live docs on 2026-08-19 like every other entry.
  'jenkins-docs': {
    title: 'Jenkins user documentation',
    url: 'https://www.jenkins.io/doc/',
  },
  'jenkins-pipeline-syntax': {
    title: 'Pipeline syntax (Jenkins)',
    url: 'https://www.jenkins.io/doc/book/pipeline/syntax/',
  },
  'jenkins-agents': {
    title: 'Using Jenkins agents',
    url: 'https://www.jenkins.io/doc/book/using/using-agents/',
  },
  'jenkins-plugins': {
    title: 'Jenkins plugins index',
    url: 'https://plugins.jenkins.io/',
  },
  'jenkins-installing': {
    title: 'Installing Jenkins',
    url: 'https://www.jenkins.io/doc/book/installing/',
  },
  'aws-codepipeline': {
    title: 'What is AWS CodePipeline?',
    url: 'https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html',
  },
  'aws-codebuild': {
    title: 'What is AWS CodeBuild?',
    url: 'https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html',
  },
  'aws-codedeploy': {
    title: 'What is AWS CodeDeploy?',
    url: 'https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html',
  },
  'aws-codeartifact': {
    title: 'What is AWS CodeArtifact?',
    url: 'https://docs.aws.amazon.com/codeartifact/latest/ug/what-is-codeartifact.html',
  },

  // This site's own pipeline — the living lab's two required links.
  'repo-deploy-workflow': {
    title: 'This site’s deploy workflow (.github/workflows/deploy.yml)',
    url: 'https://github.com/ntttrang/learn-gh-200/blob/main/.github/workflows/deploy.yml',
  },
  'repo-actions-runs': {
    title: 'This repository’s Actions runs',
    url: 'https://github.com/ntttrang/learn-gh-200/actions',
  },
};

/** Resolve a docId to its URL; unknown ids return undefined. */
export function docUrl(docId: string): string | undefined {
  return DOCS[docId]?.url;
}

/** Resolve a docId to its human title; unknown ids fall back to the key. */
export function docTitle(docId: string): string {
  return DOCS[docId]?.title ?? docId;
}
