/**
 * Compare-section data: GitHub Actions against Jenkins and against the AWS
 * CI/CD services, one dimension per row.
 *
 * House rules, from the plan: every cell states a verifiable property of
 * the tool and cites the vendor doc it comes from as an inline
 * `[label](docId)` link; "when to choose" is framed as fit, never ranking;
 * pricing is described as a model ("per-minute for hosted runners"), never
 * as current dollar figures; and the AWS table fences itself to
 * CodePipeline, CodeBuild, and CodeDeploy plus one related-services note.
 */

import type { CompareData } from './types';

export const COMPARISONS: CompareData[] = [
  {
    id: 'actions-vs-jenkins',
    title: 'GitHub Actions vs Jenkins',
    counterpart: 'Jenkins',
    description:
      'Both automate builds, tests, and deployments — they differ in where the automation lives. Actions is part of GitHub itself: workflows sit next to your code and runners arrive managed. Jenkins is yours: a controller you install and a fleet of agents you shape to anything. Teams embedded in GitHub usually start with Actions; teams with deep custom pipelines or an existing agent fleet often keep Jenkins.',
    rows: [
      {
        dimension: 'Hosting model',
        github:
          'A feature of the GitHub service — nothing to install for CI itself; [workflows run where your code lives](gh-docs-actions).',
        other:
          'Self-hosted by design: you [install and operate the controller](jenkins-installing) on infrastructure you own.',
      },
      {
        dimension: 'Configuration',
        github:
          '[Workflow YAML](workflow-syntax) in `.github/workflows/`, versioned and reviewed with the code it builds.',
        other:
          'A [Jenkinsfile](jenkins-pipeline-syntax) (declarative or scripted) in the repository, interpreted by the controller.',
      },
      {
        dimension: 'Execution model',
        github:
          'Each job gets a [runner](github-hosted-runners) — a fresh managed machine per job, or [self-hosted runners](self-hosted-runners) you register.',
        other:
          'Builds run on [agents](jenkins-agents) attached to the controller; you decide their labels, capacity, and cleanup.',
      },
      {
        dimension: 'Ecosystem',
        github:
          '[Marketplace actions](github-marketplace) referenced with `uses:` per workflow — nothing pre-installed on the runner.',
        other:
          '[Plugins](jenkins-plugins) installed on the controller itself, shared by every job it runs.',
      },
      {
        dimension: 'GitHub integration',
        github:
          'Native: [repository events](workflow-events) trigger workflows, results appear as checks, and the built-in token authenticates.',
        other:
          'GitHub arrives through [plugins](jenkins-plugins) and webhooks — capable, but wired and maintained separately.',
      },
      {
        dimension: 'Auth and secrets',
        github:
          '[Secrets](use-secrets) at organization, repository, and environment scope, plus the ephemeral per-job token.',
        other:
          'Credentials managed on the controller (credential store and [plugins](jenkins-docs)), scoped by its own security model.',
      },
      {
        dimension: 'Scaling',
        github:
          'Hosted runners are [provisioned per job](github-hosted-runners); self-hosted fleets grow by registering machines or autoscaling.',
        other:
          'Scale by adding [agents](jenkins-agents); controller capacity and plugin load stay part of your planning.',
      },
      {
        dimension: 'Maintenance burden',
        github:
          'The [hosted runner images](github-hosted-runners) are patched by GitHub — self-hosted runners hand that back to you.',
        other:
          'You patch the controller, its [installation](jenkins-installing), plugins, and agents — the cost of full control.',
      },
      {
        dimension: 'Pricing model',
        github:
          'Included allowances, then [per-minute billing](billing-actions) for hosted runners plus storage; self-hosted runners add no runner minutes.',
        other:
          'The [software is free](jenkins-docs); you pay for the infrastructure it runs on and the people operating it.',
      },
      {
        dimension: 'When it fits',
        github:
          'Teams living in GitHub who want [event-driven automation](gh-docs-actions) reviewed beside the code, with zero CI servers to run.',
        other:
          'Teams with bespoke [pipeline logic](jenkins-pipeline-syntax), existing agent investments, or build needs outside GitHub’s runner model.',
      },
    ],
  },
  {
    id: 'actions-vs-aws',
    title: 'GitHub Actions vs AWS CI/CD services',
    counterpart: 'AWS CI/CD services',
    description:
      'Actions is one platform spanning build, test, and deploy; on AWS the same ground is covered by cooperating services — CodePipeline orchestrating stages, CodeBuild compiling and testing, CodeDeploy shipping to servers, Lambda, or ECS. If your pipeline must trigger deployment tactics deeply tied to AWS compute, the AWS family earns its plumbing; if your source of truth is a GitHub repository, Actions keeps the whole loop in one place.',
    rows: [
      {
        dimension: 'Scope',
        github:
          'One platform for CI and CD: build, test, and deploy in [workflows](gh-docs-actions).',
        other:
          '[CodePipeline](aws-codepipeline) orchestrates; [CodeBuild](aws-codebuild) builds and tests; [CodeDeploy](aws-codedeploy) deploys.',
      },
      {
        dimension: 'Hosting',
        github:
          'Jobs run on [GitHub-hosted runners](github-hosted-runners) or machines you register.',
        other:
          '[CodeBuild](aws-codebuild) is a managed build fleet; [CodeDeploy](aws-codedeploy) reaches EC2, on-premises, Lambda, and ECS.',
      },
      {
        dimension: 'Configuration',
        github:
          '[Workflow YAML](workflow-syntax) in the repository, versioned with the product.',
        other:
          '[Pipeline structure](aws-codepipeline) defined in the service (console, CLI, or infrastructure-as-code) plus a buildspec per [CodeBuild project](aws-codebuild).',
      },
      {
        dimension: 'GitHub integration',
        github:
          'Runs on [repository events](workflow-events) natively — pull requests, pushes, releases.',
        other:
          'GitHub is a [source stage](aws-codepipeline) through a connection; the pipeline’s triggers live in AWS.',
      },
      {
        dimension: 'Artifacts and storage',
        github:
          '[Artifacts](store-artifacts) passed between jobs, retained per policy.',
        other:
          '[Pipeline artifacts](aws-codepipeline) flow stage to stage, backed by S3 buckets you account for.',
      },
      {
        dimension: 'Secrets',
        github:
          '[Secrets](use-secrets) in the GitHub store — or no stored cloud keys at all via [OIDC federation](openid-connect).',
        other:
          'AWS-native identity: IAM roles and Secrets Manager integrated with every [action](aws-codepipeline) in the pipeline.',
      },
      {
        dimension: 'Pricing model',
        github:
          'Per-minute [billing](billing-actions) for hosted runners plus storage; self-hosted runners add no runner minutes.',
        other:
          '[CodeBuild](aws-codebuild) bills per build minute; [CodePipeline](aws-codepipeline) and [CodeDeploy](aws-codedeploy) bill per pipeline and per deployment.',
      },
      {
        dimension: 'Ecosystem',
        github:
          'Compose from [Marketplace actions](github-marketplace) and your own — one `uses:` line each.',
        other:
          'Compose from AWS services and partners; every stage is an [action or plugin](aws-codepipeline) you wire into the pipeline.',
      },
      {
        dimension: 'When it fits',
        github:
          'GitHub-hosted projects that want [the whole loop](gh-docs-actions) — trigger, build, deploy — beside the code.',
        other:
          'AWS-centric delivery where stages must drive AWS compute directly — [rolling and blue/green deployments](aws-codedeploy), Lambda shifts, ECS task sets.',
      },
      {
        dimension: 'Related AWS services',
        github:
          'Actions plays the pipeline role; package stores live outside it either way.',
        other:
          'Alongside the core three: [CodeArtifact](aws-codeartifact) for package management, ECR for container images, EKS for the clusters deployments land on.',
      },
    ],
  },
];
