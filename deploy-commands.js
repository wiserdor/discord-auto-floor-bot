const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

const commands = [
  new SlashCommandBuilder()
    .setName("floor")
    .setDescription("Get specific collection floor")
    .addStringOption((option) =>
      option
        .setName("slug")
        .setDescription("Slug of collection")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("add")
    .setDescription("Register new collection auto floor check")
    .addStringOption((option) =>
      option
        .setName("slug")
        .setDescription("Slug of collection")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove collection from auto floor check")
    .addStringOption((option) =>
      option
        .setName("slug")
        .setDescription("Slug of collection")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("list")
    .setDescription("See all registered collections"),
  new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Change when should notify every percentage rate"),
];

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
