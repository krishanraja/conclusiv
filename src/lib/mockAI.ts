import { Theme, TemplateName, NarrativeSchema, TemplateRecommendation } from "./types";
import { templates, getTemplate } from "./templates";

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Mock AI extraction - simulates AI analyzing text and extracting themes
export const extractThemes = (text: string): Theme[] => {
  // Simple keyword-based extraction for demo
  const lines = text.split('\n').filter(l => l.trim());
  
  // Detect common SWOT-like structures
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];
  const insights: string[] = [];
  
  let currentCategory = '';
  
  lines.forEach(line => {
    const lower = line.toLowerCase().trim();
    
    if (lower.includes('strength')) currentCategory = 'strengths';
    else if (lower.includes('weakness')) currentCategory = 'weaknesses';
    else if (lower.includes('opportunit')) currentCategory = 'opportunities';
    else if (lower.includes('threat') || lower.includes('risk')) currentCategory = 'threats';
    else if (lower.includes('insight') || lower.includes('finding')) currentCategory = 'insights';
    else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine) {
        switch (currentCategory) {
          case 'strengths': strengths.push(cleanLine); break;
          case 'weaknesses': weaknesses.push(cleanLine); break;
          case 'opportunities': opportunities.push(cleanLine); break;
          case 'threats': threats.push(cleanLine); break;
          default: insights.push(cleanLine);
        }
      }
    }
  });

  // If no structure detected, create generic themes
  if (strengths.length + weaknesses.length + opportunities.length + threats.length === 0) {
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);
    const chunks = sentences.slice(0, Math.min(12, sentences.length));
    
    return [
      {
        id: generateId(),
        name: "Key Findings",
        priority: "high",
        keep: true,
        items: chunks.slice(0, 3).map(s => ({
          id: generateId(),
          text: s.trim(),
          type: "insight",
          score: Math.random() * 0.3 + 0.7,
        })),
      },
      {
        id: generateId(),
        name: "Supporting Evidence",
        priority: "medium",
        keep: true,
        items: chunks.slice(3, 6).map(s => ({
          id: generateId(),
          text: s.trim(),
          type: "metric",
          score: Math.random() * 0.3 + 0.5,
        })),
      },
      {
        id: generateId(),
        name: "Considerations",
        priority: "medium",
        keep: true,
        items: chunks.slice(6, 9).map(s => ({
          id: generateId(),
          text: s.trim(),
          type: "risk",
          score: Math.random() * 0.3 + 0.4,
        })),
      },
    ];
  }

  const themes: Theme[] = [];
  
  if (strengths.length > 0) {
    themes.push({
      id: generateId(),
      name: "Strengths",
      priority: "high",
      keep: true,
      items: strengths.map(text => ({
        id: generateId(),
        text,
        type: "driver",
        score: Math.random() * 0.3 + 0.7,
      })),
    });
  }
  
  if (weaknesses.length > 0) {
    themes.push({
      id: generateId(),
      name: "Weaknesses",
      priority: "medium",
      keep: true,
      items: weaknesses.map(text => ({
        id: generateId(),
        text,
        type: "risk",
        score: Math.random() * 0.3 + 0.5,
      })),
    });
  }
  
  if (opportunities.length > 0) {
    themes.push({
      id: generateId(),
      name: "Opportunities",
      priority: "high",
      keep: true,
      items: opportunities.map(text => ({
        id: generateId(),
        text,
        type: "opportunity",
        score: Math.random() * 0.3 + 0.7,
      })),
    });
  }
  
  if (threats.length > 0) {
    themes.push({
      id: generateId(),
      name: "Threats & Risks",
      priority: "medium",
      keep: true,
      items: threats.map(text => ({
        id: generateId(),
        text,
        type: "risk",
        score: Math.random() * 0.3 + 0.5,
      })),
    });
  }
  
  if (insights.length > 0) {
    themes.push({
      id: generateId(),
      name: "Key Insights",
      priority: "high",
      keep: true,
      items: insights.map(text => ({
        id: generateId(),
        text,
        type: "insight",
        score: Math.random() * 0.3 + 0.6,
      })),
    });
  }

  return themes;
};

// Mock template recommendation based on themes
export const recommendTemplates = (themes: Theme[]): TemplateRecommendation[] => {
  const hasSwot = themes.some(t => 
    ['strengths', 'weaknesses', 'opportunities', 'threats'].includes(t.name.toLowerCase())
  );
  
  const hasContrast = themes.some(t => 
    t.name.toLowerCase().includes('vs') || 
    t.name.toLowerCase().includes('before') ||
    t.name.toLowerCase().includes('after')
  );
  
  const hasPriorities = themes.filter(t => t.priority === 'high').length >= 2;
  
  const recommendations: TemplateRecommendation[] = [];
  
  if (hasSwot) {
    recommendations.push({
      template: "ZoomReveal",
      confidence: 0.92,
      reason: "Perfect for SWOT and multi-factor analysis",
    });
  }
  
  if (hasContrast) {
    recommendations.push({
      template: "ContrastSplit",
      confidence: 0.88,
      reason: "Ideal for comparing scenarios or before/after",
    });
  }
  
  if (hasPriorities) {
    recommendations.push({
      template: "PriorityLadder",
      confidence: 0.85,
      reason: "Great for prioritized recommendations",
    });
  }
  
  // Always suggest LinearStoryboard as a safe option
  recommendations.push({
    template: "LinearStoryboard",
    confidence: 0.80,
    reason: "Clean, versatile format for any narrative",
  });
  
  // Add FlyoverMap if competitive
  if (themes.some(t => t.name.toLowerCase().includes('compet'))) {
    recommendations.push({
      template: "FlyoverMap",
      confidence: 0.78,
      reason: "Excellent for competitive landscape analysis",
    });
  }
  
  return recommendations.slice(0, 3);
};

// Build narrative from themes and template
export const buildNarrative = (
  themes: Theme[], 
  templateName: TemplateName
): NarrativeSchema => {
  const template = getTemplate(templateName);
  const keptThemes = themes.filter(t => t.keep);
  
  // Map themes to sections
  const sections = template.sections.map((sectionConfig, index) => {
    const theme = keptThemes[index % keptThemes.length];
    const items = theme?.items.map(i => i.text) || [];
    
    return {
      ...sectionConfig,
      content: theme ? `${theme.name}: Key findings and insights from your analysis.` : "Add your content here...",
      items: items.slice(0, 4),
    };
  });
  
  return {
    template: templateName,
    colorTheme: "darkCinematic",
    iconSet: "minimal",
    sections,
    transitions: template.transitions,
  };
};
