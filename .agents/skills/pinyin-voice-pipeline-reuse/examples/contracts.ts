/**
 * Cross-project portable contracts (TypeScript reference)
 */

export type ToolName =
  | 'evaluate_pronunciation'
  | 'generate_img2img'
  | 'open_drawing_board'
  | 'get_drawing'
  | 'save_drawing'
  | 'goto_next_phase';

export type UnifiedStatus = 'ok' | 'waiting' | 'unconfigured' | 'error';

export interface PronunciationResult {
  overall: number;
  pronunciation: number;
  tone: number;
  integrity: number;
  passed: boolean;
  weak_phonemes: string[];
  error?: string;
}

export interface ImageGenerationResult {
  url: string;
  status: UnifiedStatus;
  error: string;
  message: string;
}

export interface AgentEventSentence {
  type: 'sentence';
  text: string;
}

export interface AgentEventToolCall {
  type: 'tool_call';
  tool: ToolName;
  args: Record<string, unknown>;
}

export interface FrontendMessage {
  type: 'asr_text' | 'agent_text' | 'assessment_result' | 'drawing_generated';
  [k: string]: unknown;
}
