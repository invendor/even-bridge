export interface Contact {
  id: string;
  name: string;
  username: string | null;
  isUser: boolean;
  isGroup: boolean;
  isChannel: boolean;
}

export interface Message {
  id: string | number;
  text: string;
  out: boolean;
  date: number;
  senderName: string;
}

export interface Messenger {
  readonly name: string;
  init(): Promise<void>;
  getContacts(): Promise<Contact[]>;
  getMessages(entityId: string, limit?: number): Promise<Message[]>;
  sendMessage(text: string, recipient: string): Promise<void>;
}
