import { TemplateName, NarrativeSection, Transition, TransitionType } from "../types";

export interface TemplateConfig {
  name: TemplateName;
  displayName: string;
  description: string;
  bestFor: string[];
  sections: Omit<NarrativeSection, "content" | "items">[];
  transitions: Transition[];
  defaultTransition: TransitionType;
}

export const ZoomRevealTemplate: TemplateConfig = {
  name: "ZoomReveal",
  displayName: "Zoom Reveal",
  description: "Overview → zoom → cluster breakdown → conclusion",
  bestFor: ["SWOT analysis", "Multi-factor analysis", "Strategic reviews"],
  sections: [
    { id: "big_idea", title: "The Big Idea", position: { x: 0, y: 0 }, icon: "lightbulb" },
    { id: "drivers", title: "Key Drivers", position: { x: 0, y: 0.6 }, icon: "trending-up" },
    { id: "constraints", title: "Constraints", position: { x: 0, y: 1.2 }, icon: "shield-alert" },
    { id: "implications", title: "Implications", position: { x: 0, y: 1.8 }, icon: "git-branch" },
    { id: "recommendation", title: "Recommendation", position: { x: 0, y: 2.4 }, icon: "target" },
  ],
  transitions: [
    { type: "fade", target: "big_idea" },
    { type: "pan", target: "drivers" },
    { type: "pan", target: "constraints" },
    { type: "pan", target: "implications" },
    { type: "fade", target: "recommendation" },
  ],
  defaultTransition: "pan",
};

export const LinearStoryboardTemplate: TemplateConfig = {
  name: "LinearStoryboard",
  displayName: "Linear Storyboard",
  description: "Clean left-to-right progression",
  bestFor: ["Pitches", "Executive summaries", "Project updates"],
  sections: [
    { id: "context", title: "Context", position: { x: 0, y: 0 }, icon: "book-open" },
    { id: "insight", title: "Key Insight", position: { x: 1, y: 0 }, icon: "sparkles" },
    { id: "proof_points", title: "Proof Points", position: { x: 2, y: 0 }, icon: "check-circle" },
    { id: "action", title: "Call to Action", position: { x: 3, y: 0 }, icon: "arrow-right" },
  ],
  transitions: [
    { type: "fade", target: "context" },
    { type: "slide_left", target: "insight" },
    { type: "card_expand", target: "proof_points" },
    { type: "slide_left", target: "action" },
  ],
  defaultTransition: "slide_left",
};

export const FlyoverMapTemplate: TemplateConfig = {
  name: "FlyoverMap",
  displayName: "Flyover Map",
  description: "Map view → fly to nodes → strategic takeaway",
  bestFor: ["Competitive landscapes", "Market dynamics", "Ecosystem analysis"],
  sections: [
    { id: "landscape", title: "The Landscape", position: { x: 0, y: 0 }, icon: "map" },
    { id: "competitors", title: "Key Players", position: { x: -1, y: 1 }, icon: "users" },
    { id: "advantages", title: "Our Advantages", position: { x: 1, y: 1 }, icon: "trophy" },
    { id: "gaps", title: "Market Gaps", position: { x: 0, y: 1.5 }, icon: "search" },
    { id: "strategic_play", title: "Strategic Play", position: { x: 0, y: 2 }, icon: "chess" },
  ],
  transitions: [
    { type: "fade", target: "landscape" },
    { type: "pan_to_node", target: "competitors" },
    { type: "orbit", target: "advantages" },
    { type: "tilt", target: "gaps" },
    { type: "zoom_in", target: "strategic_play" },
  ],
  defaultTransition: "pan_to_node",
};

export const ContrastSplitTemplate: TemplateConfig = {
  name: "ContrastSplit",
  displayName: "Contrast Split",
  description: "Two frames dynamically compared and toggled",
  bestFor: ["Before/After", "Expected vs Actual", "Trade-off analysis"],
  sections: [
    { id: "setup", title: "The Setup", position: { x: 0, y: 0 }, icon: "layout" },
    { id: "side_a", title: "Scenario A", position: { x: -0.5, y: 0.5 }, icon: "minus-circle" },
    { id: "side_b", title: "Scenario B", position: { x: 0.5, y: 0.5 }, icon: "plus-circle" },
    { id: "tradeoffs", title: "Trade-offs", position: { x: 0, y: 1 }, icon: "scale" },
    { id: "decision", title: "The Decision", position: { x: 0, y: 1.5 }, icon: "check-square" },
  ],
  transitions: [
    { type: "fade", target: "setup" },
    { type: "split_reveal", target: "side_a" },
    { type: "side_flip", target: "side_b" },
    { type: "fade", target: "tradeoffs" },
    { type: "zoom_in", target: "decision" },
  ],
  defaultTransition: "split_reveal",
};

export const PriorityLadderTemplate: TemplateConfig = {
  name: "PriorityLadder",
  displayName: "Priority Ladder",
  description: "Ladder progression from foundation to peak",
  bestFor: ["Recommendations", "Executive summaries", "Priority lists"],
  sections: [
    { id: "foundation", title: "Foundation", position: { x: 0, y: 2 }, icon: "box" },
    { id: "priority_3", title: "Priority 3", position: { x: 0, y: 1.5 }, icon: "circle" },
    { id: "priority_2", title: "Priority 2", position: { x: 0, y: 1 }, icon: "triangle" },
    { id: "priority_1", title: "Priority 1", position: { x: 0, y: 0.5 }, icon: "star" },
    { id: "success", title: "Success Conditions", position: { x: 0, y: 0 }, icon: "flag" },
  ],
  transitions: [
    { type: "fade", target: "foundation" },
    { type: "step_up", target: "priority_3" },
    { type: "step_up", target: "priority_2" },
    { type: "step_up", target: "priority_1" },
    { type: "highlight", target: "success" },
  ],
  defaultTransition: "step_up",
};

export const templates: Record<TemplateName, TemplateConfig> = {
  ZoomReveal: ZoomRevealTemplate,
  LinearStoryboard: LinearStoryboardTemplate,
  FlyoverMap: FlyoverMapTemplate,
  ContrastSplit: ContrastSplitTemplate,
  PriorityLadder: PriorityLadderTemplate,
};

export const getTemplate = (name: TemplateName): TemplateConfig => templates[name];

export const getAllTemplates = (): TemplateConfig[] => Object.values(templates);
