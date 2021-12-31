const { Client, Intents, MessageEmbed, Emoji } = require("discord.js");
const { token } = require("./config.json");
const axios = require("axios");

const openseaCollections = new Map();
const collectionLastFloor = new Map();
const COLLECTION_BASE_URL = "https://api.opensea.io/api/v1/collection/";
const INTERVAL_MIN = 3;
const EQUALS_EMOJI = "";
const ROCKET_EMOJI = ":rocket:";
const DOWN_EMOJI = ":chart_with_downwards_trend:";

const removeSlug = (slug) => {
  if (!openseaCollections.has(slug)) return;
  clearInterval(openseaCollections.get(slug));
  openseaCollections.delete(slug);
  collectionLastFloor.delete(slug);
};

const getFloorInterval = async (message, slug) => {
  try {
    //Try get opensea collection
    const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
    if (response.status !== 200) return;

    const result = await response.data;
    const floor = result.collection.stats.floor_price;

    let emoji = EQUALS_EMOJI;
    let trendText = "";
    if (floor > collectionLastFloor.get(slug)) {
      emoji = ROCKET_EMOJI;
      trendText = "*GOING UP*";
    } else if (floor < collectionLastFloor.get(slug)) {
      emoji = DOWN_EMOJI;
      trendText = "*FALLING DOWN*";
    }
    else return

    collectionLastFloor.set(slug, floor);

    const embed = new MessageEmbed({
      title: `${result.collection.name} Floor is ${trendText}${emoji}`,
      thumbnail: result.collection.featured_image_url,
      color: "RANDOM",
      description: `Floor is **${floor}**`,
    });

    return await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
};

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!floor")) {
    try {
      let msgSplit = message.content.split(" ", 2);

      if (msgSplit.length !== 2) {
        const errorEmbed = new MessageEmbed({
          title: "Invalid !floor slug provided",
          color: "RED",
          description: "Please try !floor [slug]",
        });
        return message.channel.send({ embeds: [errorEmbed] });
      }
      const slug = msgSplit[1];

      //Try get opensea collection
      const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
      if (response.status !== 200) {
        const errorEmbed = new MessageEmbed({
          title: "Couldn't find slug provided",
          color: "RED",
          description: "Couldn't find slug provided",
        });
        return message.channel.send({ embeds: [errorEmbed] });
      }
      const result = await response.data;
      const floor = result.collection.stats.floor_price;

      const embed = new MessageEmbed({
        title: `${result.collection.name} Floor`,
        thumbnail: result.collection.featured_image_url,
        color: "RANDOM",
        description: `Floor is **${floor}**`,
      });

      return await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  }

  if (message.content.startsWith("!addFloor")) {
    try {
      let msgSplit = message.content.split(" ", 2);

      if (msgSplit.length !== 2) {
        const errorEmbed = new MessageEmbed({
          title: "Invalid !floor slug provided",
          color: "RED",
          description: "Please try !floor [slug]",
        });
        return message.channel.send({ embeds: [errorEmbed] });
      }
      const slug = msgSplit[1];

      if (openseaCollections.has(slug)) {
        const errorEmbed = new MessageEmbed({
          title: "Slug already added",
          color: "RED",
          description: "Slug already added",
        });
        return message.channel.send({ embeds: [errorEmbed] });
      }

      //Try get opensea collection
      const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
      if (response.status !== 200) {
        const errorEmbed = new MessageEmbed({
          title: "Couldn't find slug provided",
          color: "RED",
          description: "Couldn't find slug provided",
        });
        return message.channel.send({ embeds: [errorEmbed] });
      }
      const result = await response.data;
      const floor = result.collection.stats.floor_price;

      // add last floor
      collectionLastFloor.set(slug, floor);

      const interval = setInterval(() => {
        getFloorInterval(message, slug);
      }, INTERVAL_MIN * 60 * 1000);
      openseaCollections.set(slug, interval);

      const embed = new MessageEmbed({
        title: `${result.collection.name} added successfully`,
        thumbnail: result.collection.featured_image_url,
        color: "RANDOM",
        description: `You will get updates every ${INTERVAL_MIN} minutes`,
      });

      return await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  }

  if (message.content.startsWith("!removeFloor")) {
    try {
      let msgSplit = message.content.split(" ", 2);
      const slug = msgSplit[1];
      removeSlug(slug);
      const embed = new MessageEmbed({
        title: `${slug} removed successfully`,
        color: "RANDOM",
      });

      return await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  }
});

client.once("ready", async () => {
  console.log("lets go");
});

client.login(token);
