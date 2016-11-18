import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { $ } from 'meteor/jquery';
import { Chat, Client } from '../both/collections.js';

// this is just for demo (and article) purposes
// you can check out production ready app here: https://github.com/juliancwirko/s-chat-app

// we can import html templates here
import './layout.html';

// we need a state management we will use reactive-dict (https://atmospherejs.com/meteor/reactive-dict)
// it could be imported from some kind of global state
// here we just use local dictionary
// you can also use ReactiveVar if you want (https://atmospherejs.com/meteor/reactive-var)
const state = new ReactiveDict('');
state.setDefault({
    openedChat: '',
    openedApp: ''
});

// Main template
// We need to subscribe to the data - here client apps and particular chats in the context of the chosen app
Template.main.onRendered(function () {
    const instance = this;
    instance.subscribe('Client.appsList');
    instance.autorun(() => {
        instance.subscribe('Chat.list', state.get('openedApp'));
    });
});
// We configure 'add-new-app' onClick event here
Template.main.events({
    'click .js-add-new-client-app'() {
        const instance = Template.instance();
        const name = instance.$('[name=client-app-name]').val();
        if (name) {
            Meteor.call('addClientApp', name);
            instance.$('[name=client-app-name]').val('');
        }
    }
});
// We prepare data helpers in the main template
Template.main.helpers({
    clientApps() {
        return Client.find();
    },
    clientAppsChatsSessions() {
        var sss = Chat.find({clientAppId: state.get('openedApp')})
            .fetch()
            .map(c => c.userSessionId)
            .filter((v, i, s) => s.indexOf(v) === i);
            state.set('openedChat', sss[sss.length-1])
            // setTimeout(function(){
            //     Meteor.call('process',function(){
            //         state.set('openedChat', sss[sss.length-1])});}, 700);
        return sss;
    },
    chatBoxOpened() {
        return state.get('openedChat');
    }
});

// Client App item template
// We set up chosen appId here
Template.appItem.events({
    'click .js-open-chats'(e) {
        e.preventDefault();
        const data = Template.currentData();
        state.set('openedApp', data.id);
        state.set('openedChat', '');
    }
});

// Chat item template
// We set up opened chatBox by userSessionId
Template.chatItem.events({
    'click .js-open-chat-messages'(e) {
        e.preventDefault();
        const data = Template.currentData();
        state.set('openedChat', data.userSessionId);
    }
});

Template.registerHelper("log", function(something) {
  console.log(something);
});
// Chat box with messages template
// We render chatBox and subscribe to the messeges in the context of a single userSessionId
Template.chatBox.onRendered(function () {
    const instance = Template.instance();
    instance.autorun(() => {
        instance.subscribe('Chat.messagesList', state.get('openedApp'), state.get('openedChat'));
    });
});
// We populate the messages data
Template.chatBox.helpers({
    messages() {
        return Chat.find({clientAppId: state.get('openedApp'), userSessionId: state.get('openedChat')}, {sort: {date: 1}});
    },
    userSessionId() {
        return state.get('openedChat');
    }
});

Template.chatBoxMessageItem.helpers({
    autoRespond: function(msg, sid) {
        console.log(msg);
        if(msg == 'Hi'  && sid==state.get('openedChat'))
            Meteor.call('addChatMessage', "How are you?", state.get('openedApp'), state.get('openedChat'), false);
        else if(msg == "I'm fine. What about you?"  && sid==state.get('openedChat'))
            Meteor.call('addChatMessage', "I was getting bored, but now you're here :) \n What would you like to know about x.ai?", state.get('openedApp'), state.get('openedChat'),false);
    }
});
// We attach onKeydown event to be able to send new messages
Template.chatBox.events({
    'keydown .js-chat-submit-input'(e) {
        const instance = Template.instance();
        const msg = instance.$('.js-chat-submit-input').val();
        const key = e.keyCode || e.which;
        if (key === 13 && !e.shiftKey) {
            e.preventDefault();
            if (msg.trim() !== '') {
                Meteor.call('addChatMessage', msg, state.get('openedApp'), state.get('openedChat'));
                $(e.currentTarget).val('');
            }
        }
    }
})