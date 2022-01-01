const { Client, Intents, MessageEmbed, Emoji } = require("discord.js");
const { token } = require("./config.json");
const gis = require("g-i-s");
const axios = require("axios");

const openseaCollections = new Map();
const collectionLastFloor = new Map();
const COLLECTION_BASE_URL = "https://api.opensea.io/api/v1/collection/";
const INTERVAL_MIN = 5;
const EQUALS_EMOJI = "";
const ROCKET_EMOJI = ":rocket:";
const DOWN_EMOJI = ":chart_with_downwards_trend:";

const getGIS = (nftName) =>
  new Promise((resolve, reject) => {
    try {
      gis(nftName, (error, results) => {
        if (error) {
          return resolve("");
        } else {
          return resolve(
            results.filter(
              (i) => i.url.endsWith("jpeg") || i.url.endsWith("png")
            )[0].url
          );
        }
      });
    } catch {
      resolve("");
    }
  });

const removeSlug = (slug) => {
  if (!openseaCollections.has(slug)) return;
  clearInterval(openseaCollections.get(slug));
  openseaCollections.delete(slug);
  collectionLastFloor.delete(slug);
};

const getFloorInterval = async (channel, slug) => {
  try {
    console.log("interval: get floor of" + slug);
    //Try get opensea collection
    const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
    if (response.status !== 200) return;

    const result = await response.data;
    const floor = result.collection.stats.floor_price;
    const lastFloor = collectionLastFloor.get(slug);

    let emoji = EQUALS_EMOJI;
    let trendText = "";
    if (floor > lastFloor) {
      emoji = ROCKET_EMOJI;
      trendText = "*GOING UP*";
    } else if (floor < lastFloor) {
      emoji = DOWN_EMOJI;
      trendText = "*FALLING DOWN*";
    } else return;

    collectionLastFloor.set(slug, floor);
    const imgUrl = await getGIS(result.collection.name + " nft");

    const embed = new MessageEmbed({
      title: `${result.collection.name} Floor is ${trendText} ${emoji}`,
      color: "RANDOM",
      description: `Floor is **${floor}**\n\n~~ Last floor was **${lastFloor}**`,
      footer: slug,
      thumbnail: { url: imgUrl },
    });

    return await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
};

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;

  if (commandName === "floor") {
    try {
      const slug = interaction.options.getString("slug");

      //Try get opensea collection
      const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
      if (response.status !== 200) {
        const errorEmbed = new MessageEmbed({
          title: "Couldn't find slug provided: " + slug,
          color: "RED",
          description: "Couldn't find slug provided: " + slug,
        });
        return interaction.reply({ embeds: [errorEmbed] });
      }
      const result = await response.data;
      const floor = result.collection.stats.floor_price;

      const imgUrl = await getGIS(result.collection.name + " nft");

      const embed = new MessageEmbed({
        title: `${result.collection.name} Floor`,
        color: "RANDOM",
        description: `Floor is **${floor}**`,
        footer: slug,
        thumbnail: { url: imgUrl },
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  } else if (commandName === "add") {
    try {
      const slug = interaction.options.getString("slug");

      if (openseaCollections.has(slug)) {
        const errorEmbed = new MessageEmbed({
          title: "Slug already added",
          color: "RED",
          description: "Slug already added",
        });
        return interaction.reply({ embeds: [errorEmbed] });
      }

      //Try get opensea collection
      const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
      if (response.status !== 200) {
        const errorEmbed = new MessageEmbed({
          title: "Couldn't find slug provided",
          color: "RED",
          description: "Couldn't find slug provided",
        });
        return interaction.reply({ embeds: [errorEmbed] });
      }
      const result = await response.data;
      const floor = result.collection.stats.floor_price;
      // add last floor
      collectionLastFloor.set(slug, floor);

      const interval = setInterval(() => {
        getFloorInterval(interaction.channel, slug);
      }, INTERVAL_MIN * 60 * 1000);
      openseaCollections.set(slug, interval);

      const embed = new MessageEmbed({
        title: `${result.collection.name} added successfully`,
        color: "RANDOM",
        description: `You will get updates every ${INTERVAL_MIN} minutes`,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  } else if (commandName === "remove") {
    try {
      const slug = interaction.options.getString("slug");
      removeSlug(slug);
      const embed = new MessageEmbed({
        title: `${slug} removed successfully`,
        color: "RANDOM",
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  } else if (commandName === "list") {
    try {
      if (openseaCollections.size === 0)
        return interaction.reply("List is empty");
      const embed = new MessageEmbed({
        color: 3447003,
        title: "Floor Prices List:",
        fields: [
          {
            name: "Slugs",
            value: [...openseaCollections.keys()].join("\n"),
            inline: true,
          },
          {
            name: "Floor",
            value: [...collectionLastFloor.values()].join("\n"),
            inline: true,
          },
        ],
      });

      interaction.reply({
        embeds: [embed],
      });
    } catch (err) {
      console.error(err);
    }
  }
});

client.once("ready", async () => {
  console.log("lets go");
});

client.login(token);
