export interface ChatMessage {
  id?: string,
  userId: string,
  parentId: string,
  chatContainerId: string,
  role: ChatRole,
  message: string,
  summary?: string | null,
  summaryTokens?: number,
  contextMemories?: ContextMemory | null,
  isActive: boolean,
  isDeleted: boolean,
  tokens: number,
  imageUrl?: string,
  date: Date
}

export interface ContextMemory {
  context: string;
  memories: Memory[];
}

export interface Memory {
  keywords: string[];
  memory: string;
}

export interface ChatRow {
  messages: ChatMessage[];
  activeIndex: number;
}

export enum ChatRole {
  User = "user",
  System = "system",
  Assistant = "assistant"
}

export interface ChatContainer {
  id?: string,
  userId: string,
  name: string,
  rootMessageId?: string,
  tokenLimitHandler: TokenLimitHandler;
  maxResponseTokens: number;
  maxSummaryTokens: number;
  isDeleted: boolean,
  date: Date
}

export enum TokenLimitHandler {
  RollingSummary = "RollingSummary",
  ContextMemories = "ContextMemories",
}