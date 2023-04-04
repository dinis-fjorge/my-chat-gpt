import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ChatContainer, ChatMessage, ChatRole, ChatRow, TokenLimitHandler } from '../models/chat';
import { DataService } from '../services/data.service';
import { ChatSettingsComponent } from './chat-settings/chat-settings.component';

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @ViewChild('chatScroll') private chatScroll!: ElementRef;
  @ViewChild('settingsEl') settingsEl! : ChatSettingsComponent;
  chatContainerId!: string;
  chatContainer!: ChatContainer;
  messages: ChatMessage[] = [];
  activeMessages: ChatMessage[] = [];
  chatRows: ChatRow[] = [];
  message: string = "";
  expandedChats: boolean = true;
  aiResponding: boolean = false;
  settingsOpen: boolean = false;
  settings: any = null;
  currentYear: number = new Date().getFullYear();
  constructor(private dataService: DataService, private router: Router, private activatedRoute: ActivatedRoute, private deviceService: DeviceDetectorService) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe(params => {
      const chatContainerId = params.get('chatContainerId') ?? "";
      this.chatContainerId = chatContainerId;
      if(!chatContainerId) this.back();
      this.refreshContainer();
      this.refreshMessages().then(res=> {
        setTimeout(()=>this.scrollToBottom(),10);
      });
    })
    this.dataService.getChatSettings().then(settings => {
      this.settings = settings;
    })
  }

  scrollToBottom(): void {
      try {
          this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      } catch(err) { }
  }

  refreshContainer() {
    this.dataService.getChatContainer(this.chatContainerId).then(container => {
      this.chatContainer = container;
    });
  }

  async refreshMessages() {
    const messages = await this.dataService.getChatContainerMessages(this.chatContainerId);
    this.messages = messages;
    this.chatRows = [];
    let parentId = this.chatContainerId;
    while(true) {
      const nextMessages = this.messages.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime()).filter(x=>x.parentId == parentId);
      if(nextMessages.length) {
        let activeIndex = nextMessages.findIndex(x=>x.isActive);
        if(activeIndex < 0) activeIndex = 0;
        this.chatRows.push({messages: nextMessages, activeIndex: activeIndex} as ChatRow);
        parentId = nextMessages[activeIndex].id!!;
      }
      else break;
    }
    console.log(messages);
    console.log("active messages changed");
    this.activeMessages = this.chatRows.map(x=>x.messages[x.activeIndex]);
    this.settingsEl.updateStatsFromConvo(this.activeMessages);
  }

  back() {
    if(this.settingsOpen) {
      this.toggleSettings();
    }
    else this.router.navigate(['/chats']);
  }

  resetSummary() {
    this.dataService.resetChatSummary(this.chatContainerId);
    this.refreshMessages();
  }

  resetContextMemories() {
    this.dataService.resetChatContextMemories(this.chatContainerId);
    this.refreshMessages();
  }

  async sendMessage() {
    const message = {} as ChatMessage;
    message.role = ChatRole.User;
    message.parentId = this.chatContainer.id!!;
    message.chatContainerId = this.chatContainer.id!!;
    message.message = this.message;
    if(this.chatRows.length == 0) message.role = ChatRole.System;
    else {
      const lastRow = this.chatRows[this.chatRows.length-1];
      message.parentId = lastRow.messages[lastRow.activeIndex].id!!;
    }
    console.log(message);
    if(message.message) {
      this.message = "";
      await this.dataService.addChatMessage(message);
      await this.refreshMessages();
      setTimeout(()=>this.scrollToBottom(),100);
    }
    if(message.role == ChatRole.User) {
      this.aiResponding = true;
      const lastMessage = this.chatRows[this.chatRows.length-1];
      this.dataService.getNewAIMessage(lastMessage.messages[lastMessage.activeIndex].id!!).then(response => {
        this.aiResponding = false;
        this.refreshMessages();
        setTimeout(()=>this.scrollToBottom(),100);
      });
    }
    else {
      this.refreshMessages();
      setTimeout(()=>this.scrollToBottom(),100);
    }
  }

  async getImage() {
    const lastRow = this.chatRows[this.chatRows.length-1];
    const messageId = lastRow.messages[lastRow.activeIndex].id!!;
    console.log(messageId);
    this.aiResponding = true;
    this.dataService.getAIImageFromMessage(messageId).then(response => {
      this.aiResponding = false;
      this.refreshMessages();
      setTimeout(()=>this.scrollToBottom(),100);
    });
  }

  reloadResponseToMessage(chatMessage: ChatMessage) {
    this.message = "";
    this.aiResponding = true;
    const aiMessages = this.chatRows.map(x=>x.messages[x.activeIndex]);
    const indexOfReload = aiMessages.findIndex(x=>x.id ==  chatMessage.id);
    const lastMessage = this.chatRows[indexOfReload];
    this.dataService.getNewAIMessage(lastMessage.messages[lastMessage.activeIndex].id!!).then(response => {
      this.aiResponding = false;
      this.refreshMessages();
    });
  }

  triggerAI() {
    this.aiResponding = true;
    const lastMessage = this.chatRows[this.chatRows.length-1];
    this.dataService.getNewAIMessage(lastMessage.messages[lastMessage.activeIndex].id!!).then(response => {
      this.aiResponding = false;
      this.refreshMessages();
    });
  }

  toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
    this.settingsEl.cancelSettings();
    if(!this.settingsOpen) setTimeout(()=>this.scrollToBottom(),10);
  }

  hitEnter(event: Event) {
    if(this.deviceService.isDesktop()) {
      event.preventDefault();
      event.stopPropagation();
      this.sendMessage();
    }
  }
}
