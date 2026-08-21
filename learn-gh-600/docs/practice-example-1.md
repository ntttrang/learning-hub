# **50 Questions | Estimated Time: 90 minutes | Passing Score: 700/1000**

---

## Domain 1: Prepare Agent Architecture and SDLC Processes (15–20%)

**1.** You are onboarding an AI agent into your team's CI/CD pipeline. Which of the following is the BEST first step?

- A) Configure the agent with full repository write access immediately
- B) Identify the specific SDLC steps the agent will perform and define clear success criteria
- C) Allow the agent to reason freely across all pipeline stages without constraints
- D) Deploy the agent to production before testing in staging

---

**2.** Which of the following is a common **anti-pattern** when integrating agents into the SDLC?

- A) Scoping agent actions to a specific branch
- B) Defining explicit inputs and outputs for each agent task
- C) Allowing an agent to perform planning and execution in a single undifferentiated step
- D) Requiring agent plans to be validated before execution

---

**3.** An agent is configured to plan a refactoring task and then immediately execute it without review. What is the PRIMARY risk of this configuration?

- A) The agent may produce logs that are too verbose
- B) Planning errors propagate directly into code changes before they can be caught
- C) The agent will be unable to create pull requests
- D) The agent's memory will expire during execution

---

**4.** Your organization wants agents to operate autonomously but with human oversight for high-risk actions. Which configuration approach best achieves this?

- A) Disable all human intervention to maximize delivery speed
- B) Require human approval for every single agent action
- C) Plan and implement graduated autonomy levels with guardrails based on risk
- D) Allow agents to self-determine when human approval is needed

---

**5.** An agent is producing outputs that are difficult to audit after the fact. What should you configure to address this?

- A) Increase the agent's memory allocation
- B) Configure the agent to produce inspectable artifacts within standard development tooling
- C) Switch the agent to a different LLM model
- D) Reduce the number of tools available to the agent

---

**6.** You want to prevent an agent from taking any action until a structured plan has been reviewed and approved. Which approach is MOST appropriate?

- A) Set the agent's output format to plain text
- B) Configure the agent to output a structured plan and implement a validation gate before execution
- C) Reduce the agent's context window size
- D) Allow the agent to proceed if no feedback is received within 5 minutes

---

## Domain 2: Implement Tool Use and Environment Interaction (20–25%)

**7.** When selecting tools for an AI agent, what is the primary consideration?

- A) Use as many tools as possible to maximize agent capability
- B) Only use tools that were released in the last 12 months
- C) Identify which tools are specifically required for the agent's defined tasks
- D) Avoid any tools that require network access

---

**8.** You need to add an external data source capability to a GitHub Copilot agent. What is the recommended approach using the Model Context Protocol (MCP)?

- A) Hard-code the data source credentials directly into the agent's prompt
- B) Add an MCP server as a tool to the agent
- C) Create a separate agent for each data source
- D) Use environment variables to pass data directly to the LLM

---

**9.** When configuring an MCP server for a GitHub agent, which security configuration is MOST important to implement?

- A) Enable all available MCP tools by default to improve agent flexibility
- B) Configure MCP allow lists to restrict which tools and servers the agent can access
- C) Set the MCP server to public access to allow cross-organization use
- D) Disable MCP logging to improve performance

---

**10.** An agent needs to be restricted so it can only read and write to a single repository. Which configuration achieves this?

- A) Configure the agent's scope to a specific repository and apply least-privilege permissions
- B) Deploy the agent on a separate virtual machine
- C) Limit the agent's context window to 2,000 tokens
- D) Use a separate GitHub account for the agent

---

**11.** You want an agent to automatically trigger on pull requests in a CI workflow. What should you configure?

- A) A scheduled cron job that checks for open PRs every hour
- B) Configure the agent to be invoked in a CI workflow triggered by pull request events
- C) Manually run the agent each time a PR is opened
- D) Use a webhook that emails the agent

---

**12.** An agent attempting a file change fails due to a permissions error. What is the BEST response strategy?

- A) Retry the action indefinitely until it succeeds
- B) Log the error and silently skip the action
- C) Implement error handling with a defined escalation path and rollback capability
- D) Increase the agent's permission scope automatically

---

**13.** You are configuring an agent to work across multiple branches in a repository. Which configuration is MOST appropriate?

- A) Give the agent global write access to all branches
- B) Configure branch-based scope to limit the agent's actions to relevant branches
- C) Disable branch protection rules while the agent is running
- D) Force all agent changes directly to the main branch

---

**14.** An agent successfully creates a branch and makes code changes but then fails while opening a pull request. What should your implementation include to handle this?

- A) No special handling — the user should manually create the PR
- B) Retry logic and rollback procedures, with an escalation path if recovery fails
- C) Delete the branch and restart the entire task
- D) Increase the timeout value for the PR creation step

---

## Domain 3: Manage Memory, State, and Execution (10–15%)

**15.** An agent is tasked with a multi-step code migration that may take several hours. Midway through, the execution is interrupted. What memory strategy should be implemented?

- A) Restart the agent from the beginning each time it is interrupted
- B) Use only in-context (short-term) memory
- C) Capture task progress and decisions as durable artifacts to enable resumption
- D) Require a human to manually record the agent's progress

---

**16.** Which of the following BEST describes "context drift" in agentic AI systems?

- A) When an agent uses too many tools simultaneously
- B) When an agent's execution diverges from its prior decisions or task intent over time
- C) When an agent's memory is stored in an external database
- D) When two agents share the same context window

---

**17.** You need an agent to remember user preferences across multiple sessions. Which memory type is MOST appropriate?

- A) Short-term in-context memory
- B) Long-term or external memory that persists across sessions
- C) No memory — agents should start fresh each session
- D) Branch-scoped memory that resets on merge

---

**18.** An agent is sharing state with another agent in a multi-agent workflow. What is the PRIMARY risk to manage?

- A) The agents may generate too many log entries
- B) Conflicting or stale context leading to inconsistent decisions
- C) The agents may use the same tool twice
- D) The shared state may consume too much CPU

---

**19.** When should memory pruning rules be applied in an agent's memory strategy?

- A) Only when the agent encounters an error
- B) Never — all memory should be preserved indefinitely
- C) According to defined expiration policies to prevent stale information from influencing decisions
- D) Only when an agent is retired

---

**20.** An agent resumes a long-running task but begins making decisions that contradict its earlier work. What mechanism should be in place to prevent this?

- A) Longer context windows
- B) Drift detection logic and correction mechanisms that compare current state to prior decisions
- C) Switching to a more powerful LLM
- D) Resetting all memory before each step

---

## Domain 4: Perform Evaluation, Error Analysis, and Tuning (15–20%)

**21.** Which of the following is an example of a **quantitative** evaluation signal for an agent?

- A) A developer's subjective rating of code quality
- B) The percentage of agent-generated PRs that pass CI checks without modification
- C) Whether the agent's output "feels right" to the reviewer
- D) Team satisfaction surveys

---

**22.** An agent is consistently selecting the wrong tool for a given task. What is the MOST likely root cause?

- A) Memory expiration policy is too aggressive
- B) The agent's instructions do not clearly define when each tool should be used
- C) The agent is missing long-term memory
- D) The CI workflow trigger is misconfigured

---

**23.** After reviewing agent logs, you discover that an agent failed because it acted on outdated context. How should this failure be classified?

- A) Reasoning error
- B) Tool misconfiguration
- C) Context or environment issue
- D) Network failure

---

**24.** You want to generate evaluation signals for your agent automatically during CI runs. Which approach is MOST aligned with the GH-600 exam objectives?

- A) Have developers manually review every agent output
- B) Use automated scanning tools to generate evaluation signals during pipeline execution
- C) Compare agent outputs to competitors' agents
- D) Run the agent on production traffic and gather feedback after the fact

---

**25.** An agent produces correct outputs in testing but consistently fails in production. After analysis, you determine the agent is receiving different inputs in each environment. How should you tune the agent?

- A) Deploy the same test inputs to production
- B) Disable the agent in production until inputs are identical to test
- C) Revise the agent's instructions and constraints to handle environment-specific input variability
- D) Increase the agent's memory allocation

---

**26.** When tuning an agent based on evaluation results, which combination of levers is MOST comprehensive?

- A) Only modify the LLM model used
- B) Revise instructions, refine memory usage, and adjust tool access as needed
- C) Delete and rebuild the agent from scratch
- D) Only modify the CI pipeline triggers

---

**27.** An agent is performing well on most tasks but fails on edge cases involving complex reasoning chains. What is the BEST first tuning action?

- A) Add more tools to the agent
- B) Extend the agent's token limit
- C) Analyze traces and plans from failed runs to identify where reasoning breaks down, then revise instructions
- D) Switch to a different agent orchestration pattern

---

## Domain 5: Orchestrate Multi-Agent Coordination (15–20%)

**28.** You are designing a workflow where three specialized agents must work in parallel on independent subtasks and then merge their results. Which orchestration pattern should you apply?

- A) Sequential chaining — agents run one after another
- B) Parallel execution with agent isolation and a merge/aggregation step
- C) Single-agent execution with multiple tool calls
- D) Human-in-the-loop for all three agents simultaneously

---

**29.** Two agents are both attempting to modify the same file in a repository. What is this type of conflict called, and how should it be resolved?

- A) A memory collision — resolved by clearing agent memory
- B) An overlapping code change conflict — resolved by configuring agent isolation and conflict detection
- C) A tool misuse error — resolved by disabling file write tools
- D) A context drift — resolved by resetting both agents

---

**30.** You need to audit what decisions were made across a multi-agent workflow that ran last week. What should have been configured in advance to support this?

- A) Each agent should have had verbose console logging only
- B) The workflow should have been configured to produce artifacts documenting key decisions, handoffs, and outcomes
- C) A developer should have watched the workflow run in real time
- D) The agents should have emailed status updates

---

**31.** An agent in a multi-agent workflow produces no output and stops responding. How should the system respond?

- A) Continue the workflow and skip the failed agent's contribution
- B) Detect the stalled execution, trigger a recovery pattern (such as rollback or human-in-the-loop), and alert operators
- C) Restart all agents in the workflow from the beginning
- D) Increase the timeout for the stalled agent indefinitely

---

**32.** You want to add a new specialized agent to an existing multi-agent workflow without disrupting currently running executions. What is the BEST approach?

- A) Shut down the entire workflow, add the agent, and restart
- B) Add the new agent to the workflow definition using a non-breaking update pattern, ensuring it does not interfere with active executions
- C) Deploy the new agent to a completely separate workflow
- D) Require all active executions to complete before making any changes

---

**33.** An agent that was part of a multi-agent workflow is being retired. What must be preserved to maintain workflow integrity?

- A) The agent's in-context memory only
- B) Nothing — retiring an agent removes all associated data
- C) Auditability records and workflow continuity for downstream agents
- D) The agent's tool configuration only

---

**34.** Which of the following BEST describes the purpose of post-hoc analysis in multi-agent workflows?

- A) Previewing agent behavior before deployment
- B) Reviewing logs, artifacts, and operational signals after execution to understand and improve multi-agent behavior
- C) Testing agents in a sandbox environment
- D) Monitoring agents in real time during execution

---

## Domain 6: Implement Guardrails and Accountability (10–15%)

**35.** Your organization has a compliance policy requiring that production database schema changes never be made without a DBA review. How should this be enforced for agents?

- A) Train developers to remind the agent not to make schema changes
- B) Block schema change actions that violate the compliance policy and require explicit authorization before proceeding
- C) Allow agents to make schema changes and review them afterward
- D) Limit agents to read-only database access for all operations

---

**36.** An agent is tasked with deleting test data as part of a cleanup workflow. This action is irreversible. What guardrail should be applied?

- A) Allow the deletion automatically since it is only test data
- B) Require explicit human authorization before executing any irreversible action
- C) Log the deletion after it occurs
- D) Retry the deletion if it fails the first time

---

**37.** Which principle should guide how permissions are assigned to agents?

- A) Maximum privilege — agents should be able to do anything a senior engineer can do
- B) Least-privilege — scope permissions to only what is required for the agent's defined tasks
- C) Role inheritance — agents automatically inherit the permissions of the user who created them
- D) Dynamic escalation — agents request elevated permissions when needed

---

**38.** You are classifying agent actions to determine which require human intervention. An agent wants to merge a PR to the main branch of a production repository. How should this action be classified?

- A) Low risk — no human intervention required
- B) Medium risk — log it but allow automatic execution
- C) High risk — require explicit human authorization due to production impact
- D) No risk — merging is always safe in agentic workflows

---

**39.** Your team wants agents to operate as autonomously as possible without compromising security. What is the BEST approach to balancing speed and safety?

- A) Remove all guardrails to maximize delivery speed
- B) Assign autonomy levels based on risk classification, minimizing approvals that do not materially reduce risk
- C) Require human approval for every agent action regardless of risk
- D) Allow agents to self-elevate their autonomy level based on task complexity

---

**40.** An agent attempts to push directly to a protected branch, violating your organization's security policy. What should happen?

- A) The agent should succeed and log the policy violation for later review
- B) The action should be blocked immediately with an appropriate error returned to the agent
- C) A developer should be paged to manually approve the push
- D) The branch protection rule should be temporarily suspended for the agent

---

## Mixed Domain & Scenario Questions (41–50)

**41.** A developer reports that an agent "went off-track" and began performing actions unrelated to its assigned task. Which combination of controls would BEST prevent this?

- A) Increase the agent's token limit and add more tools
- B) Define clear inputs, outputs, and success criteria; validate agent plans before execution; and implement scope constraints
- C) Use a more powerful LLM
- D) Add long-term memory to the agent

---

**42.** Which of the following scenarios represents a valid use of **human-in-the-loop** in an agentic workflow?

- A) Requiring human approval before an agent formats a comment
- B) Requiring human approval before an agent deploys to a production environment
- C) Requiring human approval before an agent reads a file
- D) Requiring human approval before the agent queries a search tool

---

**43.** An agent is generating code changes across 10 repositories simultaneously in a multi-agent workflow. After deployment, a critical bug is traced to one of the agent-generated changes. What capability must have been implemented in advance to support rapid diagnosis?

- A) Agent memory pruning
- B) Traceability and accountability — inspectable artifacts and logs linking each action to a specific agent and task
- C) MCP allow lists
- D) Branch-based scope

---

**44.** You are evaluating a new agent before promoting it to production. The agent performs well on average but occasionally takes destructive actions. What is the MOST appropriate next step?

- A) Promote to production immediately since average performance is good
- B) Classify the destructive actions by risk, implement guardrails to block them, and retest before promotion
- C) Remove all tools from the agent and re-add them one by one
- D) Reduce the agent's memory to prevent unexpected behavior

---

**45.** An agent is configured to run autonomously in a CI pipeline. A deployment step begins to behave unexpectedly mid-execution. Which capability allows the system to recover without full manual intervention?

- A) Increasing the CI runner's compute resources
- B) Rollback procedures and escalation paths configured as part of the agent's error handling strategy
- C) Switching to a different CI platform
- D) Disabling the agent permanently

---

**46.** A GitHub Copilot agent needs access to a third-party issue tracking system. Using MCP, what is the correct configuration approach?

- A) Embed the API credentials in the agent's system prompt
- B) Configure a remote MCP server for the issue tracking system and add it to the agent's tool registry with appropriate allow list entries
- C) Give the agent browser access to navigate to the tracking system manually
- D) Use a GitHub Action to sync data to a local file the agent can read

---

**47.** Which of the following statements about agent evaluation signals is TRUE?

- A) Only qualitative signals (like human ratings) are useful for evaluating agents
- B) Evaluation signals should be aligned with development intent, not just general quality metrics
- C) Evaluation signals are only relevant after an agent fails
- D) Automated scanning tools cannot generate evaluation signals

---

**48.** In the context of GH-600, what is the primary purpose of configuring an agent to use **branch-based scope**?

- A) To increase the agent's processing speed
- B) To ensure the agent only operates within designated branches, reducing risk of unintended changes to protected code
- C) To allow the agent to merge branches automatically
- D) To give the agent read access to all branches in the organization

---

**49.** An organization is deploying multiple agents that each handle different parts of the SDLC. A new compliance requirement mandates that all agent actions be attributable to a specific workflow and timestamp. Which capability directly addresses this requirement?

- A) Agent memory pruning policies
- B) Traceability and auditability through inspectable artifacts and structured logging
- C) MCP registry configuration
- D) Autonomy level classification

---

**50.** Which of the following BEST summarizes the key principle behind responsible agentic AI development as reflected throughout the GH-600 exam objectives?

- A) Agents should operate with maximum autonomy to deliver the fastest results possible
- B) Agents should be designed with clear boundaries, observability, human oversight where appropriate, and accountability for all actions
- C) Human oversight should be minimized to reduce workflow friction
- D) Agent behavior should be opaque to developers to protect IP

---

## Answer Key

| # | Answer | Domain |
| --- | --- | --- |
| 1 | B | Domain 1 |
| 2 | C | Domain 1 |
| 3 | B | Domain 1 |
| 4 | C | Domain 1 |
| 5 | B | Domain 1 |
| 6 | B | Domain 1 |
| 7 | C | Domain 2 |
| 8 | B | Domain 2 |
| 9 | B | Domain 2 |
| 10 | A | Domain 2 |
| 11 | B | Domain 2 |
| 12 | C | Domain 2 |
| 13 | B | Domain 2 |
| 14 | B | Domain 2 |
| 15 | C | Domain 3 |
| 16 | B | Domain 3 |
| 17 | B | Domain 3 |
| 18 | B | Domain 3 |
| 19 | C | Domain 3 |
| 20 | B | Domain 3 |
| 21 | B | Domain 4 |
| 22 | B | Domain 4 |
| 23 | C | Domain 4 |
| 24 | B | Domain 4 |
| 25 | C | Domain 4 |
| 26 | B | Domain 4 |
| 27 | C | Domain 4 |
| 28 | B | Domain 5 |
| 29 | B | Domain 5 |
| 30 | B | Domain 5 |
| 31 | B | Domain 5 |
| 32 | B | Domain 5 |
| 33 | C | Domain 5 |
| 34 | B | Domain 5 |
| 35 | B | Domain 6 |
| 36 | B | Domain 6 |
| 37 | B | Domain 6 |
| 38 | C | Domain 6 |
| 39 | B | Domain 6 |
| 40 | B | Domain 6 |
| 41 | B | Mixed |
| 42 | B | Mixed |
| 43 | B | Mixed |
| 44 | B | Mixed |
| 45 | B | Mixed |
| 46 | B | Mixed |
| 47 | B | Mixed |
| 48 | B | Mixed |
| 49 | B | Mixed |
| 50 | B | Mixed |
