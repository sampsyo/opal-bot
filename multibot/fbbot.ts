/**
 * A bot backend for Facebook Messenger.
 */

import * as basebot from './basebot';
import Messenger = require('messenger-bot');
import * as http from 'http';

/**
 * A thread of interaction with a specific Facebook user.
 */
class Conversation implements basebot.Conversation {
  constructor(
    public fb: FacebookBot,
    public user: string,
  ) {}

  /**
   * Send a message to the user.
   */
  send(text: string) {
    this.fb.msgr.sendMessage(this.user, { text }, (err: any) => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * Receive the next message from the user.
   */
  async recv() {
    let msg = await this.fb.spool.wait(this.user);
    return msg.text;
  }

  namespace = "facebook";
}

interface Message {
  mid: string;
  seq: number;
  text: string;
}

/**
 * A Facebook Messenger API wrapper for bot-like interactions.
 */
export class FacebookBot implements basebot.Bot {
  public msgr: Messenger;

  public convHandler: basebot.ConversationHandler | null = null;

  public spool = new basebot.Spool<string, Message>();

  /**
   * Create a Messenger connection with a given page token and webhook verify
   * token.
   */
  constructor(token: string, verify: string) {
    this.msgr = new Messenger({
      token,
      verify,
    });

    this.msgr.on('message', (event) => {
      let handled = this.spool.dispatch(event.sender.id, event.message);
      if (!handled && this.convHandler) {
        // New conversation.
        let conv = new Conversation(this, event.sender.id);
        this.convHandler(event.message.text, conv);
      }
    });
  }

  /**
   * Get the request handler for receiving webhook requests from the Messenger
   * service.
   */
  handler() {
    return this.msgr.middleware();
  }

  onConverse(cbk: basebot.ConversationHandler) {
    this.convHandler = cbk;
  }
}
