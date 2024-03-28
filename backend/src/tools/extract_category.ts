import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphState } from "index.js";

/**
 * Given a users query, extract the high level category which
 * best represents the query.
 *
 * TODO: add schema, name, description, and _call method
 */
export class ExtractHighLevelCategories extends StructuredTool {
  schema = z.object({}).describe("TODO: implement");

  name = "TODO: implement";

  description = "TODO: implement";

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    throw new Error("_call not implemented" + input);
  }
}

/**
 * TODO: implement
 * @param {GraphState} state
 */
export async function extractCategory(): Promise<Partial<GraphState>> {
  throw new Error("extractCategory not implemented");
}
