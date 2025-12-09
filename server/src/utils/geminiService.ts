import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TaskSuggestion {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'STORY' | 'BUG' | 'TASK' | 'EPIC';
  estimatedHours?: number;
  tags?: string[];
}

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const verifyGeminiConfig = async (): Promise<boolean> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  Gemini AI not configured. Set GEMINI_API_KEY in .env file.');
      return false;
    }

    console.log('✅ Gemini AI service ready');
    return true;
  } catch (error) {
    console.error('❌ Gemini AI service error:', error);
    return false;
  }
};

export const generateTaskSuggestions = async (
  businessDescription: string,
  projectContext?: string
): Promise<TaskSuggestion[]> => {
  try {
    const client = getGeminiClient();

    if (!client) {
      throw new Error('Gemini AI is not configured');
    }

    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildTaskGenerationPrompt(businessDescription, projectContext);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const tasks = parseTasksFromResponse(text);

    console.log(`Generated ${tasks.length} task suggestions`);
    return tasks;
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    throw error;
  }
};

function buildTaskGenerationPrompt(description: string, context?: string): string {
  return `You are an expert project manager breaking down requirements into professional, detailed tasks.

PROJECT CONTEXT:
${context ? `${context}` : 'General project requirement'}

USER REQUEST:
${description}

TASK BREAKDOWN INSTRUCTIONS:
1. Analyze the request and create 3-8 focused, actionable tasks
2. Structure tasks logically - frontend/UI work together, backend work together, etc.
3. Each task should have enough detail that a developer can start immediately
4. Include clear acceptance criteria in descriptions
5. Be realistic with time estimates (developers usually underestimate)

DESCRIPTION FORMAT:
Create detailed descriptions that include:
- What needs to be built/fixed (the scope)
- Why it matters (business value or dependency)
- Acceptance criteria (how to know it's done)
- Any important technical considerations
- Example: "Create login form that allows users to authenticate with email/password. Must include client-side validation, error messages for invalid credentials, password strength indicator, and 'remember me' option. Should be fully responsive on mobile. Integrates with existing auth API."

RESPONSE FORMAT (VALID JSON ONLY):
[
  {
    "title": "Specific, actionable title (2-8 words, max 100 chars)",
    "description": "2-3 sentences with acceptance criteria and implementation details",
    "priority": "MEDIUM",
    "type": "TASK",
    "estimatedHours": 4,
    "tags": ["relevant", "tags"]
  }
]

PRIORITY GUIDELINES:
- URGENT: Critical bugs, security issues, blockers
- HIGH: Important features, time-sensitive, high business value
- MEDIUM: Regular features, normal priority work
- LOW: Nice-to-haves, future improvements, polish

TYPE GUIDELINES:
- STORY: User-facing feature (UI, workflows)
- TASK: Technical work (setup, configuration, backend)
- BUG: Fixes for existing issues
- EPIC: Large initiatives spanning multiple tasks

TAGGING RULES:
- Use 2-3 tags per task (frontend, backend, database, api, ui, testing, docs, etc.)
- Tags should help categorize and find related tasks

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON array - no markdown, no explanations, no extra text
- All fields are required
- Title: specific verb + noun (not generic)
- Description: detailed enough for independent work
- Hours: 1-40 range, realistic estimates
- Tags: lowercase, hyphenated for multi-word tags`;
}

function parseTasksFromResponse(responseText: string): TaskSuggestion[] {
  try {
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/^```\s*/i, '');
    cleanText = cleanText.replace(/\s*```$/i, '');
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((task: any) => validateAndNormalizeTask(task));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to parse AI-generated tasks. Please try again.');
  }
}

function validateAndNormalizeTask(task: any): TaskSuggestion {
  if (!task.title || typeof task.title !== 'string') {
    throw new Error('Task must have a valid title');
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const priority = task.priority?.toUpperCase();
  if (!validPriorities.includes(priority)) {
    task.priority = 'MEDIUM';
  }

  const validTypes = ['STORY', 'BUG', 'TASK', 'EPIC'];
  const type = task.type?.toUpperCase();
  if (!validTypes.includes(type)) {
    task.type = 'TASK';
  }

  if (task.tags && Array.isArray(task.tags)) {
    task.tags = task.tags.filter((tag: any) => typeof tag === 'string').slice(0, 5);
  } else {
    task.tags = [];
  }

  return {
    title: task.title.substring(0, 200),
    description: task.description || '',
    priority: task.priority || 'MEDIUM',
    type: task.type || 'TASK',
    estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : undefined,
    tags: task.tags || [],
  };
}
