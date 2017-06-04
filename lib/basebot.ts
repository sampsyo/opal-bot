/**
 * Abstract interface for bot-like communication.
 */

/**
 * An ongoing textual interaction with a single user.
 */
export interface Conversation {
  /**
   * Send a message in the conversation.
   */
  send(text: string): void;

  /**
   * Wait for a message in this conversation.
   */
  recv(): Promise<string>;

  /**
   * Identify the user that this conversation is with. Returns a *namespace*
   * string indicating where the user is located (e.g., the service they're
   * logged into) and an *id* string indicating the specific user.
   */
  who(): [string, string];
}

/**
 * Conversation handlers get an initial message and an object to represent
 * the continuing conversation.
 */
export type ConversationHandler =
  (message: string, conv: Conversation) => void;
