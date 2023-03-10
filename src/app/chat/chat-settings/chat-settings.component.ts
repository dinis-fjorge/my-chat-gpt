import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ChatContainer, ChatMessage, ChatRole, TokenLimitHandler } from 'src/app/models/chat';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'chat-settings',
  templateUrl: './chat-settings.component.html',
  styleUrls: ['./chat-settings.component.css']
})
export class ChatSettingsComponent implements OnInit {
  @Input() chatContainer!: ChatContainer;
  chatContainerId!: string;
  @Output("closeSettings") closeSettings = new EventEmitter<any>();
  @Output("refreshMessages") refreshMessages = new EventEmitter<any>();
  TokenLimitHandler = TokenLimitHandler;
  tokenLimitHandler!: TokenLimitHandler;
  maxResponseTokens!: number;
  maxSummaryTokens!: number;
  systemTokens!: number;
  totalTokens: number = 0;
  edittingName: boolean = false;
  edittingSummary: boolean = false;
  name: string = "";
  summaryEdit: string = "";

  summaryMessage: ChatMessage | null = null;
  contextMessages: ChatMessage[] | null = null;

  constructor(private dataService: DataService, private router: Router, private activatedRoute: ActivatedRoute, private deviceService: DeviceDetectorService) {}

  ngOnInit(): void {
    this.chatContainerId = this.chatContainer.id!!;
    this.refreshContainer();
  }

  public updateStatsFromConvo(activeMessages: ChatMessage[]) {
    console.log()
    const reversedActiveMessages = [...activeMessages].reverse();
    this.summaryMessage = reversedActiveMessages.find(x=>x.summary)??null;
    this.systemTokens = activeMessages.filter(x=>x.role== ChatRole.System).reduce((p,n)=>p+n.tokens??0,0);
    this.contextMessages = activeMessages.filter(x=>x.contextMemories);
    this.totalTokens = activeMessages.reduce((p,n)=>p+n.tokens??0,0);
  }

  refreshContainer() {
    this.dataService.getChatContainer(this.chatContainerId).then(container => {
      this.chatContainer = container;
      this.cancelSettings();
    });
  }

  back() {
    this.closeSettings.emit();
  }

  resetSummary() {
    this.dataService.resetChatSummary(this.chatContainerId);
    this.refreshMessages.emit();
  }

  resetContextMemories() {
    this.dataService.resetChatContextMemories(this.chatContainerId);
    this.refreshMessages.emit();
  }

  async saveSummary() {
    this.summaryMessage!!.summary = this.summaryEdit;
    await this.dataService.editChatMessageOriginal(this.summaryMessage!!);
    this.refreshMessages.emit();
    this.summaryEdit = "";
    this.edittingSummary = false;
  }

  editSummary() {
    this.summaryEdit = this.summaryMessage!!.summary!!;
    this.edittingSummary = true;
  }

  async deleteLastSummary() {
    this.summaryMessage!!.summary = null;
    await this.dataService.editChatMessageOriginal(this.summaryMessage!!);
    this.refreshMessages.emit();
  }

  async deleteLastContextMemories() {
    const deletedContextMemory = this.contextMessages!!.splice(this.contextMessages!!.length-1,1);
    deletedContextMemory[0].contextMemories = null;
    await this.dataService.editChatMessageOriginal(deletedContextMemory[0]);
    this.refreshMessages.emit();
  }

  cancelSummary() {
    this.summaryEdit = "";
    this.edittingSummary = false;
  }

  editName() {
    this.edittingName = true;
    this.name = this.chatContainer!!.name;
  }

  saveName() {
    this.chatContainer!!.name = this.name;
    this.dataService.editChatContainer(this.chatContainer!!);
    this.edittingName = false;
  }

  cancelName() {
    this.name = "";
    this.edittingName = false;
  }

  saveSettings() {
    this.chatContainer.tokenLimitHandler = this.tokenLimitHandler;
    this.chatContainer.maxResponseTokens = this.maxResponseTokens;
    this.chatContainer.maxSummaryTokens = this.maxSummaryTokens;

    this.dataService.editChatContainer(this.chatContainer);
  }

  public cancelSettings() {
    this.cancelSummary();
    this.tokenLimitHandler = this.chatContainer.tokenLimitHandler;
    this.maxResponseTokens = this.chatContainer.maxResponseTokens;
    this.maxSummaryTokens = this.chatContainer.maxSummaryTokens;
  }

}
