const axios = require("axios");
const { MessageEmbed } = require("discord.js");
const { getGIS } = require("./utils");

const openseaCollections = new Map();
const collectionLastFloor = new Map();
const COLLECTION_BASE_URL = "https://api.opensea.io/api/v1/collection/";
const INTERVAL_MIN = 5;
const EQUALS_EMOJI = "";
const ROCKET_EMOJI = ":rocket:";
const DOWN_EMOJI = ":chart_with_downwards_trend:";

let client;

exports.injectClient = (c) => {
  client = c;
};

const removeSlug = (slug) => {
  if (!openseaCollections.has(slug)) return;
  clearInterval(openseaCollections.get(slug));
  openseaCollections.delete(slug);
  collectionLastFloor.delete(slug);
};

const getFloorInterval = async (slug) => {
  try {
    console.log("interval: get floor of" + slug);
    //Try get opensea collection
    const response = await axios.get(`${COLLECTION_BASE_URL}${slug}`);
    if (response.status !== 200) return;

    const result = await response.data;
    const floor = result.collection.stats.floor_price;
    const lastFloor = collectionLastFloor.get(slug);

    // Check change percentage
    let changePct;
    if (lastFloor === 0) {
      if (floor > 0) {
        changePct = 100;
      } else return;
    } else changePct = Math.abs(((floor - lastFloor) / lastFloor) * 100);
    if (changePct < 2) return;

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
      description: `Floor is **${floor}**\n\n~~ Last floor was **${lastFloor}** it's a ${changePct.toFixed(2)}% difference`,
      footer: slug,
      thumbnail: { url: imgUrl },
    });

    const channel = await client.channels.fetch("925519845318098954");
    return await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
};

exports.floorCommand = async (interaction) => {
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
};

exports.addCommand = async (interaction) => {
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
    getFloorInterval(slug);
  }, INTERVAL_MIN * 60 * 1000);
  openseaCollections.set(slug, interval);

  const embed = new MessageEmbed({
    title: `${result.collection.name} added successfully`,
    color: "RANDOM",
    description: `You will get updates every ${INTERVAL_MIN} minutes`,
  });

  return await interaction.reply({ embeds: [embed] });
};

exports.removeCommand = async (interaction) => {
  const slug = interaction.options.getString("slug");
  removeSlug(slug);
  const embed = new MessageEmbed({
    title: `${slug} removed successfully`,
    color: "RANDOM",
  });

  return await interaction.reply({ embeds: [embed] });
};

exports.listCommand = async (interaction) => {
  if (openseaCollections.size === 0) return interaction.reply("List is empty");
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
};
