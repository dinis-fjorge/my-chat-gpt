# my-chat-gpt
A locally run Web UI for GPT 3.5 aka ChatGPT's API

## Start and switch between multiple chat conversations
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/chats.PNG?raw=true)

## Set System Instructions and begin chatting just like you would on ChatGPT
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/conversation.PNG?raw=true)

## Configure Conversations to switch between summary/memory presets and tweak settings
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/chat-configurations.PNG?raw=true)

## Request Dalle-2 Images depicting a scene from the current conversation
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/hourglass.PNG?raw=true)
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/space.PNG?raw=true)

## View and edit conversation summary
Summarization is a technique for keeping track of conversations that exceed the 4096 token limit.  The backend will keep track of a running summary, and any time messages are too old to be included in the next API request, a seperate API request will summarize those messages and add it to the running summary.
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/summary.PNG?raw=true)

## View conversation contexts and memories
Context/Memories is another technique for keeping track of conversations that exceed the 4096 token limit.  The backend will keep track of a list of context memory groups, where each time a group of messages are too old to be included in the next API request, a seperate API request will generate a context and list of memories from those messages.  These memories have keywords so future AI requests can be preceded with an API call to select the most relevant keywords, and the memories associated with those keywords will be added to the AI request.
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/context-memories.PNG?raw=true)

## Prompt engineer better prompts for summarization, memory generation, and image prompt request
![chats](https://https://github.com/michaelnutt02/my-chat-gpt/blob/master/readme_images/overall-settings.PNG?raw=true)

## Quick Start

Run `npm install` from the base directory (in terminal, git bash, powershell, etc.  Lookup a tutorial for node if you're not familiar with it)

You may need to install Angular CLI version 15.2.1 seperately. If you have issues with the following step.

Run `npm run startFull` to run both the frontend and the backend server from one command. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the front end files.

## Running just the Backend Server

Run `npm run startBackend` for the backend server. The application will not reload until you close the server and restart it.

## Running just the Frontend Web UI Server

Run `npm run startFrontend` for the frontend server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Angular Development Info

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.1.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
