import * as readline from "readline";
import { GraphState } from "index.js";
import { DatasetParameters } from "types.js";
import { findMissingParams } from "utils.js";

const paramsFormat = `<name>,<value>:::<name>,<value>`;

/**
 * Read the user input from the command line
 * TODO: implement & add args
 * @param {DatasetParameters[]} missingParams
 */
export function readUserInput(
  missingParams: DatasetParameters[]
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const missingParamsString = missingParams
    .map((p) => `Name: ${p.name}, Description: ${p.description}`)
    .join("\n----\n");
  const question = `LangTool couldn't find all the required params for the API.\nMissing params:\n${missingParamsString}\nPlease provide the missing params in the following format:\n${paramsFormat}\n`;

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Parse the user input string into a key-value pair
 * TODO: implement
 * @param {string} input
 */
export function parseUserInput(input: string): Record<string, string> {
  if (!input.includes(":::")) {
    const [key, value] = input.split(",");
    return { [key]: value };
  }

  const splitParams = input.split(":::");
  let params: Record<string, string> = {};
  splitParams.forEach((param) => {
    const [key, value] = param.split(",");
    params = { ...params, [key]: value };
  });
  return params;
}

/**
 * @param {GraphState} state
 */
export async function requestParameters(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { llm, bestApi, params } = state;
  if (!bestApi) {
    throw new Error("No best API found");
  }
  const requiredParamsKeys = bestApi.required_parameters.map(
    ({ name }) => name
  );
  const extractedParamsKeys = Object.keys(params ?? {});
  const missingParams = findMissingParams(
    requiredParamsKeys,
    extractedParamsKeys
  );
  const missingParamsSchemas = missingParams
    .map((missingParamKey) =>
      bestApi.required_parameters.find(({ name }) => name === missingParamKey)
    )
    .filter((p) => p !== undefined) as DatasetParameters[];

  const userInput = await readUserInput(missingParamsSchemas);
  const parsedUserInput = parseUserInput(userInput);

  console.log(
    `\n-----\nNew parsed params: ${JSON.stringify(
      parsedUserInput,
      null,
      2
    )}\n-----\n`
  );

  return {
    params: {
      ...params,
      ...parsedUserInput,
    },
  };
}
