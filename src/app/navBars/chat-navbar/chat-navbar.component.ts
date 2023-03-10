import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChatContainer } from 'src/app/models/chat';

@Component({
  selector: 'chat-navbar',
  templateUrl: './chat-navbar.component.html',
  styleUrls: ['./chat-navbar.component.css']
})
export class ChatNavbarComponent implements OnInit {
  @Input() chatContainer!: ChatContainer;
  @Output("openSettings") openSettings = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

}
