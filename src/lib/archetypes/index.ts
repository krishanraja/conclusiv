import type { NarrativeArchetype } from "@/lib/types";

export interface ArchetypeConfig {
  name: string;
  description: string;
  icon: string;
  bestFor: string;
  sectionStructure: string[];
  promptTemplate: string;
}

export const archetypeConfigs: Record<NarrativeArchetype, ArchetypeConfig> = {
  strategy_brief: {
    name: "Strategy Brief",
    description: "Executive-ready strategic overview",
    icon: "Target",
    bestFor: "Board presentations, strategy reviews",
    sectionStructure: ["Context", "Strategic Imperative", "Options", "Recommendation", "Next Steps"],
    promptTemplate: `Create a strategy brief narrative with these sections:
1. Context - What's the situation and why does it matter now?
2. Strategic Imperative - What must we achieve and why?
3. Strategic Options - What choices do we have?
4. Recommendation - Which option and why?
5. Next Steps - Concrete actions with owners

Tone: Authoritative, decisive, forward-looking. No fluff. Every sentence must earn its place.`,
  },

  exec_decision_memo: {
    name: "Executive Decision Memo",
    description: "Clear decision framework for leadership",
    icon: "FileCheck",
    bestFor: "Investment decisions, major initiatives",
    sectionStructure: ["Decision Required", "Background", "Analysis", "Recommendation", "Risk Mitigation"],
    promptTemplate: `Create an executive decision memo with these sections:
1. Decision Required - What specific decision needs to be made?
2. Background - Essential context only (no more than 3 points)
3. Analysis - Pros/cons with data support
4. Recommendation - Clear recommendation with rationale
5. Risk Mitigation - Key risks and how we'll address them

Tone: Direct, analytical, action-oriented. Lead with the ask.`,
  },

  investor_pitch: {
    name: "Investor Pitch",
    description: "Compelling narrative for funding",
    icon: "TrendingUp",
    bestFor: "Fundraising, partnership pitches",
    sectionStructure: ["The Problem", "The Solution", "Market Opportunity", "Traction", "The Ask"],
    promptTemplate: `Create an investor pitch narrative with these sections:
1. The Problem - What pain point are we solving? Make it visceral.
2. The Solution - How do we solve it uniquely?
3. Market Opportunity - TAM/SAM/SOM with growth trajectory
4. Traction - Evidence of momentum (metrics, customers, partnerships)
5. The Ask - What we need and what it unlocks

Tone: Confident, visionary, backed by evidence. Tell a story of inevitable success.`,
  },

  gtm_plan: {
    name: "GTM Plan",
    description: "Go-to-market strategy outline",
    icon: "Rocket",
    bestFor: "Product launches, market entry",
    sectionStructure: ["Opportunity", "Target Segments", "Value Proposition", "Channels", "Timeline"],
    promptTemplate: `Create a go-to-market plan narrative with these sections:
1. Market Opportunity - Why now? What's changed?
2. Target Segments - Who exactly are we targeting first and why?
3. Value Proposition - Our differentiated positioning
4. Channel Strategy - How we'll reach and convert
5. Launch Timeline - Key milestones and success metrics

Tone: Practical, specific, execution-focused. No hand-waving.`,
  },

  problem_framing: {
    name: "Problem Framing",
    description: "Deep dive into problem definition",
    icon: "Search",
    bestFor: "Discovery phases, alignment sessions",
    sectionStructure: ["Symptoms", "Root Causes", "Stakeholder Impact", "Constraints", "Success Criteria"],
    promptTemplate: `Create a problem framing narrative with these sections:
1. Symptoms - What are we observing that's problematic?
2. Root Causes - What's actually driving these symptoms?
3. Stakeholder Impact - Who's affected and how?
4. Constraints - What limits our solution space?
5. Success Criteria - How will we know we've solved it?

Tone: Curious, analytical, open-minded. Surface assumptions.`,
  },

  root_cause: {
    name: "Root Cause Analysis",
    description: "Systematic diagnosis of issues",
    icon: "GitBranch",
    bestFor: "Post-mortems, process improvement",
    sectionStructure: ["Issue Statement", "Timeline", "Contributing Factors", "Root Cause", "Preventive Actions"],
    promptTemplate: `Create a root cause analysis narrative with these sections:
1. Issue Statement - What happened? Be specific.
2. Timeline - Sequence of events leading to the issue
3. Contributing Factors - What enabled this to happen?
4. Root Cause - The fundamental cause(s)
5. Preventive Actions - How we'll prevent recurrence

Tone: Objective, fact-based, blame-free. Focus on systems, not individuals.`,
  },

  workshop_outline: {
    name: "Workshop Outline",
    description: "Structured facilitation guide",
    icon: "Users",
    bestFor: "Team workshops, planning sessions",
    sectionStructure: ["Objectives", "Participants", "Agenda", "Key Activities", "Outcomes"],
    promptTemplate: `Create a workshop outline narrative with these sections:
1. Objectives - What will participants leave with?
2. Participants - Who needs to be there and why?
3. Agenda - Time-boxed structure with clear transitions
4. Key Activities - Interactive exercises with clear instructions
5. Expected Outcomes - Tangible deliverables and decisions

Tone: Energetic, participatory, action-oriented. Make it engaging.`,
  },

  competitive_teardown: {
    name: "Competitive Teardown",
    description: "Deep competitor analysis",
    icon: "Shield",
    bestFor: "Strategy planning, product positioning",
    sectionStructure: ["Landscape Overview", "Key Competitors", "Strengths & Weaknesses", "Our Positioning", "Strategic Moves"],
    promptTemplate: `Create a competitive teardown narrative with these sections:
1. Landscape Overview - Market context and key dynamics
2. Key Competitors - Who matters and why (max 3-4)
3. Comparative Analysis - Strengths and weaknesses vs. us
4. Our Positioning - Where we win and don't
5. Strategic Moves - How we should respond

Tone: Honest, strategic, action-oriented. No wishful thinking.`,
  },
};

export const getArchetypeConfig = (archetype: NarrativeArchetype): ArchetypeConfig => {
  return archetypeConfigs[archetype];
};

export const archetypeList = Object.entries(archetypeConfigs).map(([key, config]) => ({
  key: key as NarrativeArchetype,
  ...config,
}));
