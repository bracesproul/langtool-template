import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { GraphState } from "index.js";
import { DatasetSchema } from "types.js";

/**
 * Given a users query, choose the API which best
 * matches the query.
 */
export class SelectAPITool extends StructuredTool {
  schema: z.ZodObject<
    {
      api: z.ZodEnum<[string, ...string[]]>;
    },
    "strip",
    z.ZodTypeAny,
    {
      api: string;
    },
    {
      api: string;
    }
  >;

  name = "Select_API";

  description: string;

  apis: DatasetSchema[];

  /**
   * constructor
   * @param {DatasetSchema[]} apis
   */

  /**
   *
   * @param {DatasetSchema[]} apis
   * @param {string} query
   * @returns {String}
   */
  static createDescription() {
    throw new Error("createDescription not implemented");
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    throw new Error("_call not implemented" + input);
  }
}

/**
 * TODO: implement
 * @param {GraphState} state
 */
export async function selectApi(): Promise<Partial<GraphState>> {
  throw new Error("selectApi not implemented");
}
