export default class RequestHandler {
    // Indicates whether the app is running in development mode
    static development = import.meta.env.VITE_MODE === "development";

    // Base URL for the API server — swap the commented line for production
    static baseURL = "http://localhost:8888";
    // static baseURL = "https://cgt-system.netlify.app";

    // Netlify Functions path prefix appended to every API request
    static apiLink = ".netlify/functions/api";

    /**
     * Makes an HTTP request to the API and returns the parsed JSON response.
     *
     * @param method      - HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param link        - Endpoint path appended after the apiLink prefix
     * @param requestData - Request body as a plain object or FormData (ignored for GET/HEAD)
     * @param headers     - Additional headers merged into the request
     * @param callback    - Optional Node-style callback (err, data) called after the request
     * @returns           - Parsed response data, or an error shape with success: false
     */
    static async fetchData(
        method: string,
        link: string,
        requestData: Record<string, any> | FormData = {},
        headers: Record<string, string> = {},
        callback: ((error: string | null, data?: any) => void) | null = null
    ) {
        const url = `${RequestHandler.baseURL}/${RequestHandler.apiLink}/${link}`;

        const options: RequestInit = {
            method: method.toUpperCase(),
        };

        // Attach the auth token from localStorage if available (client-side only)
        const isClient = typeof window !== "undefined";
        const token = isClient ? localStorage.getItem("authToken") : null;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const isFormData = requestData instanceof FormData;

        if (!isFormData) {
            // For JSON payloads, set Content-Type and serialise the body
            options.headers = {
                "Content-Type": "application/json",
                ...headers,
            };
            // GET and HEAD requests must not include a body
            if (method.toLowerCase() !== "get" && method.toLowerCase() !== "head") {
                options.body = JSON.stringify(requestData);
            }
        } else {
            // For FormData (e.g. file uploads), let the browser set Content-Type with the boundary
            options.body = requestData;
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            // Treat non-2xx status codes as errors, using the API's message if available
            if (!response.ok) {
                throw new Error(
                    responseData.message || `HTTP error! Status: ${response.status}`
                );
            }

            if (callback) callback(null, responseData);
            return responseData;
        } catch (error: any) {
            console.error("Fetch error:", error);

            if (callback) {
                callback(
                    error.message || "Something went wrong. Please try again later.",
                    undefined
                );
            }

            // Return a consistent error shape so callers can check response.success
            return {
                success: false,
                message: error.message || "An error occurred",
                baseURL: RequestHandler.baseURL,
                url,
            };
        }
    }
}