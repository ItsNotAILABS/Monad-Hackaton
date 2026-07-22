# CyberSecurity-AI ↔ MonadBuilder+ Integration Plan

## Overview

This document outlines the technical architecture for integrating the CyberSecurity-AI MCP server into the MonadBuilder+ platform, enabling security intelligence and governance workflows directly within the IDE, policy kernel, and autonomous agent execution.

---

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────┐
│ MonadBuilder+ THESIS Platform                           │
├─────────────────────────────────────────────────────────┤
│ Frontend (Vite React)                                   │
│  • STUDIO: Describe dApp ideas                          │
│  • IDE: Build contracts and agents                      │
│  • DESK: Paper trade / simulation                       │
│  • ACADEMY: Learn Monad                                 │
│                                                         │
│ Backend (FastAPI Python)                                │
│  • thesis_forge.api: Core API                           │
│  • agents: Agent proposal engine                        │
│  • policy: THESIS policy kernel                         │
│  • receipts: Audit trail / blockchain                   │
│  • trading: Paper trading desk                          │
│  • ecosystems: Monad ecosystem data                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CyberSecurity-AI (Separate MCP Server)                  │
├─────────────────────────────────────────────────────────┤
│ MCP Server (Python)                                      │
│  • Careers: Role taxonomy and intelligence              │
│  • Use Cases: Workflow definitions                      │
│  • Capabilities: Maturity matrices                      │
│  • Policy: Boundary checking                            │
│  • Platform: Meta-level intelligence                    │
│  • CHIMERIA Bridge: Private trunk access (optional)     │
│                                                         │
│ CLI: Operator tools                                      │
│ HTTP API: Demo and dashboard                            │
│ Dashboard: Browser UI                                   │
└─────────────────────────────────────────────────────────┘
```

### Target State: Integrated

```
┌─────────────────────────────────────────────────────────┐
│ MonadBuilder+ THESIS Platform (Integrated)              │
├─────────────────────────────────────────────────────────┤
│ Frontend (Vite React)                                   │
│  • STUDIO: "Build bot" + Security Intelligence Card    │
│  • IDE: Contracts + Approval Workflows + Audits         │
│  • DESK: Trade sim + RACI approval flows                │
│  • ACADEMY: Monad lessons + Security training           │
│  • SECURITY: New tab - Capability matrix, careers       │
│                                                         │
│ Backend (FastAPI Python) - UNIFIED                      │
│  • thesis_forge.api: Core API                           │
│  • agents: Agent proposals (with security context)      │
│  • policy: THESIS kernel + CyberSecurity careers        │
│  • receipts: Audit trail + RACI assignments             │
│  • trading: Paper trading + role-based approvals        │
│  • security: CyberSecurity-AI integration               │
│    - career_get / career_search                         │
│    - use_case_invoke                                    │
│    - capability_matrix                                  │
│    - policy_check                                       │
│    - incident_workflow                                  │
│                                                         │
│  • CyberSecurity-AI MCP embedded (subprocess)           │
│    (or as HTTP client to separate service)              │
│                                                         │
│ Background Services                                     │
│  • MCP Router: Route requests to CyberSecurity-AI       │
│  • Policy Sync: Sync THESIS policies ↔ careers          │
│  • Approval Engine: Route to right roles/teams          │
│  • Audit Log: Receipt blockchain records everything    │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Agent Proposal Pipeline

#### Current Flow
```
User Request (CLI/API)
  ↓
agents.propose_plans()
  ↓
Arena evaluation
  ↓
Policy filter (nomos)
  ↓
Output: [Safe plans, Rejected plans]
```

#### Enhanced Flow
```
User Request + Context (CLI/API/IDE)
  ↓
CyberSecurity-AI: career_get (who is this user?)
  ↓
agents.propose_plans() (with career context)
  ↓
Arena evaluation + career-based scoring
  ↓
THESIS policy filter (slippage, leverage, etc)
  ↓
CyberSecurity-AI: use_case_invoke (map to workflows)
  ↓
Output: [Safe plans, RACI assignments, approval chain, audit templates]
```

#### Code Integration
**File**: `engine/thesis_forge/security_agent.py` (NEW)
```python
from mcp_server.careers import career_get, career_search
from mcp_server.use_cases import use_case_invoke
from thesis_forge.policy import evaluate

async def propose_with_security_context(request, user_id, career_context):
    """Propose agent plans with security intelligence"""
    
    # 1. Get user's career profile
    career = career_get(user_id)  # e.g., "trader", "risk_officer"
    
    # 2. Get relevant use-case workflow
    workflow = use_case_invoke("agent-proposal-review")
    
    # 3. Generate proposals (existing logic)
    proposals = agents.propose_plans(request)
    
    # 4. Evaluate each proposal against policy + career boundaries
    evaluated = []
    for p in proposals:
        policy_eval = evaluate(p.action, request.policy)
        career_eval = check_career_boundaries(p, career)
        
        evaluated.append({
            "proposal": p,
            "policy": policy_eval,
            "career": career_eval,
            "requires_approval": career.approval_required,
            "approval_chain": workflow.raci_for_role(career.role),
            "audit_template": workflow.evidence_checklist
        })
    
    return evaluated
```

### 2. IDE Integration

#### Current
```
IDE shows:
- Contract code
- Test results
- Deployment button
```

#### Enhanced
```
IDE shows:
- Contract code
- Test results
- ▶️ SECURITY tab:
    - Who can deploy this? (career)
    - Security approval chain (use-case workflow)
    - Evidence checklist (audit template)
    - Policy violations? (policy_check)
    - Incident response plan (if something breaks)
- ✓ APPROVED (when RACI chain completes)
- Deployment button (only if approved)
```

#### Frontend Implementation
**File**: `web/src/components/SecurityIntelligence.jsx` (NEW)
```jsx
export function SecurityIntelligence({ contractCode, agentProposal }) {
  const [career, setCareer] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  
  useEffect(async () => {
    // Call backend security endpoint
    const sec = await fetch('/api/security/context', {
      body: JSON.stringify({ contract: contractCode })
    }).then(r => r.json());
    
    setCareer(sec.career);
    setWorkflow(sec.use_case);
    setCapabilities(sec.capability_matrix);
  }, [contractCode]);
  
  return (
    <div className="security-panel">
      <h3>Security & Approval</h3>
      
      <div className="career-context">
        <strong>Your Role:</strong> {career?.role}
        <p>{career?.capabilities}</p>
      </div>
      
      <div className="approval-chain">
        <strong>Approval Required:</strong>
        {workflow?.raci.map(r => (
          <div key={r}>{r} ✓ {/* Check mark when approved */}</div>
        ))}
      </div>
      
      <div className="evidence-checklist">
        <strong>Audit Evidence:</strong>
        {workflow?.evidence.map(e => (
          <label key={e}>
            <input type="checkbox" /> {e}
          </label>
        ))}
      </div>
      
      <div className="capability-matrix">
        <strong>Capability Coverage:</strong>
        {capabilities?.domains.map(d => (
          <div key={d.name}>
            {d.name}: {d.maturity_level}/5
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Policy Kernel Enhancement

#### Current
```python
# THESIS Engine: Check action against policy
evaluate(action, policy) → {accepted, violations, reasons}
```

#### Enhanced
```python
# THESIS Engine with CyberSecurity-AI Context
async def evaluate_with_security(action, policy, career_context):
    """Evaluate action against policy AND career boundaries"""
    
    # 1. Standard THESIS policy check
    policy_result = evaluate(action, policy)
    
    if not policy_result.accepted:
        return policy_result  # Fast fail
    
    # 2. Career boundary check
    career = await career_get(career_context.user_id)
    capability = await check_capability_boundary(action, career)
    
    if not capability.within_bounds:
        return {
            "accepted": False,
            "violations": ["career-boundary-exceeded"],
            "reasons": [f"This action requires {capability.required_role}"],
            "approval_required": True,
            "approvers": career.approval_chain
        }
    
    # 3. Return full context
    return {
        "accepted": True,
        "policy": policy_result,
        "career": capability,
        "audit_receipt": generate_receipt(action, career, capability)
    }
```

### 4. Approval Workflow (NEW)

**File**: `engine/thesis_forge/approval_workflow.py` (NEW)
```python
from mcp_server.use_cases import use_case_get

async def create_approval_workflow(action, requester_career, use_case_id="agent-proposal-review"):
    """Generate approval workflow from use-case + RACI mapping"""
    
    # Get use-case definition (includes RACI templates)
    workflow = use_case_get(use_case_id)
    
    # Map to this organization's RACI
    raci = workflow.get_raci_for_role(requester_career.role)
    
    # Create approval record (stored in receipts)
    approval = {
        "id": uuid4(),
        "action_id": action.id,
        "requester": requester_career.user_id,
        "requester_role": requester_career.role,
        "workflow_id": use_case_id,
        "approval_chain": raci.sequence,  # ["CFO", "Risk", "Compliance"]
        "evidence_checklist": workflow.evidence_checklist,
        "status": "pending",
        "created_at": datetime.now(),
        "approvals": {}  # {role: {approved: bool, timestamp, comment}}
    }
    
    # Store in receipts (blockchain receipt)
    seal("approval-workflow", approval)
    
    # Notify approvers (via email, dashboard, Slack webhook)
    for role in raci.sequence:
        notify_role(role, approval)
    
    return approval
```

### 5. Incident Response Integration

**Current**: THESIS policy violation → error message  
**Enhanced**: THESIS policy violation → incident workflow + RACI routing

**File**: `engine/thesis_forge/incident_response.py` (NEW)
```python
async def handle_policy_violation(action, violation, career_context):
    """Route policy violation to incident response workflow"""
    
    # Get incident response use-case
    incident_workflow = use_case_get("incident-tabletop-builder")
    
    # Create incident record
    incident = {
        "action": action,
        "violation": violation,
        "detected_at": datetime.now(),
        "severity": calculate_severity(action, violation),
        "requester": career_context.user_id
    }
    
    # Generate incident response package
    response_pkg = incident_workflow.generate_packet(incident, career_context)
    
    # Response includes:
    # - Incident brief (what happened)
    # - RACI assignments (who needs to act)
    # - Evidence checklist (what to investigate)
    # - Recovery plan (how to fix)
    # - Communication template (what to tell stakeholders)
    
    # Route to incident commander
    ic = career_search("role:incident-commander")[0]
    notify_user(ic.user_id, response_pkg)
    
    # Record in audit trail
    seal("incident", incident, response_pkg)
    
    return response_pkg
```

---

## Data Model Integration

### CyberSecurity-AI Concepts → MonadBuilder+ THESIS

| CyberSecurity-AI | THESIS Equivalent | Implementation |
|---|---|---|
| Career (role taxonomy) | Agent authorization context | Receipt + Policy kernel |
| Use-case (workflow) | Agent objective + approval process | approval_workflow table |
| Capability matrix | Policy domain coverage | policy_check + metrics |
| Evidence checklist | Audit trail requirements | receipt blockchain |
| RACI assignment | Approval chain | approval_workflow.sequence |
| Market packet | Stakeholder briefing | API endpoint: `/security/briefing` |
| Policy boundary | THESIS policy kernel | policy.evaluate() |

### New Database Tables (PostgreSQL)

```sql
-- Approval workflows
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY,
  action_id UUID REFERENCES actions(id),
  requester_id TEXT,
  requester_role TEXT,
  use_case_id TEXT,
  approval_chain JSON,  -- ["CFO", "Risk", "Compliance"]
  evidence_checklist JSON,
  status TEXT,  -- "pending", "approved", "rejected"
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Approval records (one per approver)
CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES approval_workflows(id),
  role TEXT,
  approver_id TEXT,
  approved BOOLEAN,
  comment TEXT,
  timestamp TIMESTAMP
);

-- Security contexts (cached career data)
CREATE TABLE security_contexts (
  user_id TEXT PRIMARY KEY,
  role TEXT,
  career_json JSON,  -- Full career_get result
  last_updated TIMESTAMP
);

-- Incident records
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  action_id UUID,
  violation_type TEXT,
  severity TEXT,
  detected_at TIMESTAMP,
  response_packet JSON,
  resolved_at TIMESTAMP
);
```

---

## Deployment Architecture

### Option 1: Embedded (Simple, for MVP)
```
MonadBuilder+ backend (FastAPI)
  ├─ THESIS engine (agents, policy, receipts)
  ├─ Security integration (new module)
  └─ MCP subprocess
      └─ CyberSecurity-AI MCP server (python -m mcp_server.server)
```

**Pros**: Single deployment, simple setup  
**Cons**: Can't scale CyberSecurity-AI independently  

### Option 2: Separate Service (Recommended, for Scale)
```
MonadBuilder+ backend (FastAPI)
  ├─ THESIS engine
  ├─ Security integration (talks to CyberSecurity-AI via HTTP)
  └─ HTTP client → CyberSecurity-AI service

CyberSecurity-AI service (FastAPI)
  ├─ MCP server (stdio mode)
  ├─ HTTP server (api mode)
  └─ Career, use-case, capability data
```

**Pros**: Independent scaling, easy to upgrade  
**Cons**: Network latency, requires service orchestration  

### Option 3: Hybrid (Production Ready)
```
MonadBuilder+ backend cluster (FastAPI)
  ├─ Fast path: Cached career data + embedded policy checks
  └─ Slow path: Call CyberSecurity-AI service for real-time intelligence

CyberSecurity-AI service cluster (FastAPI + MCP)
  ├─ Cache layer (Redis)
  ├─ Career taxonomy (database)
  ├─ Use-case workflows (database)
  └─ Capability matrix (computed on-demand)

Both services
  └─ Audit trail → Monad blockchain (receipts)
```

---

## API Changes Required

### Backend: New Endpoints

```python
# security.py - NEW MODULE

@router.post("/security/career")
async def get_career_context(user_id: str):
    """Get career profile for user"""
    # Calls: mcp_server.careers.career_get
    
@router.post("/security/context")
async def get_security_context(request: AgentProposal):
    """Full security context for an action"""
    # Returns: career, use_case workflow, approval chain, evidence checklist
    
@router.post("/security/check")
async def check_policy_and_career(action: Action, career: CareerContext):
    """Check action against THESIS policy + career boundaries"""
    # Returns: accepted, violations, requires_approval, approvers
    
@router.post("/security/approve")
async def approve_workflow(workflow_id: UUID, approver_id: str):
    """Mark a workflow as approved by this role"""
    # Updates: approval_workflows table
    # Notifies: next approver in chain
    
@router.get("/security/capabilities")
async def get_capability_matrix():
    """Get current capability maturity matrix"""
    # Calls: mcp_server.capabilities.capability_matrix
    
@router.post("/security/briefing")
async def generate_stakeholder_briefing(action_id: UUID, audience: str):
    """Generate market/demo packet for stakeholders"""
    # Calls: mcp_server.platform.market_packet
    
@router.post("/security/incident")
async def handle_incident(incident: Incident):
    """Generate incident response workflow"""
    # Calls: mcp_server.use_cases.use_case_invoke("incident-tabletop-builder")
```

### Frontend: New Components

```javascript
// components/SecurityIntelligence.jsx - NEW
// components/ApprovalChain.jsx - NEW
// components/CapabilityMatrix.jsx - NEW
// components/IncidentResponse.jsx - NEW
// tabs/SecurityTab.jsx - NEW

// pages/SecurityDashboard.jsx - NEW (full security dashboard)
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Design data model (approvals, security_contexts, incidents)
- [ ] Create approval_workflow.py module
- [ ] Add new database tables
- [ ] Write tests

### Week 2: Policy Kernel Integration
- [ ] Integrate CyberSecurity-AI career data into policy evaluation
- [ ] Implement evaluate_with_security()
- [ ] Update agents.propose_plans() to include career context
- [ ] Test agent proposals with careers

### Week 3: API + Backend
- [ ] Implement /security/* endpoints
- [ ] Create career caching layer
- [ ] Implement approval workflow orchestration
- [ ] Integration tests with MCP

### Week 4: Frontend Integration
- [ ] Build SecurityIntelligence component
- [ ] Add approval chain UI
- [ ] Create capability matrix widget
- [ ] Integrate into IDE + STUDIO

### Week 5: Testing + Polish
- [ ] End-to-end testing (studio → approval → deploy)
- [ ] Demo video (integrated flow)
- [ ] Performance testing (add CyberSecurity-AI latency)
- [ ] Documentation

---

## Testing Strategy

### Unit Tests
- `test_career_evaluation()` - Career boundaries work
- `test_approval_workflow()` - RACI chains route correctly
- `test_policy_and_career_together()` - Both checks work

### Integration Tests
- `test_studio_to_approval()` - Full flow from idea to approval
- `test_incident_detection_to_response()` - Incident workflow
- `test_multi_actor_approval()` - Multiple approvers

### Performance Tests
- Latency overhead of security checks
- Career cache hit rate
- Approval workflow notification speed

---

## Success Criteria

- [ ] Security context loads in <100ms (cached)
- [ ] Approval workflow creates and routes in <500ms
- [ ] IDE shows security tab with career + workflow in <1s
- [ ] Full end-to-end flow (studio → approval → deploy) in <5min
- [ ] Zero security regressions (THESIS policies still work)
- [ ] All THESIS tests pass (100% backward compatible)

---

## Next Steps

1. **Review this plan** with the team
2. **Choose deployment model** (embedded vs. separate service)
3. **Create JIRA epic** with phased tasks
4. **Start Week 1** with foundation work
5. **Coordinate with CyberSecurity-AI team** on MCP stability

