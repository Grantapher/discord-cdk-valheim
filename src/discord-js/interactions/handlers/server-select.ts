import { APIMessageComponentInteraction, APIMessageComponentSelectMenuInteraction } from "discord.js";
import { status } from "./status";

export const serverSelectHandler = async (interaction: APIMessageComponentInteraction) => {
  const request = interaction as APIMessageComponentSelectMenuInteraction;
  const selected = request.data.values[0]; // multi-select is not allowed
  return await status(selected);
};
