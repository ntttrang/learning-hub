# **50 Questions | 90 minutes | Passing Score: 700/1000**

---

## Domain 1 (15–20%)

**1.** Before deploying an agent, you should:

- A) Define its inputs, outputs, success criteria, and SDLC integration points
- B) Pick the largest LLM available
- C) Disable observability
- D) Grant maximum permissions

**2.** An anti-pattern in agent design is:

- A) Allowing the agent to escalate its own permissions
- B) Producing structured plans
- C) Validating outputs before action
- D) Logging decisions

**3.** Why output a structured plan?

- A) To allow human and automated validation
- B) To increase memory consumption
- C) To enable random execution
- D) To skip evaluation

**4.** "Distinct planning from execution" is BEST implemented by:

- A) Having the agent emit a plan, then gating execution behind approval
- B) Running both in the same step
- C) Disabling planning
- D) Skipping execution

**5.** Configuring observability for an agent involves:

- A) Producing logs, traces, and inspectable artifacts via standard tools
- B) Encrypting all outputs
- C) Hiding logs from developers
- D) Disabling memory

**6.** Right-sized human intervention means:

- A) Approvals only where they reduce material risk
- B) Approval on every action
- C) No approvals at all
- D) Random approvals

**7.** Agent guardrails should be aligned with:

- A) Organizational risk and compliance posture
- B) Agent token budget only
- C) LLM size only
- D) Tool count only

## Domain 2 (20–25%)

**8.** A best practice when selecting tools for an agent is:

- A) Choose only tools needed for the agent's defined tasks
- B) Add every available tool
- C) Use only built-in tools
- D) Choose tools randomly

**9.** MCP allows agents to:

- A) Consume tools and resources via a standardized protocol
- B) Replace the LLM
- C) Manage branches
- D) Replace CI

**10.** A remote MCP server is useful when:

- A) Tools/resources need to be accessed across distributed environments
- B) Tools are local only
- C) MCP is disabled
- D) Agents are stateless

**11.** Configuring MCP allow lists supports:

- A) Tool-level least-privilege
- B) Bypassing guardrails
- C) Increased autonomy
- D) Eliminating logs

**12.** Scoping an agent to a repository ensures:

- A) The agent only operates within that repo's boundary
- B) The agent has more memory
- C) MCP registry is unbounded
- D) The agent can edit any branch

**13.** Configuring a CI workflow agent invocation includes:

- A) Event triggers, secrets, and execution context
- B) Disabled logging
- C) Removed permissions
- D) Random scheduling

**14.** Branch-based scope is helpful for:

- A) Restricting agent actions to specific branches
- B) Disabling MCP
- C) Removing memory
- D) Skipping evaluation

**15.** Robust error handling implementations include:

- A) Retries, rollbacks, escalations, and traceability
- B) Silent failures
- C) Ignoring errors
- D) Disabling memory

## Domain 3 (10–15%)

**16.** Choosing between memory types depends on:

- A) Whether state must persist across sessions or only within one task
- B) Tool count
- C) Branch count
- D) MCP server availability

**17.** Memory scoped to task-relevant information avoids:

- A) Distraction and noise from irrelevant context
- B) The need for tools
- C) Logging
- D) Branch protection

**18.** Defining reset rules for memory prevents:

- A) Stale data persisting across unrelated tasks
- B) Tool growth
- C) MCP failures
- D) Branch conflicts

**19.** Resuming work without repeating steps requires:

- A) Durable artifacts capturing prior progress
- B) Disabling memory
- C) Removing tools
- D) Increased autonomy

**20.** Sharing agent state across tools requires:

- A) A defined, consistent representation of state
- B) Random formats
- C) Disabled memory
- D) Increased context size only

## Domain 4 (15–20%)

**21.** Success criteria for an agent task should be:

- A) Specific, measurable, and aligned with development intent
- B) Vague and subjective
- C) Defined after the task ends
- D) Optional

**22.** A quantitative evaluation signal could be:

- A) Percentage of agent PRs that pass CI without manual edits
- B) Developer happiness rating
- C) "Looks good to me"
- D) Aesthetic appeal

**23.** A qualitative evaluation signal could be:

- A) Reviewer ratings on clarity, helpfulness, or correctness
- B) Total tool calls
- C) Token counts
- D) Memory size

**24.** Automated scanning helps:

- A) Produce consistent evaluation signals at scale
- B) Replace human judgment in all cases
- C) Eliminate guardrails
- D) Reduce traceability

**25.** Classifying root causes helps:

- A) Direct tuning to the right intervention
- B) Increase agent autonomy
- C) Disable evaluation
- D) Remove memory

**26.** Revising agent instructions is a tuning lever for:

- A) Reasoning errors and unclear behavior
- B) Network failures
- C) MCP outages
- D) Branch protection rules

**27.** Refining tool access is a tuning lever for:

- A) Tool misuse or over-/under-equipped agents
- B) Memory growth
- C) Branch protection
- D) MCP registry size

## Domain 5 (15–20%)

**28.** Orchestration patterns help:

- A) Coordinate work across multiple agents reliably
- B) Increase autonomy without limits
- C) Disable observability
- D) Eliminate evaluation

**29.** Parallel execution requires:

- A) Agent isolation to avoid interference
- B) Shared global state with no boundaries
- C) A single LLM call
- D) No artifacts

**30.** Conflicts between agents can include:

- A) Overlapping code changes, contradictory decisions, or duplicated effort
- B) Token budgets
- C) MCP registry sizes
- D) Branch counts

**31.** Multi-agent observability artifacts include:

- A) Logs, decision records, handoffs, and operational signals
- B) Only final outputs
- C) Only LLM model names
- D) None — agents are autonomous

**32.** Post-hoc analysis of agents requires:

- A) Retained artifacts and logs to review behavior after execution
- B) Real-time only data
- C) No artifacts
- D) Removed observability

**33.** Recovery patterns include:

- A) Rollback, retry, and human-in-the-loop intervention
- B) Silent failure
- C) Ignoring stalled agents
- D) Disabling logs

**34.** Replacing an agent without disruption requires:

- A) Backwards-compatible interfaces and gradual rollout
- B) Stopping all workflows
- C) Removing observability
- D) Disabling MCP

**35.** Retiring an agent must preserve:

- A) Auditability and continuity of dependent workflows
- B) Only the agent's prompt
- C) Only the LLM weights
- D) Nothing — fully delete

## Domain 6 (10–15%)

**36.** Risk classification of agent actions enables:

- A) Right-sized autonomy decisions
- B) Bypassing all guardrails
- C) Random approvals
- D) Disabled logging

**37.** Actions that should require human approval:

- A) Irreversible or compliance-sensitive changes
- B) Reading documentation
- C) Listing files
- D) Posting comments

**38.** Least-privilege permissions reduce:

- A) Blast radius of misbehavior or compromise
- B) Agent capability completely
- C) Memory size
- D) MCP throughput

**39.** Controlled paths for high-risk actions provide:

- A) Defined, auditable authorization workflows
- B) Random approvals
- C) No oversight
- D) Self-approval

**40.** Preserving velocity while enforcing guardrails means:

- A) Automating low-risk paths and gating high-risk paths
- B) Approving everything
- C) Approving nothing
- D) Removing all guardrails

**41.** Blocking policy violations should happen:

- A) Before the action executes
- B) After the action completes
- C) During audit only
- D) Only on appeal

## Mixed (42–50)

**42.** A multi-agent workflow audit needs:

- A) Per-agent attributable artifacts and decision records
- B) Only the final report
- C) Only LLM versions
- D) Nothing — agents are trusted

**43.** A failed agent run that re-does completed work indicates:

- A) Missing durable state checkpoints
- B) Too many tools
- C) MCP misconfiguration
- D) Excess memory

**44.** Drift correction relies on:

- A) Comparing current state to intent and prior decisions
- B) Random restarts
- C) Disabling memory
- D) Removing tools

**45.** Detecting overlapping code changes requires:

- A) Cross-agent change tracking and resolution policy
- B) Disabling parallel execution
- C) Removing branch protection
- D) Larger LLMs

**46.** Blocking irreversible compliance-sensitive actions:

- A) Is essential for accountability
- B) Slows everything unnecessarily
- C) Is optional
- D) Is handled by the LLM

**47.** Evaluation completeness improves when:

- A) Quantitative and qualitative signals are combined and aligned with intent
- B) Only one metric is used
- C) Only humans evaluate
- D) No evaluation occurs

**48.** Tool-level least-privilege is enforced through:

- A) MCP allow lists and scoped permissions
- B) Adding more tools
- C) Eliminating MCP
- D) Disabling logs

**49.** Continuity of memory across environments requires:

- A) Defined state representation, synchronization, and conflict policy
- B) Random sharing
- C) No sharing
- D) Memory removal

**50.** The ideal agentic SDLC posture is:

- A) Agents with clear scope, observability, accountability, and risk-aware oversight
- B) Maximum autonomy with no oversight
- C) Zero autonomy
- D) Agents that bypass humans entirely

### Answer Key — Exam 6

1-A, 2-A, 3-A, 4-A, 5-A, 6-A, 7-A, 8-A, 9-A, 10-A, 11-A, 12-A, 13-A, 14-A, 15-A, 16-A, 17-A, 18-A, 19-A, 20-A, 21-A, 22-A, 23-A, 24-A, 25-A, 26-A, 27-A, 28-A, 29-A, 30-A, 31-A, 32-A, 33-A, 34-A, 35-A, 36-A, 37-A, 38-A, 39-A, 40-A, 41-A, 42-A, 43-A, 44-A, 45-A, 46-A, 47-A, 48-A, 49-A, 50-A
