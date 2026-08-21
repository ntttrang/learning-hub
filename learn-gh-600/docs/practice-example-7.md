# **50 Questions | 90 minutes | Passing Score: 700/1000**

---

## Domain 1 (15–20%)

**1.** Defining inputs and outputs for an agent's task:

- A) Creates a clear contract and success boundary
- B) Slows down the agent
- C) Is optional
- D) Replaces evaluation

**2.** The boundary between planning and action exists to:

- A) Allow oversight, validation, and approval before changes occur
- B) Increase token spend
- C) Reduce autonomy artificially
- D) Confuse developers

**3.** Configuring observability for autonomous agents requires:

- A) Inspectable artifacts within standard tooling
- B) Hidden internal logs
- C) Disabled tracing
- D) Memory-only state

**4.** Identifying anti-patterns means:

- A) Recognizing risky agent behaviors and design choices to avoid them
- B) Listing all tools
- C) Increasing LLM size
- D) Removing memory

**5.** An agent that validates its plan before execution achieves:

- A) Higher reliability and fewer execution-time surprises
- B) Lower observability
- C) Faster CI only
- D) Larger memory

**6.** Configuring agent autonomy includes:

- A) Defining what the agent can do without human approval
- B) Setting LLM temperature only
- C) Picking the deployment region only
- D) Removing guardrails

**7.** Validating agent plans uses:

- A) Automated checks and/or human review against scope and constraints
- B) Random sampling
- C) Token counts only
- D) Memory size only

## Domain 2 (20–25%)

**8.** Configuring agent tools requires:

- A) Mapping required capabilities to specific tools and scoping permissions
- B) Adding all available tools
- C) Random tool selection
- D) No configuration

**9.** Configuring agent tool permissions enforces:

- A) Least-privilege at the tool boundary
- B) Maximum privilege
- C) Random privileges
- D) Permissions from outside the org

**10.** MCP integration with an agent provides:

- A) A standard interface for external tools and resources
- B) Replacement of the LLM
- C) Replacement of branch protection
- D) Replacement of memory

**11.** A GitHub remote MCP server should be:

- A) Registered and accessed through governed channels
- B) Open to all agents
- C) Disabled in production
- D) Only used in dev

**12.** MCP registries help with:

- A) Discovery and governance of available MCP servers
- B) Memory expansion
- C) Removing logs
- D) Branch creation

**13.** Branch-based scope helps:

- A) Limit the blast radius of agent changes
- B) Increase memory
- C) Increase tool count
- D) Disable MCP

**14.** Implementing escalation paths means:

- A) Defining how unresolved errors reach humans for resolution
- B) Disabling errors
- C) Suppressing logs
- D) Adding more retries

**15.** Implementing traceability requires:

- A) Persistent, attributable records of agent actions
- B) Disabling logging
- C) Larger LLMs
- D) Removing tools

## Domain 3 (10–15%)

**16.** Short-term memory in agents holds:

- A) The current task's working context
- B) Cross-session preferences
- C) Long histories
- D) Tool registries

**17.** External memory is appropriate when:

- A) State must persist outside the context window or across systems
- B) Tasks are short
- C) Tools are limited
- D) Logs are off

**18.** Memory pruning supports:

- A) Keeping memory focused on relevant, current context
- B) Removing all memory
- C) Maximizing context size
- D) Disabling tools

**19.** Durable artifacts let an agent:

- A) Resume work without repeating completed steps
- B) Increase autonomy
- C) Replace tools
- D) Skip evaluation

**20.** Detecting drift in extended execution involves:

- A) Comparing ongoing work to original intent and prior decisions
- B) Random checks
- C) Disabling memory
- D) Removing tools

## Domain 4 (15–20%)

**21.** Specifying expected outcomes for tasks helps:

- A) Make evaluation objective and aligned with intent
- B) Eliminate evaluation
- C) Increase autonomy
- D) Disable observability

**22.** Tuning workflows means:

- A) Adjusting the orchestrated steps or process the agent follows
- B) Replacing the LLM
- C) Disabling MCP
- D) Removing memory

**23.** A reasoning error implies:

- A) The agent's logic produced an incorrect conclusion
- B) The tool failed
- C) The environment changed
- D) Memory expired

**24.** Tool misuse implies:

- A) The agent invoked the wrong tool, with wrong arguments, or at the wrong time
- B) The agent had no tools
- C) The environment failed
- D) Memory expired

**25.** A context/environment issue implies:

- A) Inputs, configuration, or runtime conditions diverged from expectations
- B) The agent's logic was wrong
- C) Memory expired
- D) Tools were missing

**26.** Aligning evaluation with development intent:

- A) Ensures the agent is evaluated on what actually matters
- B) Reduces token spend only
- C) Replaces guardrails
- D) Disables memory

**27.** Generating evaluation signals automatically:

- A) Scales evaluation across runs and tasks
- B) Eliminates the need for any review
- C) Reduces auditability
- D) Disables observability

## Domain 5 (15–20%)

**28.** Applying an orchestration pattern:

- A) Provides structure for how agents interact, sequence, and combine outputs
- B) Disables observability
- C) Increases autonomy without limits
- D) Eliminates evaluation

**29.** Configuring agent isolation:

- A) Prevents one agent's state from corrupting another's
- B) Shares state freely
- C) Removes observability
- D) Disables tools

**30.** Detecting agent conflicts requires:

- A) Cross-agent change tracking, conflict detection, and resolution policy
- B) Single-agent execution only
- C) No coordination
- D) Disabling logs

**31.** Multi-agent workflow artifacts should be:

- A) Suitable for review and audit
- B) Hidden from developers
- C) Only viewable by the orchestrator
- D) Discarded after execution

**32.** Documenting handoffs supports:

- A) Traceability and accountability across agent boundaries
- B) Faster execution only
- C) Smaller LLMs
- D) Disabled guardrails

**33.** Stalled multi-agent executions should be:

- A) Detected and handled with recovery patterns
- B) Ignored indefinitely
- C) Hidden from operators
- D) Logged silently

**34.** Lifecycle changes to agents in active workflows:

- A) Should avoid disrupting ongoing executions
- B) Always require full workflow stoppage
- C) Are not allowed
- D) Should bypass observability

**35.** Retiring an agent:

- A) Preserves auditability and ensures workflows continue functioning
- B) Deletes all related artifacts
- C) Stops all dependent agents permanently
- D) Disables logging

## Domain 6 (10–15%)

**36.** Classifying actions by risk lets you:

- A) Apply appropriate autonomy and oversight levels
- B) Bypass all guardrails
- C) Disable evaluation
- D) Remove logs

**37.** Identifying actions that need human judgment:

- A) Focuses oversight where it adds the most value
- B) Slows all actions equally
- C) Removes the need for guardrails
- D) Increases autonomy

**38.** Blocking compliance-violating actions:

- A) Prevents harmful or non-compliant outcomes before they occur
- B) Allows them with logging
- C) Defers them indefinitely
- D) Notifies only after

**39.** Scoping execution contexts to least-privilege ensures:

- A) The agent only has access required for its task
- B) Maximum capability for the agent
- C) No limits
- D) Repo-owner-level permissions

**40.** Explicit authorization for irreversible changes ensures:

- A) Accountable, deliberate decisions for high-impact actions
- B) Faster delivery
- C) Less oversight
- D) Reduced logging

**41.** Preserving velocity while enforcing guardrails means:

- A) Avoiding approvals that don't materially reduce risk
- B) Approving every action
- C) Removing guardrails
- D) Disabling agents

## Mixed (42–50)

**42.** Inspectable artifacts in standard tooling provide:

- A) The foundation for observability, audit, and intervention
- B) A replacement for guardrails
- C) Faster LLM inference
- D) Smaller MCP registries

**43.** An agent that consistently uses the wrong tool needs:

- A) Instruction refinement and/or tool access changes
- B) Larger memory
- C) Fewer logs
- D) Bigger LLM only

**44.** A degraded multi-agent workflow shows:

- A) Partial completions, repeated failures, or coordination drift
- B) Faster results
- C) Better evaluation
- D) Smaller artifacts

**45.** Sharing state across agents requires:

- A) A defined, consistent representation and synchronization mechanism
- B) Random formats
- C) Disabling memory
- D) Removing tools

**46.** Right-sized human-in-the-loop checks apply to:

- A) High-risk, irreversible, or compliance-sensitive actions
- B) Every agent action regardless of risk
- C) Only read-only actions
- D) Only tool selection decisions

**47.** A complete evaluation strategy combines:

- A) Quantitative metrics, qualitative signals, and alignment with development intent
- B) Only automated metrics
- C) Only developer opinions
- D) Only token counts

**48.** Enforcing MCP allow lists demonstrates:

- A) Tool-level least-privilege and governance
- B) Maximum tool exposure
- C) Bypassing guardrails
- D) Replacing CI

**49.** Memory and state continuity across tools and environments requires:

- A) A consistent state contract, synchronization, and conflict resolution
- B) Random sharing
- C) Disabling memory entirely
- D) Single-environment execution only

**50.** Which BEST summarizes responsible agentic AI development per GH-600?

- A) Agents operate with clear scope, observability, accountability, evaluation, and risk-aware guardrails
- B) Agents take all actions autonomously without oversight
- C) Agents replace developers entirely
- D) Agents bypass CI and tooling

### Answer Key — Exam 7

1-A, 2-A, 3-A, 4-A, 5-A, 6-A, 7-A, 8-A, 9-A, 10-A, 11-A, 12-A, 13-A, 14-A, 15-A, 16-A, 17-A, 18-A, 19-A, 20-A, 21-A, 22-A, 23-A, 24-A, 25-A, 26-A, 27-A, 28-A, 29-A, 30-A, 31-A, 32-A, 33-A, 34-A, 35-A, 36-A, 37-A, 38-A, 39-A, 40-A, 41-A, 42-A, 43-A, 44-A, 45-A, 46-A, 47-A, 48-A, 49-A, 50-A
