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

export interface Folder {
  id: string;
  name: string;
  unreadCount: number;
}

export interface FolderMessage {
  id: string;
  subject: string;
  snippet: string;
  body: string;
  from: string;
  fromAddress: string;
  date: number;
  isRead: boolean;
}

export interface Messenger {
  readonly name: string;
  init(): Promise<void>;
  getContacts(): Promise<Contact[]>;
  getMessages(entityId: string, limit?: number): Promise<Message[]>;
  sendMessage(text: string, recipient: string): Promise<void>;

  readonly hasFolders?: boolean;
  getFolders?(): Promise<Folder[]>;
  getFolderMessages?(folderId: string, limit?: number): Promise<FolderMessage[]>;
  getFolderMessage?(folderId: string, messageId: string): Promise<FolderMessage>;
  replyToMessage?(messageId: string, text: string): Promise<void>;
}
