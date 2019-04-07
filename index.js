'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');
const URL = process.env.API_URL;

const APP_ID = 'amzn1.ask.skill.a69fac8d-3a51-4426-b71b-66caa5edcf15';
const SKILL_NAME = 'M.D. save';

const REPROMPT = 'You can say things like, how much is MRI, or you can say exit... Now, what can I help you with?';
const NEW_PROMPT = 'Try asking the price of another procedure, or, you can say exit';

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = "Welcome to " + SKILL_NAME + ". You can ask a question like, how much is MRI? ... Now, what can I help you with?";
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = 'For instructions on what you can say, please say help me.';
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'procedureIntent': function () {
        const itemSlot = this.event.request.intent.slots.procedureName;
        let itemName;
        if (itemSlot && itemSlot.value) {
            itemName = itemSlot.value.toLowerCase();
        }

        var that = this;

        request(URL + "/api/publicSearch/getAveragePriceByProcedure?name=" + itemName, function (error, response, body) {
            var data = JSON.parse(body);
            let procedurePrice = data.price;
            let procedureName = data.name;

            if (procedurePrice) {
                const cardTitle = SKILL_NAME + ' - The average price for ' + procedureName + ' at ' + SKILL_NAME + ' is $' + procedurePrice;
                const output = 'The average price for ' + procedureName + ' at ' + SKILL_NAME + ' is $' + procedurePrice + '. ' + NEW_PROMPT;
                that.attributes.speechOutput = output;
                that.attributes.repromptSpeech = REPROMPT;
                that.emit(':askWithCard', output, REPROMPT, cardTitle, procedurePrice);
            } else {
                let speechOutput = "I\'m sorry, I currently do not know ";
                const repromptSpeech = 'What else can I help you with?';
                if (itemName) {
                    speechOutput += 'the price for ' + itemName + '. ';
                } else {
                    speechOutput += 'that procedure. ';
                }
                speechOutput += repromptSpeech;

                that.attributes.speechOutput = speechOutput;
                that.attributes.repromptSpeech = repromptSpeech;

                that.emit(':ask', speechOutput, repromptSpeech);
            }
        });
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = "You can ask questions such as, how much is MRI, or, you can say exit...Now, what can I help you with?";
        this.attributes.repromptSpeech = REPROMPT;
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Goodbye!');
    },
    'Unhandled': function () {
        this.attributes.speechOutput = "You can ask questions such as, how much is MRI, or, you can say exit...Now, what can I help you with?";
        this.attributes.repromptSpeech = REPROMPT;
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
