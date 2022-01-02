const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const {
  floorCommand,
  addCommand,
  removeCommand,
  listCommand,
  injectClient,
} = require("./src/commands");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  switch (commandName) {
    case "floor":
      try {
        await floorCommand(interaction);
      } catch (err) {
        console.error(err);
      }
      break;

    case "add":
      try {
        await addCommand(interaction);
      } catch (err) {
        console.error(err);
      }
      break;

    case "remove":
      try {
        await removeCommand(interaction);
      } catch (err) {
        console.error(err);
      }
      break;

    case "list":
      try {
        await listCommand(interaction);
      } catch (err) {
        console.error(err);
      }
      break;

    default:
      break;
  }
});

client.once("ready", async () => {
  console.log("lets go");

  injectClient(client);
});

client.login(token);

exports.client = client;
