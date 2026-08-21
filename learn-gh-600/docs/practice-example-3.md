# **50 Questions | 90 minutes | Passing Score: 700/1000**

---

## Domain 1: Prepare Agent Architecture and SDLC Processes (15–20%)

**1.** What is the FIRST step when designing an agent that will operate in your SDLC pipeline?

- A) Pick the LLM model
- B) Identify the specific SDLC steps the agent will perform
- C) Configure the agent's memory
- D) Add MCP servers

**2.** A team allows an agent to perform planning, validation, and execution all in a single uninterrupted step. This is an example of:

- A) Least-privilege execution
- B) An anti-pattern that merges planning with execution
- C) Effective orchestration
- D) Memory pruning

**3.** Why should an agent's plan be validated BEFORE allowing execution?

- A) To reduce token costs
- B) To catch reasoning errors before they affect the real system
- C) To increase agent autonomy
- D) To reduce CI runtime

**4.** Which is the BEST definition of "success criteria" for an agent task?

- A) The LLM's confidence score
- B) Measurable outcomes that determine whether the agent completed the task correctly
- C) The agent's average response time
- D) The number of tools the agent used

**5.** Configuring an agent to produce inspectable artifacts allows teams to:

- A) Skip evaluation entirely
- B) Observe, audit, and intervene in agent behavior
- C) Bypass guardrails
- D) Reduce memory footprint

**6.** Which capability supports human intervention without slowing delivery?

- A) Eliminating all human review
- B) Targeted approval gates only for high-risk actions
- C) Requiring approval on every step
- D) Disabling logging

**7.** The PRIMARY purpose of distinguishing planning from execution is to:

- A) Reduce LLM token use
- B) Enable validation and oversight between reasoning and action
- C) Increase autonomy
- D) Speed up CI

## Domain 2: Implement Tool Use and Environment Interaction (20–25%)

**8.** What is an MCP server in the context of GitHub agents?

- A) A managed credentials provider
- B) A standardized server that exposes tools and resources to agents via the Model Context Protocol
- C) A monitoring control plane
- D) A multi-cloud platform

**9.** When configuring MCP allow lists, the goal is to:

- A) Maximize the number of tools available
- B) Restrict which MCP servers and tools the agent may use
- C) Cache MCP responses
- D) Increase token throughput

**10.** Which configuration limits an agent's actions to a specific repository?

- A) Memory scoping
- B) Repository-scoped agent configuration
- C) Branch protection rules
- D) MCP registry

**11.** What is required to invoke an agent automatically in a CI workflow?

- A) A manual developer trigger
- B) Configuration that binds the agent to specific workflow events
- C) A cron job
- D) Long-term memory

**12.** A robust agent error-handling design includes:

- A) Retries, rollbacks, and escalation paths
- B) Silent failures
- C) Unlimited retries
- D) Skipping failed steps without logging

**13.** Branch-based scope is MOST useful when:

- A) Agents need to read all branches
- B) You need to constrain an agent's actions to specific branches to limit blast radius
- C) Agents must access secrets
- D) Memory must be shared

**14.** What is the purpose of an MCP registry?

- A) To store agent memory
- B) To catalog available MCP servers that agents can discover and use
- C) To enforce branch protection
- D) To replace GitHub Actions

**15.** Identifying required tools for an agent should be based on:

- A) Popular tool lists
- B) The defined inputs, outputs, and tasks the agent must perform
- C) The number of MCP servers available
- D) Cost of each tool

## Domain 3: Manage Memory, State, and Execution (10–15%)

**16.** When should an agent use external memory?

- A) For all tasks regardless of length
- B) When state must persist across sessions or beyond the context window
- C) Only for testing
- D) When the agent has no tools

**17.** "Context drift" refers to:

- A) Agents losing network connectivity
- B) Agent execution diverging from prior decisions or task intent over time
- C) Memory expiration
- D) Tool permission changes

**18.** Capturing task progress as durable artifacts enables:

- A) Faster LLM inference
- B) Resumption from a checkpoint after interruption
- C) Tool selection
- D) MCP registration

**19.** Scoping agent memory to task-relevant information helps prevent:

- A) Tool misuse
- B) Stale or irrelevant context affecting decisions
- C) MCP allow list violations
- D) CI workflow failures

**20.** When two agents share state, the BIGGEST risk is:

- A) Reduced LLM accuracy
- B) Conflicting or stale context
- C) Increased token usage
- D) Branch protection violations

## Domain 4: Perform Evaluation, Error Analysis, and Tuning (15–20%)

**21.** A quantitative evaluation signal is:

- A) A developer's gut feeling
- B) A measurable metric like pass rate or precision
- C) A team's morale
- D) A subjective rating

**22.** When tuning an agent that misuses tools, the FIRST action is to:

- A) Add more tools
- B) Refine the agent's instructions about when each tool should be used
- C) Increase memory
- D) Remove all tools

**23.** Automated scanning tools are valuable for evaluation because they:

- A) Replace human judgment entirely
- B) Generate consistent, scalable evaluation signals
- C) Eliminate the need for guardrails
- D) Reduce agent autonomy

**24.** Aligning evaluation criteria with development intent prevents:

- A) MCP allow list violations
- B) Technically correct outputs that miss the team's actual goals
- C) Network failures
- D) Memory leaks

**25.** Root cause classification for agent failures includes:

- A) Tools, memory, MCP only
- B) Reasoning errors, tool misuse, context/environment issues
- C) Latency, cost, throughput
- D) Branch, repo, organization

**26.** Refining memory usage during tuning means:

- A) Always increasing memory size
- B) Adjusting what the agent remembers to focus on task-relevant information
- C) Removing all memory
- D) Replacing memory with tools

**27.** Logs, plans, traces, and artifacts together help engineers:

- A) Bypass guardrails
- B) Identify failures and their root causes
- C) Skip evaluation
- D) Increase autonomy

## Domain 5: Orchestrate Multi-Agent Coordination (15–20%)

**28.** An orchestration pattern in multi-agent systems defines:

- A) Agent memory rules
- B) How multiple agents coordinate, sequence, or run in parallel
- C) MCP server hierarchy
- D) Branch protection scope

**29.** Agent isolation in parallel execution prevents:

- A) Tools from being shared
- B) Agents from interfering with each other's working state
- C) MCP allow list use
- D) Memory expiration

**30.** Two agents make overlapping code changes to the same file. This is a:

- A) Memory conflict
- B) Coordination conflict requiring detection and resolution
- C) MCP error
- D) Tool misuse

**31.** Post-hoc analysis of multi-agent behavior requires:

- A) Real-time only telemetry
- B) Retained artifacts, logs, and decision records
- C) Live developer monitoring
- D) Manual agent intervention

**32.** Documenting handoffs across agents enables:

- A) Faster LLMs
- B) Auditability and review of decisions made across the workflow
- C) Reduced tool use
- D) Smaller memory footprint

**33.** Recovery patterns for multi-agent failures include:

- A) Ignoring failures
- B) Rollback and human-in-the-loop interventions
- C) Disabling logging
- D) Removing observability

**34.** Adding a new agent to an active multi-agent workflow should be done:

- A) By stopping the workflow entirely
- B) Without disrupting active executions, using non-breaking changes
- C) By deleting older agents first
- D) Only after retiring all existing agents

**35.** When retiring an agent in a workflow, you must preserve:

- A) Only the agent's prompt
- B) Auditability and workflow continuity
- C) Just the tool list
- D) The agent's branch scope only

## Domain 6: Implement Guardrails and Accountability (10–15%)

**36.** Classifying agent actions by operational, security, and compliance risk allows you to:

- A) Increase MCP throughput
- B) Right-size human intervention
- C) Eliminate evaluation
- D) Skip orchestration

**37.** Least-privilege access for agents means:

- A) Maximum permissions for flexibility
- B) Permissions limited to only what the agent's task requires
- C) Permissions inherited from the repository owner
- D) Permissions set by the agent itself

**38.** Which agent action requires explicit human authorization?

- A) Reading a file
- B) Running a unit test
- C) Deleting production data
- D) Posting a comment

**39.** Blocking actions that violate compliance policies should happen:

- A) After the action is taken
- B) Before the action is executed
- C) Only during audit
- D) Only on Fridays

**40.** Minimizing approvals that do not materially reduce risk helps:

- A) Increase compliance burden
- B) Preserve delivery velocity while maintaining meaningful oversight
- C) Reduce auditability
- D) Eliminate guardrails

**41.** Human-in-the-loop should be applied to:

- A) Every single agent action
- B) Actions requiring human judgment, irreversible changes, or compliance-sensitive operations
- C) Only read operations
- D) Only tool selection

## Mixed (42–50)

**42.** Which capability links specific actions to specific agents for audit?

- A) Memory pruning
- B) Traceability artifacts
- C) MCP allow lists
- D) Branch scope

**43.** What is the BEST way to handle an irreversible action proposed by an agent?

- A) Allow it automatically
- B) Require explicit human authorization
- C) Retry until it succeeds
- D) Ignore the action

**44.** When an agent fails midway through a long task, what enables it to resume without redoing work?

- A) Larger context window
- B) Durable task state artifacts
- C) Memory pruning
- D) Tool restrictions

**45.** Which is NOT a valid root cause category for agent failures?

- A) Reasoning errors
- B) Tool misuse
- C) Context or environment issues
- D) Developer mood

**46.** A multi-agent workflow needs an audit of who did what. Which design feature directly supports this?

- A) Memory expiration
- B) Inspectable artifacts and structured logs per agent
- C) MCP registry caching
- D) Larger LLM models

**47.** A guardrail is BEST described as:

- A) A type of LLM
- B) A control that limits or blocks agent behavior to enforce policy
- C) A tool selection algorithm
- D) An MCP server

**48.** Refining tool access during tuning means:

- A) Adding tools at random
- B) Restricting or expanding tool access based on observed agent behavior
- C) Disabling all tools
- D) Replacing MCP servers

**49.** The MOST comprehensive evaluation approach combines:

- A) Only quantitative metrics
- B) Only qualitative feedback
- C) Quantitative metrics AND qualitative signals aligned with development intent
- D) Neither — agents should self-evaluate

**50.** Which statement BEST captures the GH-600 philosophy?

- A) Agents should operate with maximum autonomy at all times
- B) Agents should be designed with clear boundaries, oversight, and accountability
- C) Human oversight should be eliminated wherever possible
- D) Speed of delivery is more important than safety

### Answer Key — Exam 3

1-B, 2-B, 3-B, 4-B, 5-B, 6-B, 7-B, 8-B, 9-B, 10-B, 11-B, 12-A, 13-B, 14-B, 15-B, 16-B, 17-B, 18-B, 19-B, 20-B, 21-B, 22-B, 23-B, 24-B, 25-B, 26-B, 27-B, 28-B, 29-B, 30-B, 31-B, 32-B, 33-B, 34-B, 35-B, 36-B, 37-B, 38-C, 39-B, 40-B, 41-B, 42-B, 43-B, 44-B, 45-D, 46-B, 47-B, 48-B, 49-C, 50-B
