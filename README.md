# janusbot

Self hosted Bot to easy vote in cosmos ecosystem

<img src="janus.jpeg" width="30%">

There is no need to vote via cli or web UI, just setup a bot with your validator or wherever you want and get notifications with vote options and vote **_directly in telegram!_**

<img src="work_bot_example.png" width="40%">

# How to run a bot
First download the latest release:
```
wget https://github.com/MELLIFERA-Labs/janusbot/releases/download/v0.0.3/janusbot-linux-amd64
```
## Initialize the bot:
```
janus init
```
## Verify it worked

```
cat $HOME/.janus/config.toml
```

## Configure environment variables
Set env variables, see `.env.example` or you can specify path to .env file, e.g. `dotenv = '/Home/.janus/.env'`.

## Create telegram bot
Open telegram and look for @BotFather, run command `/newbot` and follow instructions.
In the end you should get token for your bot: something like `9999999:ASDjaiodsjioasoidj123123`.
Set token environment variable, variable name is `TELEGRAM_BOT_TOKEN`, e.g: `TELEGRAM_BOT_TOKEN=9999999:ASDjaiodsjioasoidj123123`.

## Retrieve chat_id 
Now we need chat_id, so our bot knows where to send messages. It may be either group or private chat. In telegram look for `@username_to_id_bot`, or any other way you prefer to get chat_id.
Add chat_id to config.toml, e.g: `chat_id = 123456789`.
Update `key` in config.toml, string and no spaces, e.g: `key = 'telegram_atom_proposals'`.
Currently we support only telegram, so `type = 'telegram'`.

## Configure bot
### Keys management
Now let's proceed with keys setup. These keys will be used to vote for proposals.
If you want to create new wallet run:

```
janus keys add WALLET_NAME
```
If you want to import existing one run:
```
janus keys add WALLET_NAME --recover
```
Follow instructions.

### Setup network
Currently we have initial values for cosmos network, edit those for your preferred network.
`transport` is your transport key, we added before: `telegram_atom_proposals` in our case.
Here is a [complete example]() of config.toml you should have in the end.

## Run the bot
```
janus run start
```
And that's it! The bot will check for new proposals every five minutes and send you a message if there are any.

## Setup service file

1. Create service file

```
 touch /etc/systemd/system/janusbot.service
```

2. Fill service file:

```
cat <<EOF >> /etc/systemd/system/janusbot.service
[Unit]
Description=Janusbot daemon
After=network-online.target

[Service]
User=<USER>
ExecStart=/usr/bin/janusbot start
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF
```

3. Reload systemctl

```
systemctl daemon-reload
```

4. Start service

```
 systemctl start janusbot.service
```

4. In order to watch the service run, you can do the following:

```
  journalctl -u janusbot.service -f
```
## Well tested networks

- Cosmos Hub
- Lava Network
- Osmosis
- May work for many others cosmos SDK based networks, but not tested yet.

## SUPPORT US

- COSMOS: `cosmos1qcual5kgmw3gqc9q22hlp0aluc3t7rnsprewgy`
- JUNO: `juno1qcual5kgmw3gqc9q22hlp0aluc3t7rnsh3640c`
- OSMOSIS: `osmo1qcual5kgmw3gqc9q22hlp0aluc3t7rnsfc277k`

Also, you can just delegate in one of our nodes : )
https://mellifera.network
