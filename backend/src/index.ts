// Define graph here
import fs from "fs";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { extractCategory } from "tools/extract_category.js";
import { DatasetSchema } from "types.js";
import { TRIMMED_CORPUS_PATH } from "constants.js";
import { selectApi } from "tools/select_api.js";
import { extractParameters } from "tools/extract_parameters.js";
import { requestParameters } from "tools/request_parameters.js";
import { findMissingParams } from "utils.js";
import { createFetchRequest } from "tools/create_fetch_request.js";

export type GraphState = {
  /**
   * The LLM to use for the graph
   */
  llm: ChatOpenAI;
  /**
   * The query to extract an API for
   */
  query: string;
  /**
   * The relevant API categories for the query
   */
  categories: string[] | null;
  /**
   * The relevant APIs from the categories
   */
  apis: DatasetSchema[] | null;
  /**
   * The most relevant API for the query
   */
  bestApi: DatasetSchema | null;
  /**
   * The params for the API call
   */
  params: Record<string, string> | null;
  /**
   * The API response
   */
  response: Record<string, any> | null;
};

const graphChannels = {
  llm: null,
  query: null,
  categories: null,
  apis: null,
  bestApi: null,
  params: null,
  response: null,
};

/**
 * @param {GraphState} state
 */
const verifyParams = (
  state: GraphState
): "human_loop_node" | "execute_request_node" => {
  const { bestApi, params } = state;
  if (!bestApi) {
    throw new Error("No best API found");
  }
  if (!params) {
    return "human_loop_node";
  }
  const requiredParamsKeys = bestApi.required_parameters.map(
    ({ name }) => name
  );
  const extractedParamsKeys = Object.keys(params);
  const missingKeys = findMissingParams(
    requiredParamsKeys,
    extractedParamsKeys
  );
  if (missingKeys.length > 0) {
    return "human_loop_node";
  }
  return "execute_request_node";
};

function getApis(state: GraphState) {
  const { categories } = state;
  if (!categories || categories.length === 0) {
    throw new Error("No categories passed to get_apis_node");
  }
  const allData: DatasetSchema[] = JSON.parse(
    fs.readFileSync(TRIMMED_CORPUS_PATH, "utf8")
  );

  const apis = categories
    .map((c) => allData.filter((d) => d.category_name === c))
    .flat();

  return {
    apis,
  };
}

/**
 * TODO: implement
 */
function createGraph() {
  const graph = new StateGraph<GraphState>({
    channels: graphChannels,
  })
    .addNode("extract_category_node", extractCategory)
    .addNode("get_apis_node", getApis)
    .addNode("select_api_node", selectApi)
    .addNode("extract_params_node", extractParameters)
    .addNode("human_loop_node", requestParameters)
    .addNode("execute_request_node", createFetchRequest)
    .addEdge("extract_category_node", "get_apis_node")
    .addEdge("get_apis_node", "select_api_node")
    .addEdge("select_api_node", "extract_params_node")
    .addConditionalEdges("extract_params_node", verifyParams)
    .addConditionalEdges("human_loop_node", verifyParams)
    .addEdge(START, "extract_category_node")
    .addEdge("execute_request_node", END);

  const app = graph.compile();
  return app;
}

const datasetQuery =
  "I'm researching WhatsApp for Business accounts. Can you check if the number 9876543210 is a WhatsApp for Business account? Also, provide the business description, website, email, business hours, address, and category if it is.";

const relevantIds = [
  "8044d241-0f5b-403d-879a-48b080fd4bf6",
  "a7c44eb0-c7f2-446a-b57e-45d0f629c50c",
  "f657180c-3685-410d-8c71-a5f7632602f1",
];

/**
 * @param {string} query
 */
async function main(query: string) {
  const app = createGraph();

  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0,
  });

  const stream = await app.stream({
    llm,
    query,
  });

  let finalResult: GraphState | null = null;
  for await (const event of stream) {
    console.log("\n------\n");
    if (Object.keys(event)[0] === "execute_request_node") {
      console.log("---FINISHED---");
      finalResult = event.execute_request_node;
    } else {
      console.log("Stream event: ", Object.keys(event)[0]);
      // Uncomment the line below to see the values of the event.
      // console.log("Value(s): ", Object.values(event)[0]);
    }
  }

  if (!finalResult) {
    throw new Error("No final result");
  }
  if (!finalResult.bestApi) {
    throw new Error("No best API found");
  }

  console.log("---FETCH RESULT---");
  console.log(finalResult.response);

  const resultHasProperIds = relevantIds.includes(finalResult.bestApi.id);
  if (resultHasProperIds) {
    console.log("✅✅✅The result has the proper ids✅✅✅");
  } else {
    console.log("❌❌❌The result does not have the proper ids❌❌❌");
  }
}

main(datasetQuery);
