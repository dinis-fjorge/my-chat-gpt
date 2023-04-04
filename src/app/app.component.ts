import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Configuration, OpenAIApi } from 'openai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  currentYear: number = new Date().getFullYear();
  public selectedFile: File | null = null;
  private configuration: Configuration;
  private openAi: OpenAIApi;

  public prompts = [
    'The man should be on the pyramid of giza',
    'The man should be on eifel tower',
    'The man should be on the big ben',
    'The man should be on the jungle',
    'The man should be surfing',
    'The man should be swiming with sharks',
  ];

  public results: string[] = [];

  constructor(private http: HttpClient) {
    this.configuration = new Configuration({
      apiKey: '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',
      formDataCtor: CustomFormData,
    });

    this.openAi = new OpenAIApi(this.configuration);
  }

  generate() {
    this.prompts.forEach((prompt) => {
      this.openAi
        .createImageEdit(this.selectedFile as File, prompt)
        .then((response) => {
          this.results.push((response as any).data.data[0].url);
        });
    });
  }

  // variate() {
  //   this.openAi
  //     .createImageVariation(this.selectedFile as File, 10, '256x256')
  //     .then((response) => {
  //       this.imageUrl = (response as any).data.data[0].url;
  //     });
  // }

  onFileSelected(files: any) {
    this.selectedFile = files.target.files[0];
  }
}

class CustomFormData extends FormData {
  getHeaders() {
    return {};
  }
}
