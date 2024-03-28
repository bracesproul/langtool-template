import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { GraphState } from "index.js";

/**
 * @param {GraphState} state
 */
export async function extractParameters(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { llm, query, bestApi } = state;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert software engineer. You're provided with a list of required and optional parameters for an API, along with a users query.

Given the query and the parameters, use the 'extract_params' tool to extract the parameters from the query.

If the query does not contain any of the parameters, do not return params.

Required parameters: {requiredParams}

Optional parameters: {optionalParams}`,
    ],
    ["human", `Query: {query}`],
  ]);

  const schema = z
    .object({
      params: z
        .record(z.string())
        .describe("The parameters extracted from the query.")
        .optional(),
    })
    .describe("The extracted parameters from the query.");

  const modelWithTools = llm.withStructuredOutput(schema, {
    name: "extract_params",
  });

  const chain = prompt.pipe(modelWithTools);

  const requiredParams = bestApi?.required_parameters
    .map(
      (p) => `Name: ${p.name}, Description: ${p.description}, Type: ${p.type}`
    )
    .join("\n");
  const optionalParams = bestApi?.optional_parameters
    .map(
      (p) => `Name: ${p.name}, Description: ${p.description}, Type: ${p.type}`
    )
    .join("\n");

  const res = await chain.invoke({
    query,
    requiredParams,
    optionalParams,
  });

  return {
    params: res.params ?? null,
  };
}
