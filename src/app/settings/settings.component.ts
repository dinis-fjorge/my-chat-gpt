import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { HttpService } from '../services/http.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  firstName: string = "";
  lastName: string = "";
  openAiApiKey: string = "";
  basicSummaryInstructionText: string = "";
  repeatedSummaryInstructionText: string = "";
  shortenSummaryInstructionText: string = "";
  basicContextInstructionText: string = "";
  repeatedContextInstructionText: string = "";
  memoryInstructionText: string = "";
  selectKeywordsInstructionText: string = "";
  imagePromptInstructionText: string = "";
  useName: boolean = false;
  imageSize: number = 0;
  systemChatColor: string = "";
  assistantChatColor: string = "";
  userChatColor: string = "";

  constructor(public httpService: HttpService, private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getChatSettings().then(chatSettings => {
      this.firstName = chatSettings.firstName??"";
      this.lastName = chatSettings.lastName??"";
      this.openAiApiKey = chatSettings.openAiApiKey??"";
      this.useName = chatSettings.useName??false;
      this.basicSummaryInstructionText = chatSettings.basicSummaryInstructionText??"";
      this.repeatedSummaryInstructionText = chatSettings.repeatedSummaryInstructionText??"";
      this.shortenSummaryInstructionText = chatSettings.shortenSummaryInstructionText??"";
      this.basicContextInstructionText = chatSettings.basicContextInstructionText??"";
      this.repeatedContextInstructionText = chatSettings.repeatedContextInstructionText??"";
      this.memoryInstructionText = chatSettings.memoryInstructionText??"";
      this.selectKeywordsInstructionText = chatSettings.selectKeywordsInstructionText??"";
      this.imagePromptInstructionText = chatSettings.imagePromptInstructionText??"";
      this.imageSize = chatSettings.imageSize??0;
      this.userChatColor = chatSettings.userChatColor??"";
      this.assistantChatColor = chatSettings.assistantChatColor??"";
      this.systemChatColor = chatSettings.systemChatColor??"";
    });
  }

  saveSettings() {
    const body = {
      firstName: this.firstName, 
      lastName: this.lastName,
      openAiApiKey: this.openAiApiKey,
      useName: this.useName,
      basicSummaryInstructionText: this.basicSummaryInstructionText,
      repeatedSummaryInstructionText: this.repeatedSummaryInstructionText,
      shortenSummaryInstructionText: this.shortenSummaryInstructionText,
      basicContextInstructionText: this.basicContextInstructionText,
      repeatedContextInstructionText: this.repeatedContextInstructionText,
      memoryInstructionText: this.memoryInstructionText,
      selectKeywordsInstructionText: this.selectKeywordsInstructionText,
      imagePromptInstructionText: this.imagePromptInstructionText,
      imageSize: this.imageSize,
      userChatColor: this.userChatColor,
      assistantChatColor: this.assistantChatColor,
      systemChatColor: this.systemChatColor,
    };
    this.dataService.editChatSettings(body);
  }
}
