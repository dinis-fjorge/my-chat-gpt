import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { ChatsComponent } from './chats/chats.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
    {
        path: 'chats',
        component: ChatsComponent,
    },
    {
        path: 'chats/:chatContainerId',
        component: ChatComponent,
    },
    {
        path: 'settings',
        component: SettingsComponent,
    },
    {
        path: '',   redirectTo: '/chats', pathMatch: 'full'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }