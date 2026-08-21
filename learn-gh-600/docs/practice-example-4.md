# **50 Questions | 90 minutes | Passing Score: 700/1000**

---

## Domain 1 (15–20%)

**1.** What document defines what an agent should accomplish?

- A) The MCP allow list
- B) The agent's success criteria, inputs, and outputs
- C) The branch protection rules
- D) The CI workflow file

**2.** An agent that overrides developer guidance is exhibiting:

- A) Proper autonomy
- B) An anti-pattern of unbounded agent behavior
- C) Healthy planning
- D) Effective tool use

**3.** Why should an agent produce a structured plan?

- A) For aesthetics
- B) So humans and systems can validate the plan before execution
- C) To increase token usage
- D) To bypass evaluation

**4.** Which describes "configure agent autonomy"?

- A) Choosing the LLM
- B) Defining how much the agent can do without human approval
- C) Setting memory size
- D) Setting log verbosity

**5.** Observability for autonomous agents primarily means:

- A) Watching token spend
- B) Producing logs, artifacts, and traces in standard tooling
- C) Reducing latency
- D) Encrypting communications

**6.** Why distinguish planning from action?

- A) To reduce LLM calls
- B) To allow inspection, validation, and approval before changes occur
- C) To improve agent UI
- D) To reduce memory use

**7.** When defining boundaries for reasoning vs. action, the goal is:

- A) Maximize autonomy
- B) Ensure reasoning is reviewable and actions are gated appropriately
- C) Eliminate reasoning altogether
- D) Use the same step for both

## Domain 2 (20–25%)

**8.** Tool permissions for an agent should follow:

- A) Maximum privilege
- B) Least-privilege scoping
- C) The repository owner's privileges
- D) The CI runner's privileges

**9.** MCP allow lists are used to:

- A) Speed up tool selection
- B) Restrict the MCP servers/tools an agent can use
- C) Replace GitHub Actions
- D) Manage memory

**10.** When integrating an agent into CI, you must:

- A) Configure the agent invocation as part of the workflow
- B) Run the agent on a developer's laptop
- C) Use only synchronous tools
- D) Disable logging

**11.** Branch-based scope helps:

- A) Limit agent action to designated branches
- B) Improve LLM performance
- C) Configure MCP registries
- D) Increase memory

**12.** Robust error handling for agents requires:

- A) Only retries
- B) Retries, rollbacks, escalation, and traceability
- C) Silent suppression
- D) Manual intervention only

**13.** Agent traceability means:

- A) Visibility into which agent did what, when, and why
- B) Real-time UI updates only
- C) Encrypting outputs
- D) Reducing logs

**14.** Configuring an agent for environment-specific constraints means:

- A) Using one config for all environments
- B) Adjusting the agent's behavior or limits based on the target environment
- C) Removing environment dependencies
- D) Hardcoding production values

**15.** An MCP server provides:

- A) A standardized interface for tools and resources
- B) A replacement for the LLM
- C) A storage layer
- D) A CI runner

## Domain 3 (10–15%)

**16.** Short-term memory in agents is BEST suited for:

- A) Cross-session preferences
- B) The current task's working context
- C) Long historical records
- D) Audit trails

**17.** Memory pruning prevents:

- A) Token cost explosions and stale context
- B) Tool misuse
- C) MCP violations
- D) Branch conflicts

**18.** Detecting drift requires:

- A) Comparing current execution state against prior decisions or intent
- B) Disabling logging
- C) Removing memory
- D) Increasing autonomy

**19.** Sharing agent state across tools/environments requires:

- A) A common, well-defined state representation
- B) Disabling tools
- C) Single-agent execution
- D) Branch scoping only

**20.** Preventing stale context means:

- A) Letting memory grow indefinitely
- B) Refreshing or invalidating context when underlying data changes
- C) Removing all memory
- D) Using only short-term memory

## Domain 4 (15–20%)

**21.** "Operational constraints" for an agent task are:

- A) Limits on time, resources, or scope the agent must respect
- B) Optional preferences
- C) The agent's tool list
- D) The CI pipeline runtime

**22.** Qualitative signals include:

- A) Pass rates
- B) Developer reviews and feedback on output usefulness
- C) Tool call counts
- D) Branch counts

**23.** Identifying failures uses:

- A) Logs, plans, traces, outputs, and workflow artifacts
- B) Only LLM logs
- C) Only developer feedback
- D) Token counts

**24.** Classifying a failure as a "tool misuse" implies:

- A) The agent had the wrong reasoning
- B) The agent used a tool incorrectly or chose the wrong tool
- C) The environment was misconfigured
- D) Memory was stale

**25.** Tuning instructions, workflows, and constraints addresses:

- A) Network speed
- B) Behavioral problems revealed in evaluation
- C) MCP registry size
- D) Branch protection

**26.** Aligning evaluation criteria with development intent means:

- A) Using only generic AI benchmarks
- B) Measuring whether the agent delivers what the team actually needs
- C) Skipping evaluation
- D) Using random metrics

**27.** Automated scanning enables:

- A) Continuous, repeatable evaluation signals in CI
- B) Manual review only
- C) Disabling guardrails
- D) Eliminating tests

## Domain 5 (15–20%)

**28.** A common multi-agent orchestration pattern is:

- A) Orchestrator-worker
- B) Single-prompt
- C) Read-only
- D) Branch-only

**29.** Agent isolation supports:

- A) Memory growth
- B) Safe parallel execution without cross-interference
- C) Tool sharing
- D) MCP caching

**30.** Duplicated effort across agents should be:

- A) Encouraged
- B) Detected and resolved through coordination
- C) Logged but ignored
- D) Used to validate outputs

**31.** Multi-agent observability needs:

- A) Logs, artifacts, and operational signals
- B) Only the orchestrator's logs
- C) UI dashboards only
- D) None — agents are autonomous

**32.** Documenting outcomes across agents helps with:

- A) Audit, review, and learning
- B) Speeding up execution
- C) Disabling guardrails
- D) Reducing memory

**33.** A stalled agent should trigger:

- A) Indefinite waiting
- B) Detection and recovery (rollback, escalation, or human intervention)
- C) Silent removal
- D) Memory expansion

**34.** Replacing an agent without disrupting active workflows requires:

- A) Stopping all workflows
- B) Compatible interfaces and non-breaking updates
- C) Removing all observability
- D) Deleting the previous agent's artifacts

**35.** Retiring an agent while preserving auditability requires:

- A) Deleting logs
- B) Retaining historical artifacts and transferring responsibilities
- C) Disabling all related workflows
- D) Removing the MCP allow list

## Domain 6 (10–15%)

**36.** Autonomy levels should map to:

- A) Risk level of agent actions
- B) Number of tools available
- C) Branch count
- D) LLM size

**37.** Actions requiring human judgment include:

- A) All file reads
- B) Compliance-sensitive or irreversible changes
- C) Posting comments
- D) Running tests

**38.** Scoping permissions to enforce least-privilege:

- A) Limits the blast radius if the agent misbehaves
- B) Increases agent capability
- C) Eliminates audit needs
- D) Removes the need for guardrails

**39.** Controlled paths for irreversible changes mean:

- A) Allow the agent to act freely
- B) Require defined authorization workflows for high-impact actions
- C) Skip review
- D) Use random approvers

**40.** A balanced guardrail strategy:

- A) Adds approvals for every action
- B) Targets oversight where risk is meaningful, preserving velocity elsewhere
- C) Removes all guardrails
- D) Limits the agent to read-only

**41.** Blocking violations of Responsible AI policies:

- A) Is optional
- B) Must occur before the action is executed
- C) Is only for production
- D) Is handled by the LLM provider

## Mixed (42–50)

**42.** An agent that creates a PR but then makes destructive force-pushes is exhibiting:

- A) Effective autonomy
- B) Missing guardrails on high-risk actions
- C) Healthy planning
- D) Effective evaluation

**43.** Audit logs are MOST useful for:

- A) Increasing autonomy
- B) Demonstrating accountability and traceability after the fact
- C) Reducing tool use
- D) Skipping evaluation

**44.** Drift correction in extended execution often involves:

- A) Re-anchoring to original goals/decisions
- B) Removing memory
- C) Increasing autonomy
- D) Adding more tools

**45.** A multi-agent workflow that lacks shared state representation is likely to:

- A) Work flawlessly
- B) Produce conflicting or stale decisions
- C) Reduce token use
- D) Improve evaluation

**46.** An agent attempts to modify a critical file outside its scope. Best response:

- A) Allow it with a warning
- B) Block the action and escalate
- C) Log it after the fact
- D) Increase the agent's permissions

**47.** The PRIMARY goal of agent guardrails is to:

- A) Slow the agent
- B) Enforce safe, compliant behavior aligned with policy
- C) Maximize autonomy
- D) Disable tools

**48.** Branch-based scope limits:

- A) The scope of changes an agent can make
- B) LLM inference speed
- C) MCP servers
- D) Memory growth

**49.** Refining tool access during tuning means:

- A) Adding/removing tools based on observed agent needs and risks
- B) Always adding more tools
- C) Disabling MCP
- D) Random changes

**50.** What is the END goal of the GH-600 curriculum?

- A) Maximum agent autonomy at all costs
- B) Safe, observable, accountable, and effective use of agents in the SDLC
- C) Eliminating human reviewers
- D) Replacing all developers

### Answer Key — Exam 4

1-B, 2-B, 3-B, 4-B, 5-B, 6-B, 7-B, 8-B, 9-B, 10-A, 11-A, 12-B, 13-A, 14-B, 15-A, 16-B, 17-A, 18-A, 19-A, 20-B, 21-A, 22-B, 23-A, 24-B, 25-B, 26-B, 27-A, 28-A, 29-B, 30-B, 31-A, 32-A, 33-B, 34-B, 35-B, 36-A, 37-B, 38-A, 39-B, 40-B, 41-B, 42-B, 43-B, 44-A, 45-B, 46-B, 47-B, 48-A, 49-A, 50-B
