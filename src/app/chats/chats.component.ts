import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChatContainer } from '../models/chat';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.css']
})
export class ChatsComponent implements OnInit {
  chatContainers: ChatContainer[] = [];
  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.refreshChats();
  }

  refreshChats() {
    this.dataService.getChatContainers().then(newChats => {
      this.chatContainers = newChats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }
  
  openChat(chat: ChatContainer) {
    this.router.navigate(['/chats',chat.id ]);
  }

  newChat() {
    this.dataService.addNewChatContainer().then(x=>{
      this.refreshChats();
    });
  }

  async deleteContainer(chatContainer: ChatContainer) {
    await this.dataService.deleteChatContainer(chatContainer.id!!);
    this.refreshChats();
  }
}
