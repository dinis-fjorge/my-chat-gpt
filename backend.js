const express = require('express');
const http = require("http");
const https = require("https");
const app = express();
const httpsPort = process.env.PORT || 29879;
const httpPort = process.env.PORT || 29880;
const cors = require('cors');
const fs = require('fs');
const bodyParser = require("body-parser");
const { promisify } = require('util');
const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');
const { Configuration, OpenAIApi, CreateEmbeddingRequest } = require('openai')
const { encode, decode } = require('gpt-3-encoder')
const download = require('image-downloader');

const httpsServer = https.createServer(app);
const httpServer = http.createServer(app);

function downloadImage(url, filepath) {
    return download.image({
       url,
       dest: filepath 
    });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/', bodyParser.json());

app.get('/api/imageByPath', (req, res) => {
  if(fs.existsSync(req.query.path, fs.R_OK)) {
    res.sendFile(req.query.path);
  }
  else res.send(false);
});

app.get('/api/getChatContainers', (req, res) => {
  let chatContainers = getChatGPTContainers().filter(x=>!x.isDeleted);
  res.json(chatContainers);
});

app.get('/api/getChatContainer', (req, res) => {
  console.log("got chat container")
  let chatContainer = getChatGPTContainers().find(x=>x.id == req.query.chatContainerId);
  res.json(chatContainer);
});

app.get('/api/getChatContainerMessages', (req, res) => {
  console.log("got chat containers")
  console.log("got chat messages")
  let chatMessages = getChatGPTMessages().filter(x=>req.query.chatContainerId == x.chatContainerId && !x.isDeleted);
  res.json(chatMessages);
});

app.get('/api/getChatSettings', (req, res) => {
  console.log("got chat settings")
  setChatGPTSettingsDefaults();
  let chatGPTSettings = getChatGPTSettings();
  res.json(chatGPTSettings);
});

app.post('/api/editChatSettings', (req, res) => {
  console.log("editted chat settings")
  let chatGPTSettings = getChatGPTSettings();
  const keys = Object.keys(req.body);
  keys.forEach(key=>chatGPTSettings[key]=req.body[key]);
  saveChatGPTSettings(chatGPTSettings);
  res.send(true);
});

app.get('/api/resetChatSummary', (req, res) => {
  console.log("reset chat summaries")
  const allMessages = getChatGPTMessages();
  let chatMessages = allMessages.filter(x=>req.query.chatContainerId == x.chatContainerId && !x.isDeleted);
  chatMessages.forEach(x=>x.summary = null);
  saveChatGPTMessages(allMessages);
  res.send(true);
});

app.get('/api/resetChatContextMemories', (req, res) => {
  const allMessages = getChatGPTMessages();
  let chatMessages = allMessages.filter(x=>req.query.chatContainerId == x.chatContainerId && !x.isDeleted);
  chatMessages.forEach(x=>x.contextMemories = null);
  saveChatGPTMessages(allMessages);
  res.send(true);
});

app.post('/api/addChatMessage', (req, res) => {
  console.log("added chat message")
  let chatGPTMessages = getChatGPTMessages();
  const message = req.body;
  message.id = uuidv1();
  message.date = new Date();
  message.tokens = encode(message.message).length;
  chatGPTMessages.push(message);
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.post('/api/editChatMessage', (req, res) => {
  console.log("editted chat message")
  let chatGPTMessages = getChatGPTMessages();
  const newMessage = req.body;
  const message = chatGPTMessages.find(x=>x.id == newMessage.id);
  message.tokens = encode(newMessage.message).length;
  message.message = newMessage.message;
  message.summary = newMessage.summary;
  message.contextMemories = newMessage.contextMemories;
  message.imageUrl = newMessage.imageUrl;
  const summaryTokens = newMessage.summary?encode(newMessage.summary).length : null;
  message.summaryTokens = summaryTokens;
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.post('/api/editChatMessageKeepOriginal', (req, res) => {
  console.log("editted chat message")
  let chatGPTMessages = getChatGPTMessages();
  const newMessage = req.body;
  const message = chatGPTMessages.find(x=>x.id == newMessage.id);
  message.isActive = false;
  newMessage.isActive = true;
  newMessage.date = new Date();
  newMessage.id = uuidv1();
  newMessage.tokens = encode(newMessage.message).length;
  chatGPTMessages.push(newMessage);
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.get('/api/deleteChatMessage', (req, res) => {
  console.log("deleted chat message")
  let chatGPTMessages = getChatGPTMessages();
  const message = chatGPTMessages.find(x=>x.id == req.query.chatMessageId);
  message.isDeleted = true;
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.get('/api/deleteChatContainer', (req, res) => {
  console.log("deleted chat container")
  let chatGPTContainers = getChatGPTContainers();
  const container = chatGPTContainers.find(x=>x.id == req.query.chatContainerId);
  container.isDeleted = true;
  saveChatGPTContainers(chatGPTContainers);
  res.send(true);
});

app.get('/api/deleteChatMessageSummary', (req, res) => {
  console.log("deleted chat message")
  let chatGPTMessages = getChatGPTMessages();
  const message = chatGPTMessages.find(x=>x.id == req.query.chatMessageId);
  message.summary = null;
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.get('/api/deleteChatMessageContextMemories', (req, res) => {
  console.log("deleted chat message")
  let chatGPTMessages = getChatGPTMessages();
  const message = chatGPTMessages.find(x=>x.id == req.query.chatMessageId);
  message.contextMemories = null;
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.get('/api/setChatMessageActive', (req, res) => {
  console.log("set chat message active")
  let chatGPTMessages = getChatGPTMessages();
  const message = chatGPTMessages.find(x=>x.id == req.query.chatMessageId);
  message.isActive = true;
  const siblings = chatGPTMessages.filter(x=>x.parentId == message.parentId && x.id != message.id);
  siblings.forEach(x=>x.isActive = false);
  saveChatGPTMessages(chatGPTMessages);
  res.send(true);
});

app.post('/api/addChatContainer', (req, res) => {
  console.log("added chat container")
  let chatGPTContainers = getChatGPTContainers();
  const container = req.body;
  container.date = new Date();
  container.id = uuidv1();
  chatGPTContainers.push(container);
  saveChatGPTContainers(chatGPTContainers);
  res.json(true);
});

app.post('/api/editChatContainer', (req, res) => {
  console.log("editted chat container")
  let chatGPTContainers = getChatGPTContainers();
  const newContainer = req.body;
  const containerIndex = chatGPTContainers.findIndex(x=>x.id == newContainer.id);
  chatGPTContainers.splice(containerIndex,1);
  chatGPTContainers.push(newContainer);
  saveChatGPTContainers(chatGPTContainers);
  res.send(true);
});

app.get('/api/getAIImageFromMessage', (req, res) => {
  console.log("generated ai image from message")
  generateOpenAIImageFromMessageMain(req.query.chatMessageId).then(funcRes=>{
    res.send(funcRes);
  });
});

app.get('/api/getNewAIMessage', (req, res) => {
  generateOpenAIMessageMain(req.query.chatMessageId).then(funcRes=>{
    res.send(funcRes);
  });
});

function getChatGPTContainers() {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  if(!fs.existsSync("./db/chatGPTContainers.json", fs.R_OK)) {
    fs.writeFileSync('./db/chatGPTContainers.json', "[]");
  }
  const rawContainerData = fs.readFileSync('./db/chatGPTContainers.json');
  return JSON.parse(rawContainerData);
}

function saveChatGPTContainers(containers) {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  const data = JSON.stringify(containers);
  fs.writeFileSync('./db/chatGPTContainers.json', data);
}

function getChatGPTMessages() {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  if(!fs.existsSync("./db/chatGPTMessages.json", fs.R_OK)) {
    fs.writeFileSync('./db/chatGPTMessages.json', "[]");
  }
  const rawMessageData = fs.readFileSync('./db/chatGPTMessages.json');
  return JSON.parse(rawMessageData);
}

function saveChatGPTMessages(messages) {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  const data = JSON.stringify(messages);
  fs.writeFileSync('./db/chatGPTMessages.json', data);
}

function getChatGPTSettings() {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  if(!fs.existsSync("./db/chatGPTSettings.json", fs.R_OK)) {
    fs.writeFileSync('./db/chatGPTSettings.json', "{}");
  }
  const rawSettingsData = fs.readFileSync('./db/chatGPTSettings.json');
  return JSON.parse(rawSettingsData);
}

function getDefaultChatGPTSettings() {
  if(!fs.existsSync("./defaults.chatGPTSettings.json", fs.R_OK)) {
    fs.writeFileSync('./defaults.chatGPTSettings.json', "{}");
  }
  const rawSettingsData = fs.readFileSync('./defaults.chatGPTSettings.json');
  return JSON.parse(rawSettingsData);
}

function saveChatGPTSettings(settings) {
  if (!fs.existsSync("./db")){
    fs.mkdirSync("./db");
  }
  const data = JSON.stringify(settings);
  fs.writeFileSync('./db/chatGPTSettings.json', data);
}

function setChatGPTSettingsDefaults() {
  const chatGPTSettings = getChatGPTSettings();
  const defaultChatGPTSettings = getDefaultChatGPTSettings();
  const keys = Object.keys(defaultChatGPTSettings);
  keys.forEach(key => {
    if(!chatGPTSettings[key]) chatGPTSettings[key] = defaultChatGPTSettings[key];
  });
  saveChatGPTSettings(chatGPTSettings);
}

async function generateOpenAIImageFromMessageMain(chatMessageId) {
  setChatGPTSettingsDefaults();
  const allChatMessages = getChatGPTMessages();
  const baseMessage = allChatMessages.find(x=>x.id == chatMessageId);
  const chatContainerId = baseMessage.chatContainerId;
  const chatContainer = getChatGPTContainers().find(x=>x.id == chatContainerId);
  const myChatMessages = allChatMessages.filter(x=>chatContainerId == x.chatContainerId && !x.isDeleted);
  const chatGPTSettings = getChatGPTSettings();
  const message = {};
  message.role = "user";
  message.parentId = chatMessageId;
  message.chatContainerId = chatContainerId;
  message.message = chatGPTSettings.imagePromptInstructionText;
  message.tokens = encode(message.message).length;
  message.id = uuidv1();
  message.isActive = true;
  message.date = new Date();
  myChatMessages.push(message);
  console.log("At AI image function");

  const aiPromptMessage = await generateOpenAIMessageDiscardOld(message.id, myChatMessages, chatContainer);

  if(!aiPromptMessage) return false;
  console.log("Generated AI Prompt Message: "+aiPromptMessage.content);
  console.log("------------");
  if(aiPromptMessage.content.indexOf("[") == -1) return false;
  const aiPromptText = aiPromptMessage.content.substring(aiPromptMessage.content.indexOf("[")+1, aiPromptMessage.content.lastIndexOf("]"));

  let imageSize = "256x256";
  if(chatGPTSettings.imageSize == 1) {
    imageSize = "512x512";
  }
  else if(chatGPTSettings.imageSize == 2) {
    imageSize = "1024x1024";
  }
  const configuration = new Configuration({
    apiKey: chatGPTSettings.openAiApiKey,
  });
  const openai = new OpenAIApi(configuration);
  let response = null;
  try {
    response = await openai.createImage({
      prompt: aiPromptText,
      n: 1,
      size: imageSize,
    });
  }
  catch(ex) {
    return false;
  }
  const generatedImageUrl = response.data.data[0].url;
  const newFilepath = __dirname+"/images/"+uuidv1()+".png";
  if (!fs.existsSync("./images")){
    fs.mkdirSync("./images");
  }
  downloadImage(generatedImageUrl, newFilepath);
  baseMessage.imageUrl = newFilepath;
  saveChatGPTMessages(allChatMessages);
  return true;
}

async function generateOpenAIMessageMain(chatMessageId) {
  setChatGPTSettingsDefaults();
  const allChatMessages = getChatGPTMessages();
  const baseMessage = allChatMessages.find(x=>x.id == chatMessageId)
  const chatContainerId = baseMessage.chatContainerId;
  const chatContainer = getChatGPTContainers().find(x=>x.id == chatContainerId);
  const myChatMessages = allChatMessages.filter(x=>chatContainerId == x.chatContainerId && !x.isDeleted);
  let aiMessage = "";
  console.log("At main AI function");

  if(chatContainer.tokenLimitHandler == "ContextMemories") {
    console.log("Chose context memories");
    aiMessage = await generateOpenAIMessageWithContextMemories(chatMessageId, myChatMessages, chatContainer);
  }
  else {
    console.log("Chose rolling summary");
    aiMessage = await generateOpenAIMessageWithRollingSummary(chatMessageId, myChatMessages, chatContainer);
  }

  if(!aiMessage) return false;
  console.log("Generated AI Message: "+aiMessage.content);
  console.log("------------");

  const message = {};
  message.role = "assistant";
  message.parentId = chatMessageId;
  message.chatContainerId = chatContainerId;
  message.message = aiMessage.content;
  message.tokens = encode(message.message).length;
  message.id = uuidv1();
  message.isActive = true;
  message.date = new Date();
  const siblingMessages = myChatMessages.filter(x=>x.parentId == message.parentId);
  siblingMessages.forEach(x=>x.isActive = false);
  allChatMessages.push(message);
  saveChatGPTMessages(allChatMessages);
  return true;
}

async function generateOpenAIMessageDiscardOld(chatMessageId, allChatMessages, chatContainer) {
  const chatContainerId = chatContainer.id;
  const baseMessage = allChatMessages.find(x=>x.id == chatMessageId)
  const maxResponseTokens = parseInt(chatContainer.maxResponseTokens ?? 750);
  const chatGPTSettings = getChatGPTSettings();

  const messages = [allChatMessages.find(x=>x.id == chatMessageId)];
  while(messages[messages.length-1].parentId != chatContainerId) {
    const nextMessage = allChatMessages.find(x=>x.id == messages[messages.length-1].parentId);
    if(nextMessage) {
      messages.push(nextMessage);
    }
    else break;
  }
  messages.reverse();
  // messages.forEach(x=>x.summary = null);
  let myMessages = [...messages];
  let introTokens = 0;
  if(chatGPTSettings.useName) {
    const introMessage = `The User's first name is ${chatGPTSettings.firstName}, and their last name is ${chatGPTSettings.lastName}`;
    introTokens = encode(introMessage).length;
    myMessages = [{role: "system", message: introMessage, tokens: introTokens}, ...myMessages];
  }
  // console.log(messages);
  console.log(baseMessage);
  const systemTokens = introTokens + messages.filter(x=>x.role == "system").reduce((p,n)=>p+n.tokens,0);
  const totalTokens = systemTokens + messages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0);
  console.log("total tokens before: "+totalTokens);
  console.log("maxResponseTokens: "+maxResponseTokens);
  console.log("system tokens: "+systemTokens);
  let discardedMessages = [];

  while(systemTokens + maxResponseTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096) {
    discardedMessages = [...discardedMessages, ...myMessages.splice(myMessages.findIndex(x=>x.role != "system"),1)];
  }

  console.log("non-system tokens after: "+ myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+(n.tokens??0),0));

  const openAIMessages = myMessages.map(x=>{return{role: x.role, content: x.message}});
  const aiMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMessages);
  return aiMessage;
}

async function generateOpenAIMessageWithRollingSummary(chatMessageId, allChatMessages, chatContainer) {
  const chatContainerId = chatContainer.id;
  const baseMessage = allChatMessages.find(x=>x.id == chatMessageId)
  const maxResponseTokens = parseInt(chatContainer.maxResponseTokens ?? 750);
  const maxSummaryTokens = parseInt(chatContainer.maxSummaryTokens ?? 1500);
  const chatGPTSettings = getChatGPTSettings();

  const messages = [allChatMessages.find(x=>x.id == chatMessageId)];
  while(messages[messages.length-1].parentId != chatContainerId) {
    const nextMessage = allChatMessages.find(x=>x.id == messages[messages.length-1].parentId);
    if(nextMessage) {
      messages.push(nextMessage);
    }
    else break;
  }
  messages.reverse();
  // messages.forEach(x=>x.summary = null);
  let myMessages = [...messages];
  let introTokens = 0;
  if(chatGPTSettings.useName) {
    const introMessage = `The User's first name is ${chatGPTSettings.firstName}, and their last name is ${chatGPTSettings.lastName}`;
    introTokens = encode(introMessage).length;
    myMessages = [{role: "system", message: introMessage, tokens: introTokens}, ...myMessages];
  }
  // console.log(messages);
  console.log(baseMessage);
  const systemTokens = introTokens + messages.filter(x=>x.role == "system").reduce((p,n)=>p+n.tokens,0);
  const totalTokens = systemTokens + messages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0);
  console.log("total tokens before: "+totalTokens);
  console.log("maxResponseTokens: "+maxResponseTokens);
  console.log("system tokens: "+systemTokens);
  let discardedMessages = [];

  while(systemTokens + maxResponseTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096) {
    // console.log(systemTokens + maxResponseTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0));
    discardedMessages = [...discardedMessages, ...myMessages.splice(myMessages.findIndex(x=>x.role != "system"),1)];
  }

  if(discardedMessages.length > 0) {
    console.log("Starting summarization");
    while((systemTokens + maxResponseTokens + maxSummaryTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096) 
      && (!discardedMessages[discardedMessages.length-1].summary || systemTokens + maxResponseTokens + discardedMessages[discardedMessages.length-1].summaryTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096)) {
      discardedMessages = [...discardedMessages, ...myMessages.splice(myMessages.findIndex(x=>x.role != "system"),1)];
    }
    const lastMessage = discardedMessages[discardedMessages.length-1];
    if(!lastMessage.summary) {
      console.log("Messages Discarded: "+discardedMessages.length);
      const prevSummaryIndex = discardedMessages.findLastIndex(x=>x.summary);
      let prevSummary = "";
      if(prevSummaryIndex >= 0) {
        prevSummary = discardedMessages[prevSummaryIndex].summary;
        console.log("Using previous summary: "+prevSummary);
        console.log("------------");
        discardedMessages.splice(0,prevSummaryIndex+1);
      }
      console.log("Messages to summarize: "+discardedMessages.length);
      let summaryInstructionMessage = chatGPTSettings.basicSummaryInstructionText;
      while(discardedMessages.length > 0) {
        if(prevSummary) summaryInstructionMessage = chatGPTSettings.repeatedSummaryInstructionText;
        const summaryInstructionTokens = encode(summaryInstructionMessage).length;
        let messagesToSummarize = [...discardedMessages];
        discardedMessages = [];
        const prevSummaryText = "Previous Conversation Summary: "+prevSummary;
        const prevSummaryTokens = prevSummary? encode(prevSummaryText).length : 0;
        while(systemTokens + summaryInstructionTokens + prevSummaryTokens + maxSummaryTokens + messagesToSummarize.reduce((p,n)=>p+n.tokens,0) > 4096) {
          discardedMessages = [...messagesToSummarize.splice(messagesToSummarize.length-1,1), ...discardedMessages];
        }
        console.log("Summarizing from: "+messagesToSummarize[0].message);
        console.log("------------");
        console.log("Summarizing till: "+messagesToSummarize[messagesToSummarize.length-1].message);
        console.log("------------");
        const beginningMessages = myMessages.filter(x=>x.role == "system");
        if(prevSummary) beginningMessages.push({role: "assistant", message: prevSummaryText, tokens: prevSummaryTokens});
        messagesToSummarize = [...beginningMessages, ...messagesToSummarize, {role: "system", message: summaryInstructionMessage, tokens: summaryInstructionTokens}];
        // console.log(messagesToSummarize.map(x=>x.message)[0]+" - "+messagesToSummarize.map(x=>x.message)[messagesToSummarize.length-1]);
        console.log("Generating summary on "+messagesToSummarize.reduce((p,n)=>p+n.tokens,0)+" tokens");
        const openAIMessages = messagesToSummarize.map(x=>{return{role: x.role, content: x.message}});
        const aiMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMessages);
        if(!aiMessage) return null;
        const trimmedMessage = aiMessage.content.replace(/Previous Conversation Summary:/g, "").replace(/Previous conversation summary:/g, "").replace(/previous conversation summary:/g, "").replace(/My Summary:/g, "").replace(/my Summary:/g, "").replace(/My summary:/g, "").replace(/my summary:/g, "").replace(/Summary:/g, "").replace(/summary:/g, "").trim();
        console.log("Generated summary: "+trimmedMessage);
        console.log("------------");
        let summary = trimmedMessage;
        if(prevSummary) prevSummary = prevSummary + " " + summary;
        else prevSummary = summary;
      }
      lastMessage.summary = prevSummary;
    }
    const summaryShortenMessage = chatGPTSettings.shortenSummaryInstructionText;
    let resumarizeIters = 0;
    while(encode(lastMessage.summary).length > maxSummaryTokens && resumarizeIters < 5) {
      resumarizeIters++;
      const messagesToShorten = [{role: "system", message: summaryShortenMessage.replace(/\n/g, "")}, {role: "user", message: lastMessage.summary.replace(/\n/g, "")}];
      const openAIMessages = messagesToShorten.map(x=>{return{role: x.role, content: x.message}});
      const aiMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMessages);
      if(!aiMessage) return null;
      lastMessage.summary = aiMessage.content;
      console.log("Summarized down to: "+lastMessage.summary);
      console.log("------------");
    }
    const summaryTokens = encode(lastMessage.summary).length;
    lastMessage.summaryTokens = summaryTokens;
    console.log("summaryTokens: "+summaryTokens);
    myMessages = [...myMessages.filter(x=>x.role == "system"), {role: "assistant", message: lastMessage.summary, tokens: lastMessage.summaryTokens}, ...myMessages.filter(x=>x.role != "system")]
  }

  console.log("non-system tokens after: "+ myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+(n.tokens??0),0));

  const openAIMessages = myMessages.map(x=>{return{role: x.role, content: x.message}});
  const aiMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMessages);
  return aiMessage;
}

async function generateOpenAIMessageWithContextMemories(chatMessageId, allChatMessages, chatContainer) {
  const chatContainerId = chatContainer.id;
  const baseMessage = allChatMessages.find(x=>x.id == chatMessageId)
  const maxResponseTokens = parseInt(chatContainer.maxResponseTokens ?? 750);
  const maxSummaryTokens = parseInt(chatContainer.maxSummaryTokens ?? 1500);
  const chatGPTSettings = getChatGPTSettings();

  const messages = [allChatMessages.find(x=>x.id == chatMessageId)];
  while(messages[messages.length-1].parentId != chatContainerId) {
    const nextMessage = allChatMessages.find(x=>x.id == messages[messages.length-1].parentId);
    if(nextMessage) {
      messages.push(nextMessage);
    }
    else break;
  }
  messages.reverse();
  // messages.forEach(x=>x.summary = null);
  let myMessages = [...messages];
  let introTokens = 0;
  if(chatGPTSettings.useName) {
    const introMessage = `The User's first name is ${chatGPTSettings.firstName}, and their last name is ${chatGPTSettings.lastName}`;
    introTokens = encode(introMessage).length;
    myMessages = [{role: "system", message: introMessage, tokens: introTokens}, ...myMessages];
  }
  // console.log(messages);
  console.log(baseMessage);
  const systemTokens = introTokens + messages.filter(x=>x.role == "system").reduce((p,n)=>p+n.tokens,0);
  const totalTokens = systemTokens + messages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0);
  console.log("total tokens before: "+totalTokens);
  console.log("maxResponseTokens: "+maxResponseTokens);
  console.log("system tokens: "+systemTokens);
  let discardedMessages = [];

  while(systemTokens + maxResponseTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096) {
    // console.log(systemTokens + maxResponseTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0));
    discardedMessages = [...discardedMessages, ...myMessages.splice(myMessages.findIndex(x=>x.role != "system"),1)];
  }

  if(discardedMessages.length > 0) {
    console.log("Starting summarization");
    while((systemTokens + maxResponseTokens + maxSummaryTokens + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096) && 
      (!discardedMessages[discardedMessages.length-1].contextMemories || systemTokens + maxResponseTokens + maxSummaryTokens/2 + myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+n.tokens,0) > 4096)) {
      discardedMessages = [...discardedMessages, ...myMessages.splice(myMessages.findIndex(x=>x.role != "system"),1)];
    }
    const lastMessage = discardedMessages[discardedMessages.length-1];
    if(!lastMessage.contextMemories) {
      console.log("Messages Discarded: "+discardedMessages.length);
      const prevContextIndex = discardedMessages.findLastIndex(x=>x.contextMemories);
      let prevContext = null;
      if(prevContextIndex >= 0) {
        prevContext = discardedMessages[prevContextIndex].contextMemories;
        console.log("Using previous context: "+prevContext);
        console.log("------------");
        discardedMessages.splice(0,prevContextIndex+1);
      }
      console.log("Messages memories will have to cover: "+discardedMessages.length);
      let contextInstructionMessage = chatGPTSettings.basicContextInstructionText;
      const memoryIntructionMessage = chatGPTSettings.memoryInstructionText;
      const memoryInstructionTokens = encode(memoryIntructionMessage).length;
      while(discardedMessages.length > 0) {
        if(prevContext) contextInstructionMessage = chatGPTSettings.repeatedContextInstructionText;
        const contextInstructionTokens = encode(contextInstructionMessage).length;
        let messagesToContextualize = [...discardedMessages];
        discardedMessages = [];
        const prevContextText = prevContext? "Previous Context: "+prevContext.context : "";
        const prevContextTokens = prevContext? encode(prevContextText).length : 0;
        const reservedTokens = Math.max(memoryInstructionTokens, contextInstructionTokens);
        while(systemTokens + reservedTokens + prevContextTokens + maxResponseTokens + messagesToContextualize.reduce((p,n)=>p+n.tokens,0) > 4096) {
          discardedMessages = [...messagesToContextualize.splice(messagesToContextualize.length-1,1), ...discardedMessages];
        }
        console.log("Contextualizing from: "+messagesToContextualize[0].message);
        console.log("------------");
        console.log("Contextualizing till: "+messagesToContextualize[messagesToContextualize.length-1].message);
        console.log("------------");
        const beginningMessages = myMessages.filter(x=>x.role == "system");
        if(prevContext) beginningMessages.push({role: "assistant", message: prevContextText, tokens: prevContextTokens});
        const allMessagesToContextualize = [...beginningMessages, ...messagesToContextualize, {role: "system", message: contextInstructionMessage, tokens: contextInstructionTokens}];
        console.log("Generating context on "+allMessagesToContextualize.reduce((p,n)=>p+n.tokens,0)+" tokens");
        const openAIContextMessages = allMessagesToContextualize.map(x=>{return{role: x.role, content: x.message}});
        // console.log(openAIContextMessages);
        // console.log("Exact tokens: "+openAIContextMessages.reduce((p,n)=>p+encode(n.content??"").length,0)+" tokens");
        const aiContextMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIContextMessages);
        if(!aiContextMessage) return null;
        const trimmedContextMessage = aiContextMessage.content.replace(/New Context:/g, "").replace(/new context:/g, "").replace(/New context:/g, "").replace(/Previous Context:/g, "").replace(/previous context:/g, "").replace(/Previous context:/g, "").replace(/Context:/g, "").replace(/context:/g, "").trim();
        console.log("Generated context: "+trimmedContextMessage);
        console.log("------------");

        let iters = 0;
        while(iters < 5) {
          iters++;
          const allMessagesToMemorize = [...beginningMessages, ...messagesToContextualize, {role: "system", message: memoryIntructionMessage, tokens: memoryInstructionTokens}];
          console.log("Generating context on "+allMessagesToMemorize.reduce((p,n)=>p+n.tokens,0)+" tokens");
          const openAIMemoryMessages = allMessagesToMemorize.map(x=>{return{role: x.role, content: x.message}});
          const aiMemoryMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMemoryMessages);
          if(!aiMemoryMessage) return null;
          console.log("Generated memories: "+aiMemoryMessage.content);
          console.log("------------");
          if(aiMemoryMessage.content.indexOf("[") == -1) continue;
          const memoryObject = JSON.parse(aiMemoryMessage.content.substring(aiMemoryMessage.content.indexOf("["), aiMemoryMessage.content.lastIndexOf("]")+1));
          prevContext = {context: trimmedContextMessage, memories: memoryObject};
          messagesToContextualize[messagesToContextualize.length-1].contextMemories = prevContext;
          break;
        }
      }
    }

    const contextMemories = allChatMessages.filter(x=>x.contextMemories && x.contextMemories.context && x.contextMemories.memories).map(x=>x.contextMemories);
    const allKeywords = contextMemories.reduce((p,n)=>[...p, ...n.memories.reduce((p2,n2)=>[...p2, ...n2.keywords],[])],[]);
    console.log("Memories: ");
    console.log(contextMemories);
    console.log("Keywords: ");
    console.log(allKeywords);
    const keywordInstructionMessage = `${chatGPTSettings.selectKeywordsInstructionText}
    
    ${allKeywords.join(", ")}`;
    console.log("Keyword Instruction Message: "+keywordInstructionMessage)
    const keywordInstructionTokens = encode(keywordInstructionMessage).length;
    const keywordMessages = [...myMessages.filter(x=>x.role == "system"), {role: "assistant", message: lastMessage.contextMemories.context, tokens: encode(lastMessage.contextMemories.context).length}, ...myMessages.filter(x=>x.role != "system"), {role: "user", message: keywordInstructionMessage, tokens: keywordInstructionTokens}];
    console.log("keyword query tokens: "+ (keywordMessages.filter(x=>x.role != "system").reduce((p,n)=>p+(n.tokens??0),0)+systemTokens));
    const openAIKeywordMessages = keywordMessages.map(x=>{return{role: x.role, content: x.message}});
    const aiKeywordMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIKeywordMessages);
    if(!aiKeywordMessage) return null;
    console.log("Generated keywords: "+aiKeywordMessage.content.toLowerCase());
    console.log("------------");
    const keywordObject = JSON.parse(aiKeywordMessage.content.toLowerCase().substring(aiKeywordMessage.content.indexOf("["), aiKeywordMessage.content.lastIndexOf("]")+1));
    const systemMessages = myMessages.filter(x=>x.role == "system");
    const contextTokens = encode(lastMessage.contextMemories.context).length;
    const contextMessages = [{role: "assistant", message: lastMessage.contextMemories.context, tokens: contextTokens}];
    const conversationMessages = myMessages.filter(x=>x.role != "system");
    const conversationTokens = myMessages.filter(x=>x.role != "system").reduce((p,n)=>p+(n.tokens??0),0);
    const remainingTokens = 4096 - (systemTokens + contextTokens + conversationTokens + maxResponseTokens);
    let memoryText = "";
    while(keywordObject.length) {
      memoryText = "Previous Memories:\n\n";
      const memories = contextMemories.reduce((runningMemories,contextMemory)=>{
        const relevantMemories = contextMemory.memories.filter(x=>keywordObject.some(y=>x.keywords.includes(y))).map(x=>x.memory);
        if(relevantMemories.length) {
          return [...runningMemories, {context: contextMemory.context, memories: relevantMemories}]
        }
        else return runningMemories;
      },[]);
      
      memories.forEach(x=>{
        // memoryText += `Context: ${x.context}\n`;
        x.memories.forEach(y=>{
          memoryText += `Memory: ${y}\n\n`;
        });
        // memoryText += `\n`;
      });

      if(encode(memoryText).length > remainingTokens)  {
        memoryText = "";
        const allMemories = contextMemories.reduce((p,n)=>[...p, n.memories],[]);
        let mostFrequentIndex = 0;
        let numMemories = 0;
        keywordObject.forEach((keyword, index) => {
          const myMemories = allMemories.filter(x=>x.keywords && x.keywords.includes(keyword)).length;
          if(myMemories > numMemories) {
            numMemories = myMemories;
            mostFrequentIndex = index;
          }
        })
        console.log("Dropped keyword: "+keywordObject[mostFrequentIndex]);
        keywordObject.splice(mostFrequentIndex,1);
      }
      else break;
    }

    console.log("Memory Text: "+memoryText);
    console.log("Memory Tokens: "+encode(memoryText).length);
    console.log("------------");
    myMessages = [...systemMessages, {role: "system", message: memoryText, tokens: encode(memoryText).length}, ...contextMessages, ...conversationMessages];
  }

  const openAIMessages = myMessages.map(x=>{return{role: x.role, content: x.message}});
  const aiMessage = await generateOpenAIMessage(chatGPTSettings.openAiApiKey, openAIMessages);
  return aiMessage;
}

async function generateOpenAIMessage(apiKey, messages) {
  // messages.forEach(x=>{
  //   if(x.role == "assistant") x.role = "user";
  // });
  
  // console.log(messages);
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);
  let completion;
  try {
    // console.log(messages);
    completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
  }
  catch(ex) {
    console.log("failed ai gen");
    return "";
  }

  const aiMessage = completion?.data?.choices[0]?.message;
  return aiMessage;
}

httpServer.listen(httpPort, () => console.log(`Listening on port ${httpPort}`));
httpsServer.listen(httpsPort);