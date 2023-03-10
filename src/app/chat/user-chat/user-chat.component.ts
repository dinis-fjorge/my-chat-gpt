import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChatMessage } from 'src/app/models/chat';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'user-chat',
  templateUrl: './user-chat.component.html',
  styleUrls: ['./user-chat.component.css']
})
export class UserChatComponent {
  @Input() chatMessage!: ChatMessage;
  @Input() backgroundColor!: string;
  @Output("reloadResponseToMessage") reloadResponseToMessage = new EventEmitter<ChatMessage>();
  @Output("triggerAI") triggerAI = new EventEmitter<any>();
  @Output("refreshMessages") refreshMessages = new EventEmitter<any>();
  isEditting: boolean = false;
  editText = "";
  viewSummary: boolean = false;
  gettingImage: boolean = false;

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

  async deleteMessage() {
    await this.dataService.deleteChatMessage(this.chatMessage.id!!);
    this.refreshMessages.emit();
  }

  async deleteSummary() {
    await this.dataService.deleteChatMessageSummary(this.chatMessage.id!!);
    this.refreshMessages.emit();
  }

  async getImage() {
    const messageId = this.chatMessage.id!!;
    this.gettingImage = true;
    console.log(messageId);
    this.dataService.getAIImageFromMessage(messageId).then(response => {
      this.gettingImage = false;
      this.refreshMessages.emit();
    });
  }

  async removeImage() {
    this.chatMessage.imageUrl = undefined;
    this.gettingImage = true;
    this.dataService.editChatMessageOriginal(this.chatMessage).then(response => {
      this.gettingImage = false;
      this.refreshMessages.emit();
    });
  }
}
