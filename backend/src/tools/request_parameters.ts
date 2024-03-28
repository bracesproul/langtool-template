import { GraphState } from "index.js";
/**
 * Read the user input from the command line
 * TODO: implement & add args
 * @param {DatasetParameters[]} missingParams
 */
export function readUserInput(): Promise<string> {
  throw new Error("readUserInput not implemented");
}

/**
 * Parse the user input string into a key-value pair
 * TODO: implement
 * @param {string} input
 */
export function parseUserInput(): Record<string, string> {
  throw new Error("parseUserInput not implemented");
}

/**
 * TODO: implement
 * @param {GraphState} state
 */
export async function requestParameters(): Promise<Partial<GraphState>> {
  throw new Error("requestParameters not implemented");
}
