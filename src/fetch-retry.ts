export async function fetchRetry(
  maxTries: number,
  input: string | URL | globalThis.Request,
  init?: RequestInit,
  retryWhenNotOk = false
): Promise<Response> {
  let failed: boolean, response: Response, tries = 0
  do {
    failed = false
    response = await fetch(input, init)
      .catch((res) => {
        failed = true
        return res
      })
    if (retryWhenNotOk && !response.ok) failed = true
    tries++
  } while (failed && tries < maxTries)
  // @ts-ignore
  return response
}
