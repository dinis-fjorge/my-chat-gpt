import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatMessage } from 'src/app/models/chat';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'system-chat',
  templateUrl: './system-chat.component.html',
  styleUrls: ['./system-chat.component.css']
})
export class SystemChatComponent {
  @Input() chatMessage!: ChatMessage;
  @Input() backgroundColor!: string;
  @Output("reloadResponseToMessage") reloadResponseToMessage = new EventEmitter<ChatMessage>();
  @Output("triggerAI") triggerAI = new EventEmitter<any>();
  @Output("refreshMessages") refreshMessages = new EventEmitter<any>();
  isEditting: boolean = false;
  editText = "";

  constructor(private dataService: DataService) {}

  editMessage() {
    this.isEditting = true;
    this.editText = this.chatMessage.message;
  }

  cancelEdit() {
    this.isEditting = false;
    this.editText = "";
  }

  async saveEdit() {
    this.isEditting = false;
    this.chatMessage.message = this.editText;
    await this.dataService.editChatMessage(this.chatMessage);
    this.editText = "";
    this.refreshMessages.emit();
  }

  async saveEditOriginal() {
    this.isEditting = false;
    this.chatMessage.message = this.editText;
    await this.dataService.editChatMessageOriginal(this.chatMessage);
    this.editText = "";
    this.refreshMessages.emit();
  }

  regenerateResponse() {
    this.reloadResponseToMessage.emit(this.chatMessage);
  }
}
