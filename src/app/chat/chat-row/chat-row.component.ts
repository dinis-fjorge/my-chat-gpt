import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ChatMessage, ChatRole, ChatRow } from 'src/app/models/chat';
import { DataService } from 'src/app/services/data.service';
import { PictureService } from 'src/app/services/picture.service';

@Component({
  selector: 'chat-row',
  templateUrl: './chat-row.component.html',
  styleUrls: ['./chat-row.component.css']
})
export class ChatRowComponent implements OnInit {
  @Input() chatRow!: ChatRow;
  @Input() settings!: any;
  @Output("reloadResponseToMessage") reloadResponseToMessage = new EventEmitter<ChatMessage>();
  @Output("triggerAI") triggerAI = new EventEmitter<any>();
  @Output("refreshMessages") refreshMessages = new EventEmitter<any>();
  ChatRole = ChatRole;
  imageUrl: string | null = null;
  @ViewChild("image") imageRef!: ElementRef;
  loadAttempts = 0;
  hasLoaded = false;
  hasRefreshed = false;
  showTimeout: any = null;

  constructor(private dataService: DataService, private pictureService: PictureService) {}

  ngOnInit(): void {
    const baseUrl = this.chatRow.messages[this.chatRow.activeIndex].imageUrl??null;
    if(baseUrl) {
      this.pictureService.getImageUrl(baseUrl).then(x=> {
        this.imageUrl = x;
        let img = new Image()
        img.onload = () => {
          this.setImage(this.imageUrl!!);
          this.hasLoaded = true;
          if(!this.hasRefreshed) {
            console.log(2)
            this.hasRefreshed = true;
            if(this.showTimeout) {
              clearTimeout(this.showTimeout);
              this.showTimeout = null;
            }
            this.showTimeout = setTimeout(()=>this.setImage(this.imageUrl!!+"&v=1"),500);
          }
        };
  
        img.onerror = () => {
          if(this.hasLoaded || this.loadAttempts > 600) {
            if(!this.hasRefreshed) {
              console.log(2)
              this.hasRefreshed = true;
              if(this.showTimeout) {
                clearTimeout(this.showTimeout);
                this.showTimeout = null;
              }
              this.showTimeout = setTimeout(()=>img.src = this.imageUrl!!,1000);
            }
          }
          else {
            console.log(1)
            this.loadAttempts += 1;
            if(this.showTimeout) {
              clearTimeout(this.showTimeout);
              this.showTimeout = null;
            }
            this.showTimeout = setTimeout(()=>img.src = this.imageUrl!!,500);
          }
        };
  
        img.src = this.imageUrl!!
      });
    }
  }

  ngOnDestroy() {
    clearTimeout(this.showTimeout);
    this.showTimeout = null;
  }

  private setImage(src: string) {
      this.imageRef.nativeElement.setAttribute('src', src);
  }

  async nextMessage() {
    this.chatRow.activeIndex++;
    await this.dataService.setChatMessageActive(this.chatRow.messages[this.chatRow.activeIndex].id!!);
    this.refreshMessages.emit();
  }

  async prevMessage() {
    this.chatRow.activeIndex--;
    await this.dataService.setChatMessageActive(this.chatRow.messages[this.chatRow.activeIndex].id!!);
    this.refreshMessages.emit();
  }
}
