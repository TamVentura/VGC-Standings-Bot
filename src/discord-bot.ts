import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Guild,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { ReplaySubject } from "rxjs";
import { configManager } from "./config/config-manager";

export class DiscordBot {
  private client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  private channel: TextChannel | null = null;
  private guild: Guild | null = null;

  public isReady: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor() {
    this.login();
    this.client.once("ready", async () => {
      this.isReady.next(true);
      this.channel = (await this.client.channels.fetch(
        configManager.channelId,
      )) as TextChannel;

      this.guild = this.channel?.guild;
      await this.registerCommands();
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (interaction.guildId !== this.guild?.id) return;

      if (interaction.isAutocomplete()) {
        if (interaction.commandName === "removeplayer") {
          const focused = interaction.options.getFocused(true);
          if (focused.name !== "playername") return;
          const extraPlayers = configManager.extraPlayers;

          const filtered = extraPlayers.filter((player) =>
            player.toLowerCase().startsWith(focused.value.toLowerCase()),
          );

          await interaction.respond(
            filtered.map((player) => ({ name: player, value: player })),
          );
        }
        return;
      }

      if (!interaction.isChatInputCommand()) return;

      try {
        if (interaction.commandName === "addplayer") {
          await this.handleAddPlayer(interaction);
        } else if (interaction.commandName === "removeplayer") {
          await this.handleRemovePlayer(interaction);
        } else if (interaction.commandName === "listplayers") {
          await this.handleListPlayers(interaction);
        }
      } catch (error) {
        console.error("Error handling command:", error);
        await interaction.reply({
          content: "An error occurred while processing the command.",
          ephemeral: true,
        });
      }
    });
  }

  private async registerCommands() {
    try {
      // Fetch the channel to get the guild ID
      if (!this.guild) {
        throw new Error("Channel is not in a guild.");
      }

      const commands = [
        new SlashCommandBuilder()
          .setName("addplayer")
          .setDescription("Add an extra player to the standings")
          .addStringOption((option) =>
            option
              .setName("playername")
              .setDescription("The name of the player to add")
              .setRequired(true),
          ),
        new SlashCommandBuilder()
          .setName("removeplayer")
          .setDescription("Remove an extra player from the standings")
          .addStringOption((option) =>
            option
              .setName("playername")
              .setDescription("The name of the player to remove")
              .setAutocomplete(true)
              .setRequired(true),
          ),
        new SlashCommandBuilder()
          .setName("listplayers")
          .setDescription("List all current extra players"),
      ];

      const rest = new REST({ version: "10" }).setToken(
        configManager.discordToken,
      );

      await rest.put(
        Routes.applicationGuildCommands(this.client.user.id, this.guild.id),
        {
          body: commands,
        },
      );
      console.log("Successfully registered slash commands.");
    } catch (error) {
      console.error("Failed to register commands:", error);
    }
  }

  private async handleAddPlayer(interaction: ChatInputCommandInteraction) {
    const playerName = interaction.options.getString("playername");

    configManager.addExtraPlayer(playerName);

    await interaction.reply({
      content: `✅ Player **${playerName}** has been added to the extra players list.`,
      ephemeral: true,
    });
  }

  private async handleRemovePlayer(interaction: ChatInputCommandInteraction) {
    const playerName = interaction.options.getString("playername");
    const extraPlayers = configManager.extraPlayers;

    if (!extraPlayers.includes(playerName)) {
      let suggestions = "";
      if (extraPlayers.length > 0) {
        suggestions =
          "\n\n**Current extra players:**\n" +
          extraPlayers.map((p) => `• ${p}`).join("\n");
      } else {
        suggestions = "\n\nNo extra players currently registered.";
      }

      await interaction.reply({
        content: `❌ Player **${playerName}** not found in extra players list.${suggestions}`,
        ephemeral: true,
      });
      return;
    }

    configManager.removeExtraPlayer(playerName);

    await interaction.reply({
      content: `✅ Player **${playerName}** has been removed from the extra players list.`,
      ephemeral: true,
    });
  }

  private async handleListPlayers(interaction: ChatInputCommandInteraction) {
    const extraPlayers = configManager.extraPlayers;

    if (extraPlayers.length === 0) {
      await interaction.reply({
        content: "📋 No extra players currently registered.",
        ephemeral: true,
      });
      return;
    }

    const playerList = extraPlayers.map((p) => `• ${p}`).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("📋 Extra Players List")
      .setDescription(playerList)
      .setFooter({ text: `Total: ${extraPlayers.length}` });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }

  async sendMessage(content) {
    const channel = (await this.client.channels.fetch(
      configManager.channelId,
    )) as TextChannel;
    if (!channel || !channel.isTextBased())
      throw new Error("Channel not found or not text-based.");
    return channel.send({ content });
  }
  async sendEmbed(embeds: EmbedBuilder[]): Promise<Message<true>> {
    const channel = (await this.client.channels.fetch(
      configManager.channelId,
    )) as TextChannel;
    if (!channel || !channel.isTextBased())
      throw new Error("Channel not found or not text-based.");
    return await channel.send({ embeds });
  }

  private async login(): Promise<void> {
    await this.client.login(configManager.discordToken);
  }
}
