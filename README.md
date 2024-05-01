# DrunkOnDLEsBot

This repository contains all code used in the DrunkOnDLEsBot that runs in
the [littlebear36](https://twitch.tv/littlebear36) channel. It essentially analyses the live stream and checks if the
streamer is playing a "DLE game", i.e. something like Wordle, Travle, Globle, etc. If it detects such game is played,
it checks for the current score of the gameplay, and subsequently, if the game is completed, it saves a record of the
score and composes a message to send in the chat.  
Additionally it provides a command `!dlestats` / `!dlesstats` to list the scores of all games played today,
and `!dlestats <game>` / `!dlesstats <game>` to list the score, streak, and other info about the latest record for a
single game.

## Prerequisites

- Node.js + npm (tested with v22)
- Python 3.11 + venv
- FFmpeg
- Tesseract OCR (CLI)
- a reasonably powerful computer
- Docker (or access to a PostgreSQL database)

### Dotenv

Create a `.env` in the project root:

```dotenv
# if you have a separate postgres database, replace the credentials here
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=1234
POSTGRES_USER=db
POSTGRES_DB=db

TWITCH_AUTH_TOKEN=<auth_token_from_twitch_see_below>

# if you just want to check out detection, you can leave this out
CHATTER_CLIENT_ID=<twitch_api_client_token_see_below>
CHATTER_CLIENT_SECRET=<twitch_api_client_secret_see_below>
CHATTER_CODE=<twitch_api_code_see_below>
```

#### TWITCH_AUTH_TOKEN

You will need this if you want to ensure that the bot doesn't see any adverts. When there is a commercial break running
on the livestream, Twitch will send a placeholder instead of the livestream. If you have an account that is subscribed
to the channel, you can use the account's auth token here to prevent receiving the commercial break placeholder. To do
this you'll have to snoop a little with your browser's console:  
With the browser of your choice login into the Twitch account in question, then open the browser console, and go to the
network tab (you might have refresh the page to see the entries). Find a POST request to "gql.twitch.tv/gql". This
request should have an `Authorization` header with the value `OAuth <your_auth_token>`. Copy the token and paste it into
your `.env`.

#### Twitch API Tokens

If you want to have the bot chat somewhere, you'll have to obtain access to Twitch's API. Follow the
instructions [here](https://dev.twitch.tv/docs/authentication/register-app/) to get the client token and the client
secret, and then the
["Authorization Code Grant Flow"](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
to get the authorization code. After visiting "https://id.twitch.tv/oauth2/authorize" and clicking "Authorize", you
should be redirected to "http://localhost:3000/". Copy the value of the `code` parameter and paste it into `.env` as
the `CHATTER_CODE` value.
The bot will programmatically retrieve an access token, and store it in a file `.twitch_credentials` for later restarts,
so you don't manually have to get an authorization code every time you want to start the bot.

> IF YOU DON'T WANT THE BOT TO CHAT:  
> Comment out the `sendMessage()` call in `src/state.ts` and the respective import.

### Dependencies

Run `npm run i`. Also download the model for text localisation with e.g.
`curl https://raw.githubusercontent.com/oyyd/frozen_east_text_detection.pb/master/frozen_east_text_detection.pb -L --output frozen_east_text_detection.pb`.  
All other (Python) dependencies will be installed automatically on the first run.

## Usage

If you don't have a separate PostgreSQL database, run `docker compose up db -d` to start one with docker.  
Then, run either `npm run start`, or `npm run start:managed`. `start:managed` will run the bot with pm2, which restarts
node if it exits. This might happen when e.g. Twitch does not respond in time. Even though there is a try/catch
statement node will still poop pant :( so pm2 is just like a flex tape slapped onto that.  
`start:managed` will detach immediately. To see logs run `npm run logs:managed`, to stop
run `npm run stop:managed`.

### How it works and where it stores stuff in the database
If the stream is not live, the bot will go into hibernation and check every five minutes if it has gone live. When the
stream goes live it will switch to detection mode and fetch frames every two seconds (if it sees a DLE), or every 10
seconds (if it does not see a DLE). The bot will look for markers in every frame to detect a DLE (amount of e.g.
background color, specific text, or visual features like logos or icons), then save the frame data and a compressed
image (60kb typical) in the `Frames` table. If a DLE was detected it will try to get the current score of the gameplay,
the result of with is stored in the `Measurements` table. If the DLE is finished, i.e. won or lost, the score will be
stored in the `Scores` table and a message will be composed and stored in the `Message` table. There is a ⅓ chance that
no message will be composed, in which case the entry in the table will say `NONE`.
