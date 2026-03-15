import type { NarrativeSchema, NarrativeSection } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: NarrativeSchema;
}

/**
 * Validates a NarrativeSection object
 */
function validateSection(section: unknown, index: number): string[] {
  const errors: string[] = [];
  
  if (!section || typeof section !== 'object') {
    errors.push(`Section ${index}: must be an object`);
    return errors;
  }
  
  const s = section as Record<string, unknown>;
  
  if (typeof s.id !== 'string' || !s.id) {
    errors.push(`Section ${index}: missing or invalid 'id'`);
  }
  
  if (typeof s.title !== 'string') {
    errors.push(`Section ${index}: missing or invalid 'title'`);
  }
  
  if (s.content !== undefined && typeof s.content !== 'string') {
    errors.push(`Section ${index}: 'content' must be a string if present`);
  }
  
  if (s.items !== undefined) {
    if (!Array.isArray(s.items)) {
      errors.push(`Section ${index}: 'items' must be an array if present`);
    } else if (!s.items.every((item: unknown) => typeof item === 'string')) {
      errors.push(`Section ${index}: all items must be strings`);
    }
  }
  
  if (!s.position || typeof s.position !== 'object') {
    errors.push(`Section ${index}: missing or invalid 'position'`);
  } else {
    const pos = s.position as Record<string, unknown>;
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      errors.push(`Section ${index}: position must have numeric x and y`);
    }
  }
  
  if (typeof s.icon !== 'string') {
    errors.push(`Section ${index}: missing or invalid 'icon'`);
  }
  
  return errors;
}

/**
 * Validates a NarrativeSchema object loaded from the database
 * Returns validation result with errors and optionally a sanitized version
 */
export function validateNarrativeSchema(data: unknown): ValidationResult {
  const errors: string[] = [];
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Narrative data must be an object'],
    };
  }
  
  const narrative = data as Record<string, unknown>;
  
  // Validate required top-level fields
  const validTemplates = ['ZoomReveal', 'LinearStoryboard', 'FlyoverMap', 'ContrastSplit', 'PriorityLadder'];
  if (!validTemplates.includes(narrative.template as string)) {
    errors.push(`Invalid or missing 'template'. Expected one of: ${validTemplates.join(', ')}`);
  }
  
  const validColorThemes = ['darkCinematic', 'cleanWhite', 'warmNeutral', 'deepOcean'];
  if (!validColorThemes.includes(narrative.colorTheme as string)) {
    errors.push(`Invalid or missing 'colorTheme'. Expected one of: ${validColorThemes.join(', ')}`);
  }
  
  const validIconSets = ['minimal', 'bold', 'outline'];
  if (!validIconSets.includes(narrative.iconSet as string)) {
    errors.push(`Invalid or missing 'iconSet'. Expected one of: ${validIconSets.join(', ')}`);
  }
  
  // Validate sections array
  if (!Array.isArray(narrative.sections)) {
    errors.push("'sections' must be an array");
  } else if (narrative.sections.length === 0) {
    errors.push("'sections' array cannot be empty");
  } else {
    // Validate each section
    narrative.sections.forEach((section, index) => {
      errors.push(...validateSection(section, index));
    });
  }
  
  // Validate transitions array (can be empty but must exist)
  if (!Array.isArray(narrative.transitions)) {
    errors.push("'transitions' must be an array");
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Return sanitized narrative
  return {
    valid: true,
    errors: [],
    sanitized: data as NarrativeSchema,
  };
}

/**
 * Attempts to repair a malformed narrative by providing defaults for missing fields
 * Returns null if the narrative is too broken to repair
 */
export function repairNarrativeSchema(data: unknown): NarrativeSchema | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const narrative = data as Record<string, unknown>;
  
  // If sections is missing or not an array, we can't repair
  if (!Array.isArray(narrative.sections) || narrative.sections.length === 0) {
    return null;
  }
  
  // Repair sections
  const repairedSections: NarrativeSection[] = narrative.sections
    .filter((s): s is Record<string, unknown> => s && typeof s === 'object')
    .map((section, index) => ({
      id: typeof section.id === 'string' ? section.id : `section-${index}`,
      title: typeof section.title === 'string' ? section.title : `Section ${index + 1}`,
      content: typeof section.content === 'string' ? section.content : undefined,
      items: Array.isArray(section.items) 
        ? section.items.filter((item): item is string => typeof item === 'string')
        : undefined,
      position: section.position && typeof section.position === 'object'
        ? {
            x: typeof (section.position as Record<string, unknown>).x === 'number' 
              ? (section.position as Record<string, unknown>).x as number 
              : index * 100,
            y: typeof (section.position as Record<string, unknown>).y === 'number'
              ? (section.position as Record<string, unknown>).y as number
              : 0,
          }
        : { x: index * 100, y: 0 },
      icon: typeof section.icon === 'string' ? section.icon : 'FileText',
      image: typeof section.image === 'string' ? section.image : undefined,
    }));
  
  if (repairedSections.length === 0) {
    return null;
  }
  
  // Build repaired narrative with defaults
  const validTemplates = ['ZoomReveal', 'LinearStoryboard', 'FlyoverMap', 'ContrastSplit', 'PriorityLadder'];
  const validColorThemes = ['darkCinematic', 'cleanWhite', 'warmNeutral', 'deepOcean'];
  const validIconSets = ['minimal', 'bold', 'outline'];
  
  return {
    template: validTemplates.includes(narrative.template as string)
      ? narrative.template as NarrativeSchema['template']
      : 'LinearStoryboard',
    colorTheme: validColorThemes.includes(narrative.colorTheme as string)
      ? narrative.colorTheme as NarrativeSchema['colorTheme']
      : 'darkCinematic',
    iconSet: validIconSets.includes(narrative.iconSet as string)
      ? narrative.iconSet as NarrativeSchema['iconSet']
      : 'minimal',
    sections: repairedSections,
    transitions: Array.isArray(narrative.transitions) ? narrative.transitions : [],
  };
}

/**
 * Safe wrapper to load and validate a narrative from database
 * Returns the validated narrative or null with error message
 */
export function safeLoadNarrative(data: unknown): { narrative: NarrativeSchema | null; error: string | null } {
  // First try strict validation
  const validation = validateNarrativeSchema(data);
  
  if (validation.valid && validation.sanitized) {
    return { narrative: validation.sanitized, error: null };
  }
  
  // Try to repair if validation failed
  console.warn('[validation] Narrative validation failed, attempting repair:', validation.errors);
  const repaired = repairNarrativeSchema(data);
  
  if (repaired) {
    console.log('[validation] Narrative repaired successfully');
    return { narrative: repaired, error: null };
  }
  
  // Cannot repair - return error
  const errorMessage = validation.errors.length > 0 
    ? validation.errors[0] 
    : 'Narrative data is corrupted and cannot be loaded';
  
  return { narrative: null, error: errorMessage };
}
