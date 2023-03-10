import { Injectable, OnInit } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ChatContainer, ChatMessage, ChatRole } from '../models/chat';
import { HttpService } from './http.service';



@Injectable({
  providedIn: 'root'
})
export class DataService implements OnInit {
  openai: any = null;
  openAiApiKey: string | null = null;

  constructor(private httpService: HttpService) { }

  ngOnInit(): void {
    
  }

  async addChatMessage(chatMessage: ChatMessage): Promise<any> {
    chatMessage.date = new Date();
    chatMessage.isDeleted = false;
    chatMessage.isActive = true;
    return await this.httpService.post('addChatMessage', chatMessage);
  }
  async editChatMessage(chatMessage: ChatMessage): Promise<any> {
    return await this.httpService.post('editChatMessageKeepOriginal', chatMessage);
  }
  async editChatMessageOriginal(chatMessage: ChatMessage): Promise<any> {
    return await this.httpService.post('editChatMessage', chatMessage);
  }
  async deleteChatMessage(chatMessageId: string): Promise<any> {
    return await this.httpService.get('deleteChatMessage?chatMessageId='+chatMessageId);
  }
  async deleteChatContainer(chatContainerId: string): Promise<any> {
    return await this.httpService.get('deleteChatContainer?chatContainerId='+chatContainerId);
  }
  async deleteChatMessageSummary(chatMessageId: string): Promise<any> {
    return await this.httpService.get('deleteChatMessageSummary?chatMessageId='+chatMessageId);
  }
  async resetChatSummary(chatContainerId: string): Promise<any> {
    return await this.httpService.get('resetChatSummary?chatContainerId='+chatContainerId);
  }
  async resetChatContextMemories(chatContainerId: string): Promise<any> {
    return await this.httpService.get('resetChatContextMemories?chatContainerId='+chatContainerId);
  }
  async setChatMessageActive(chatMessageId: string): Promise<any> {
    return await this.httpService.get('setChatMessageActive?chatMessageId='+chatMessageId);
  }
  async getChatContainers(): Promise<ChatContainer[]> {
    return await this.httpService.get('getChatContainers');
  }
  async getChatContainer(chatContainerId: string): Promise<ChatContainer> {
    return await this.httpService.get('getChatContainer/?chatContainerId='+chatContainerId);
  }
  async addNewChatContainer(): Promise<any> {
    const chatContainer = {} as ChatContainer;
    chatContainer.date = new Date();
    chatContainer.isDeleted = false;
    chatContainer.name = "New Chat";
    chatContainer.maxSummaryTokens = 1500;
    chatContainer.maxResponseTokens = 750;
    return await this.httpService.post('addChatContainer', chatContainer);
  }
  async editChatContainer(chatContainer: ChatContainer): Promise<any> {
    return await this.httpService.post('editChatContainer', chatContainer);
  }
  async getChatContainerMessages(chatContainerId: string): Promise<ChatMessage[]> {
    return await this.httpService.get('getChatContainerMessages/?chatContainerId='+chatContainerId);
  }

  async getNewAIMessage(chatMessageId: string): Promise<ChatMessage> {
    return await this.httpService.get('getNewAIMessage/?chatMessageId='+chatMessageId);
  }

  async getAIImageFromMessage(chatMessageId: string): Promise<ChatMessage> {
    return await this.httpService.get('getAIImageFromMessage/?chatMessageId='+chatMessageId);
  }
  async getChatSettings(): Promise<any> {
    return await this.httpService.get('getChatSettings');
  }
  async editChatSettings(chatSettings: any): Promise<any> {
    return await this.httpService.post('editChatSettings', chatSettings);
  }
  
}

