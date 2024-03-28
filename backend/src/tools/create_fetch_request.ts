import { GraphState } from "index.js";

/**
 * @param {GraphState} state
 */
export async function createFetchRequest(
  state: GraphState
): Promise<Partial<GraphState>> {
  const { params, bestApi } = state;
  if (!bestApi) {
    throw new Error("No best API found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = null;
  try {
    if (!params) {
      console.log("Making request with params");
      const fetchRes = await fetch(bestApi.api_url, {
        method: bestApi.method,
      });
      response = fetchRes.ok ? await fetchRes.json() : await fetchRes.text();
    } else {
      console.log("Making request WITHOUT params");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fetchOptions: Record<string, any> = {
        method: bestApi.method,
      };
      let parsedUrl = bestApi.api_url;

      const paramKeys = Object.entries(params);
      paramKeys.forEach(([key, value]) => {
        if (parsedUrl.includes(`{${key}}`)) {
          parsedUrl = parsedUrl.replace(`{${key}}`, value);
          delete params[key];
        }
      });

      const url = new URL(parsedUrl);

      if (["GET", "HEAD"].includes(bestApi.method)) {
        Object.entries(params).forEach(([key, value]) =>
          url.searchParams.append(key, value)
        );
      } else {
        fetchOptions = {
          ...fetchOptions,
          body: JSON.stringify(params),
        };
      }

      const fetchRes = await fetch(url, fetchOptions);
      response = fetchRes.ok ? await fetchRes.json() : await fetchRes.text();
    }

    if (response) {
      return {
        response,
      };
    }
  } catch (e) {
    console.error("Error fetching API");
    // console.error(e);
  }

  return {
    response: null,
  };
}
