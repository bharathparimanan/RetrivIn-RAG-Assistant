export interface SourceItem {
  id: string;
  type: 'linkedin' | 'github' | 'youtube' | 'report' | 'resource' | 'attachment';
  name: string;
  connected: boolean;
  selected: boolean;
}

export interface PinItem {
  id: string;
  type: 'note' | 'project';
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
