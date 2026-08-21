# **50 Questions | 90 minutes | Passing Score: 700/1000**

---

## Domain 1 (15–20%)

**1.** Identifying steps for agents to perform requires:

- A) Picking the longest tasks
- B) Breaking SDLC work into discrete, agent-friendly steps
- C) Letting the agent define its own steps
- D) Hard-coding the agent's prompt

**2.** Common anti-patterns include:

- A) Defining success criteria
- B) Letting agents act before plans are validated
- C) Producing inspectable artifacts
- D) Configuring branch scope

**3.** Distinct planning vs. execution allows:

- A) Inspection and approval between phases
- B) Skipping all evaluation
- C) Bypassing guardrails
- D) Removing memory

**4.** A structured plan output benefits:

- A) Tool selection
- B) Validation and machine-readable inspection
- C) MCP registry use
- D) Memory pruning

**5.** Validating agent plans should occur:

- A) Before action is taken
- B) After action is taken
- C) Only during audit
- D) Never

**6.** Standard development tooling artifacts include:

- A) Pull requests, issues, logs, and traces
- B) Random text files
- C) Only Slack messages
- D) Email summaries

**7.** Human intervention without slowing delivery means:

- A) Selective approval gates for high-risk actions
- B) Approval on every step
- C) No approvals at all
- D) Approvals only after deployment

## Domain 2 (20–25%)

**8.** Identifying required tools begins with:

- A) Task analysis and required capabilities
- B) Browsing all available MCP servers
- C) Asking the LLM
- D) Random selection

**9.** Configuring tool permissions should be:

- A) Open by default
- B) Scoped tightly to the agent's task
- C) Inherited from repo admin
- D) Identical across all tools

**10.** Adding an MCP server as a tool requires:

- A) Registering it and configuring access
- B) Disabling guardrails
- C) Removing branch scope
- D) Increasing autonomy

**11.** A GitHub remote MCP server enables:

- A) Cross-environment tool exposure to agents over the MCP protocol
- B) Replacing the LLM
- C) Replacing the CI runner
- D) Disabling logging

**12.** Configuring the MCP registry helps:

- A) Discover, govern, and manage MCP servers available to agents
- B) Replace branch protection
- C) Increase memory
- D) Reduce LLM latency

**13.** Scoping an agent to a repository limits:

- A) Where the agent can read/write
- B) The agent's LLM
- C) The MCP registry
- D) The CI runner

**14.** A CI workflow invocation of an agent requires:

- A) Defined triggers and execution context
- B) A developer's laptop
- C) Disabling MCP
- D) Removing memory

**15.** Rollback strategies for agents include:

- A) Reverting changes when an error occurs
- B) Ignoring errors
- C) Deleting all branches
- D) Forcing merges

## Domain 3 (10–15%)

**16.** Long-term memory is appropriate for:

- A) Cross-session knowledge
- B) Single-task ephemeral context
- C) Tool selection
- D) Branch metadata

**17.** Memory expiration rules ensure:

- A) Outdated information stops influencing decisions
- B) Faster LLMs
- C) Larger context windows
- D) Fewer tools

**18.** Capturing decisions as artifacts supports:

- A) Resumption and audit
- B) MCP registry replication
- C) Branch creation
- D) LLM training

**19.** Preventing conflicting context means:

- A) Ensuring agents do not act on contradictory state
- B) Disabling memory
- C) Removing tools
- D) Using one agent only

**20.** Drift detection requires:

- A) Comparing current trajectory to prior decisions and intent
- B) Disabling logs
- C) Random sampling
- D) Eliminating

## Domain 4 (15–20%)

**21.** Operational constraints for an agent task may include:

- A) Time limits, budget limits, or scope limits
- B) Aesthetic preferences
- C) The agent's color theme
- D) The number of CI runners

**22.** Identifying quantitative evaluation signals helps:

- A) Eliminate human review entirely
- B) Provide measurable, repeatable indicators of agent quality
- C) Disable guardrails
- D) Reduce memory

**23.** Identifying qualitative evaluation signals helps:

- A) Capture nuanced, human-judgment aspects of agent outputs
- B) Replace quantitative metrics
- C) Skip evaluation
- D) Eliminate logs

**24.** Aligning evaluation criteria with development intent ensures:

- A) Evaluations measure what the team actually wants from the agent
- B) Evaluations are random
- C) Evaluations are skipped
- D) Evaluations are only manual

**25.** Generating evaluation signals with automated scanning tools enables:

- A) Continuous quality measurement in CI
- B) Disabling manual review entirely
- C) Removing observability
- D) Eliminating guardrails

**26.** A reasoning error is identified when:

- A) The agent's plan or thought process produced an incorrect conclusion
- B) The agent's tools were unavailable
- C) The environment differed from expected
- D) Memory expired

**27.** A context or environment issue is identified when:

- A) The agent's working environment or inputs differ from expectations
- B) The LLM is too small
- C) The agent has no tools
- D) Branch protection is on

## Domain 5 (15–20%)

**28.** A pipeline pattern in multi-agent orchestration is BEST described as:

- A) Sequential handoffs where each agent processes output from the previous
- B) Random parallelism
- C) Single-agent execution
- D) Tool-only execution

**29.** Configuring agent isolation typically uses:

- A) Independent working contexts and scoped state
- B) Shared in-memory state with no boundaries
- C) Common file locks across agents
- D) Disabled logging

**30.** When two agents propose contradictory plans, the orchestration layer should:

- A) Pick one at random
- B) Detect the conflict and apply a resolution strategy (priority, merge, escalation)
- C) Ignore both
- D) Promote both to production

**31.** Multi-agent artifacts suitable for review and audit include:

- A) Plans, decision records, traces, and handoff metadata
- B) Only the orchestrator's final summary
- C) Just LLM token counts
- D) Only Slack notifications

**32.** Document key handoffs to enable:

- A) Auditability and debugging across agent boundaries
- B) Faster execution
- C) Smaller LLMs
- D) Disabled guardrails

**33.** A degraded multi-agent workflow may exhibit:

- A) Partial completions, repeated failures, or coordination drift
- B) Faster outputs
- C) Better evaluation
- D) Smaller artifacts

**34.** Rollback in multi-agent recovery means:

- A) Reverting changes across affected agents to a known good state
- B) Disabling all agents
- C) Removing memory
- D) Re-running with new tools

**35.** Lifecycle management of agents includes:

- A) Adding, updating, replacing, and retiring agents in a controlled manner
- B) Only adding new agents
- C) Only deleting agents
- D) Locking the agent set forever

## Domain 6 (10–15%)

**36.** Assigning autonomy levels supports:

- A) Risk-based delivery speed and compliance balance
- B) Maximum agent independence
- C) Eliminating oversight
- D) Disabling logs

**37.** Identifying actions requiring human judgment helps:

- A) Focus oversight where it adds value
- B) Slow everything down equally
- C) Replace LLMs
- D) Disable MCP

**38.** Blocking actions that violate compliance ensures:

- A) Policies are enforced before harm occurs
- B) Policies are enforced only after incidents
- C) Policies are ignored
- D) Policies are optional

**39.** Least-privilege execution context means:

- A) The agent runs with only the permissions strictly needed
- B) The agent runs as the repo owner
- C) The agent runs with admin tokens
- D) The agent runs with no permissions

**40.** Explicit authorization for irreversible actions means:

- A) An authorized human (or controlled path) must approve
- B) The agent self-approves
- C) Another agent approves
- D) The action proceeds silently

**41.** Preserving execution velocity is achieved by:

- A) Avoiding approvals that don't materially reduce risk
- B) Adding approvals for every step
- C) Removing all human review
- D) Disabling agents

## Mixed (42–50)

**42.** A core principle of agentic SDLC integration is:

- A) Agents replace developers entirely
- B) Agents are integrated with clear inputs, outputs, scope, and oversight
- C) Agents act without artifacts
- D) Agents bypass CI

**43.** An agent failed because it used the wrong API endpoint. This is:

- A) A tool misuse failure
- B) A reasoning error
- C) A memory failure
- D) A branch conflict

**44.** Capturing decisions as durable artifacts allows:

- A) Resumption and traceability
- B) Faster LLM inference
- C) Smaller MCP registries
- D) Removing guardrails

**45.** Detecting and resolving overlapping code changes requires:

- A) Coordination mechanisms across agents
- B) Disabling parallelism
- C) Removing branches
- D) Larger LLMs

**46.** A guardrail that blocks irreversible production changes ensures:

- A) Compliance with high-risk action policy
- B) Faster delivery
- C) Smaller artifacts
- D) Fewer logs

**47.** Combining quantitative and qualitative signals:

- A) Provides a balanced, comprehensive evaluation
- B) Replaces guardrails
- C) Eliminates the need for memory
- D) Disables observability

**48.** Configuring MCP allow lists demonstrates:

- A) Least-privilege at the tool boundary
- B) Maximum tool exposure
- C) Bypassing guardrails
- D) Disabling logs

**49.** Continuity of memory and state across environments requires:

- A) Defined state representation and synchronization mechanisms
- B) Random sharing
- C) No sharing at all
- D) Disabling memory

**50.** Which best describes a healthy agentic SDLC?

- A) Agents act with no oversight
- B) Agents operate within boundaries, produce inspectable artifacts, and are accountable
- C) Agents replace CI pipelines
- D) Agents take all production actions automatically

### Answer Key — Exam 5

1-B, 2-B, 3-A, 4-B, 5-A, 6-A, 7-A, 8-A, 9-B, 10-A, 11-A, 12-A, 13-A, 14-A, 15-A, 16-A, 17-A, 18-A, 19-A, 20-A, 21-A, 22-B, 23-A, 24-A, 25-A, 26-A, 27-A, 28-A, 29-A, 30-B, 31-A, 32-A, 33-A, 34-A, 35-A, 36-A, 37-A, 38-A, 39-A, 40-A, 41-A, 42-B, 43-A, 44-A, 45-A, 46-A, 47-A, 48-A, 49-A, 50-B
