import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { DataModel } from "./_generated/dataModel";

export const betterAuthComponent = createClient<DataModel>(
  components.betterAuth
);
