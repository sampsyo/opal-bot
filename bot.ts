import { Wit } from 'node-wit';
import * as Loki from 'lokijs';
import * as minimist from 'minimist';

import { OpalBot } from './lib/opalbot';

const STATUS_CHAN = 'bot-status';
const DB_NAME = 'store.json';

/**
 * Open a Loki database and load its contents.
 */
function openDB(filename: string): Promise<Loki> {
  return new Promise((resolve, reject) => {
    let db = new Loki(filename);
    db.loadDatabase({}, () => resolve(db));
  });
}

/**
 * Run the bot.
 */
async function main() {
  // Set up the service-agnostic infrastructure.
  let wit_token = process.env['WIT_ACCESS_TOKEN'];
  if (!wit_token) {
    console.error("missing WIT_TOKEN");
    return;
  }
  let web_url = process.env['WEB_URL'] || 'http://localhost:5000';
  let bot = new OpalBot(
    new Wit({ accessToken: wit_token }),
    await openDB(DB_NAME),
    web_url,
  );

  // Office 365.
  let office_id = process.env['OFFICE_CLIENT_ID'];
  let office_secret = process.env['OFFICE_CLIENT_SECRET'];
  if (office_id && office_secret) {
    bot.addOffice(office_id, office_secret);
  }

  // Parse the command-line options.
  let opts = minimist(process.argv.slice(2), {
    boolean: [ 'term', 'fb', 'slack', 'web' ],
    alias: { 'term': ['t'], 'fb': ['f'], 'slack': ['s'], 'web': ['w'] },
  });

  // Slack.
  if (opts['slack']) {
    let slack_token = process.env['SLACK_BOT_TOKEN'];
    if (slack_token) {
      bot.connectSlack(slack_token, STATUS_CHAN);
    } else {
      console.error("missing SLACK_BOT_TOKEN");
    }
  }

  // Facebook Messenger.
  if (opts['fb']) {
    let fb_page_token = process.env['FB_PAGE_TOKEN'];
    let fb_verify_token = process.env['FB_VERIFY_TOKEN'];
    if (!fb_page_token || !fb_verify_token) {
      console.error("missing FB_PAGE_TOKEN or FB_VERIFY_TOKEN");
    } else {
      bot.addFacebook(fb_page_token, fb_verify_token);
    }
  }

  // Web interface.
  if (opts['web']) {
    bot.addWeb();
  }

  // Start the web server.
  await bot.runWeb(5000);

  // Terminal.
  if (opts['term']) {
    bot.runTerminal();
  }
}

main();
