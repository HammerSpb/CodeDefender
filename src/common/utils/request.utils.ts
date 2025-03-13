/**
 * Utility functions for extracting data from HTTP requests
 */

/**
 * Extract a resource ID from various places in the request
 * @param request The HTTP request object
 * @param paramName The name of the parameter to extract
 * @param fromParams Whether to check request.params
 * @param fromBody Whether to check request.body
 * @param fromQuery Whether to check request.query
 * @returns The extracted ID or undefined if not found
 */
export function extractResourceId(
  request: any, 
  paramName: string, 
  fromParams = true,
  fromBody = true,
  fromQuery = true
): string | undefined {
  // Try to get from params (URL parameters)
  if (fromParams) {
    const kebabParam = paramName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    if (request.params?.[paramName]) return request.params[paramName];
    if (request.params?.[kebabParam]) return request.params[kebabParam];
  }
  
  // Try to get from body
  if (fromBody) {
    const kebabParam = paramName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    if (request.body?.[paramName]) return request.body[paramName];
    if (request.body?.[kebabParam]) return request.body[kebabParam];
  }
  
  // Try to get from query parameters
  if (fromQuery) {
    const kebabParam = paramName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    if (request.query?.[paramName]) return request.query[paramName];
    if (request.query?.[kebabParam]) return request.query[kebabParam];
  }
  
  return undefined;
}

/**
 * Extract multiple resource IDs from the request
 * @param request The HTTP request object
 * @param paramNames Array of parameter names to extract
 * @returns Object with parameter names as keys and extracted values
 */
export function extractMultipleResourceIds(
  request: any,
  paramNames: string[]
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  
  for (const paramName of paramNames) {
    result[paramName] = extractResourceId(request, paramName);
  }
  
  return result;
}

/**
 * Extract user ID from the authenticated request
 * @param request The HTTP request object
 * @returns The user ID or undefined if not found
 */
export function extractUserId(request: any): string | undefined {
  return request.user?.id || request.user?.sub;
}
