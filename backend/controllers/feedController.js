// controllers/feedController.js
const axios = require("axios");
const https = require("https"); // Used for https.Agent
const User = require("../models/User"); // Keep User model if needed elsewhere

// --- Configuration ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
const REQUEST_TIMEOUT = 8000; // 8 seconds timeout for external requests
const REDDIT_RETRIES = 2; // Number of retries per endpoint (Keep low to avoid long waits)
const REDDIT_SUBREDDIT = "StartUpIndia"; // Configurable subreddit

// --- Simple In-Memory Cache ---
const feedCache = {
  data: null,
  lastFetched: 0,
  ttl: CACHE_TTL,
  // Removed isStale flag for simplicity; TTL check is sufficient here
};

// --- Dedicated Axios Instance for Reddit ---
const redditAxios = axios.create({
  timeout: REQUEST_TIMEOUT,
  // Custom Agent for potential keep-alive or other options
  httpsAgent: new https.Agent({
    keepAlive: true, // Enable keep-alive
    rejectUnauthorized: true, // Standard security
    // Note: Agent timeout might conflict/interact with Axios timeout. Axios timeout is usually sufficient.
  }),
  headers: {
    // IMPORTANT: Replace placeholder with a real username/app name if possible
    "User-Agent": "CreatorDashboardApp/1.0 (by /u/YourRedditUsernameOrAppName)",
    Accept: "application/json",
    // 'Accept-Encoding': 'gzip, deflate', // Axios usually handles this
    "Cache-Control": "no-cache", // Ask Reddit not to serve its own cache
    Pragma: "no-cache",
    Expires: "0",
  },
});

// --- Fallback Content ---
const fallbackContent = {
  reddit: [
    {
      id: "reddit_fallback_1",
      title: `Could not fetch live posts. Visit r/${REDDIT_SUBREDDIT} directly!`,
      url: `https://www.reddit.com/r/${REDDIT_SUBREDDIT}`,
      source: "Reddit (Fallback)",
      score: null,
      thumbnail: null,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // Slightly older timestamp
    },
  ],
  twitter: [
    // Fallback for simulated data (just in case)
    {
      id: "twitter_fallback_1",
      title: "Simulated Twitter feed currently unavailable.",
      url: "#",
      source: "Twitter (Fallback)",
      createdAt: new Date(),
    },
  ],
};

// --- Enhanced Reddit Fetcher with Retries, Multiple Endpoints, and Proxy Fallback ---
const fetchRedditPostsWithRetry = async (retries = REDDIT_RETRIES) => {
  console.log(`Attempting to fetch Reddit posts for r/${REDDIT_SUBREDDIT}...`);
  // Try different endpoints (best, hot, new)
  const endpoints = [
    `best.json?limit=15`, // Reduced limit slightly
    `hot.json?limit=15`,
    // `new.json?limit=15` // 'new' can be very noisy, optional
  ];

  for (const endpoint of endpoints) {
    const url = `https://www.reddit.com/r/${REDDIT_SUBREDDIT}/${endpoint}`;
    console.log(`Trying endpoint: ${url}`);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await redditAxios.get(url);

        if (
          response.status === 200 &&
          response.data?.data?.children?.length > 0
        ) {
          console.log(`Success on attempt ${attempt} for ${endpoint}.`);
          // Map successful response
          return response.data.data.children.map((post) => ({
            id: `reddit_${post.data.id}`,
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            source: "Reddit",
            score: post.data.score,
            thumbnail: post.data.thumbnail?.startsWith("http")
              ? post.data.thumbnail
              : null,
            createdAt: new Date(post.data.created_utc * 1000),
          }));
        } else {
          // Request succeeded but no data or unexpected structure
          console.warn(
            `Attempt ${attempt} for ${endpoint} successful but no valid posts found. Status: ${response.status}`
          );
          // Continue to next attempt/endpoint without delay if structure is just wrong
          if (attempt === retries) continue; // Go to next endpoint if last attempt on this one
          break; // Treat as failure for this endpoint, try next attempt/endpoint
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} FAILED for ${endpoint}:`, {
          status: error.response?.status, // Will be 403 if blocked
          message: error.message, // e.g., timeout, network error
          code: error.code,
        });

        // If it's the absolute last attempt overall, try the proxy
        const isLastOverallAttempt =
          attempt === retries &&
          endpoints.indexOf(endpoint) === endpoints.length - 1;
        if (isLastOverallAttempt) {
          console.log(
            "All direct Reddit attempts failed. Trying CORS proxy..."
          );
          try {
            // Using best.json for proxy fallback
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
              `https://www.reddit.com/r/${REDDIT_SUBREDDIT}/best.json?limit=20`
            )}`;
            const proxyResponse = await axios.get(proxyUrl, {
              timeout: REQUEST_TIMEOUT,
            });

            // allorigins wraps the response, needs parsing
            if (proxyResponse.data && proxyResponse.data.contents) {
              const data = JSON.parse(proxyResponse.data.contents);
              if (data?.data?.children?.length > 0) {
                console.log("CORS proxy fetch successful!");
                return data.data.children.map((post) => ({
                  /* ... mapping logic ... */
                }));
              } else {
                console.warn(
                  "CORS proxy succeeded but no valid posts found in response."
                );
              }
            } else {
              console.warn("CORS proxy response invalid format.");
            }
          } catch (proxyError) {
            console.error("CORS proxy fetch also FAILED:", proxyError.message);
          }
        }

        // Wait before next retry (only if not the last attempt for this endpoint)
        if (attempt < retries) {
          const delay = 500 * Math.pow(2, attempt); // Exponential backoff (0.5s, 1s, 2s...)
          console.log(`Waiting ${delay}ms before next retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } // end catch
    } // end attempt loop
  } // end endpoint loop

  // If all attempts and proxy fail, return fallback
  console.error(
    `All fetch attempts for r/${REDDIT_SUBREDDIT} failed. Returning fallback.`
  );
  return fallbackContent.reddit;
};

// --- Simulated Twitter Fetcher ---
// (Kept simple as it's simulation)
const getTwitterPosts = () => {
  console.log("Getting simulated Twitter posts...");
  return Promise.resolve({
    // Simulated Twitter data
    data: [
      {
        title: "VertxAI is hiring! 🚀 Join the future of AI.",
        url: "https://twitter.com/vertxai",
        source: "Twitter",
      },
      {
        title: "When you fix a bug after 6 hours... typo. 🤦‍♂️",
        url: "https://twitter.com/funnydev",
        source: "Twitter",
      },
      {
        title: "Me explaining to my code why it should work: 🧠💥",
        url: "https://twitter.com/codingstruggles",
        source: "Twitter",
      },
      // Add more here if desired
    ],
  }).catch((err) => {
    // Add basic catch just in case Promise logic changes
    console.error("Simulated Twitter Promise failed unexpectedly:", err);
    return { data: fallbackContent.twitter }; // Return fallback on error
  });
};

// --- Main Feed Controller ---
exports.getFeed = async (req, res, next) => {
  const now = Date.now();

  // Serve from cache if available and valid
  if (feedCache.data && now - feedCache.lastFetched < feedCache.ttl) {
    console.log("Serving feed from valid cache");
    return res.json(feedCache.data);
  }

  console.log("Fetching fresh feed data (Cache expired or missing)");

  try {
    // Fetch sources concurrently
    // Using .allSettled is safer if getTwitterPosts could potentially reject
    const results = await Promise.allSettled([
      fetchRedditPostsWithRetry(), // Returns array (live or fallback)
      getTwitterPosts(), // Returns { data: [...] } or { data: fallback }
    ]);

    let combinedFeed = [];

    // Process Reddit results (Index 0)
    if (results[0].status === "fulfilled") {
      combinedFeed.push(...results[0].value); // Add the returned array (live or fallback)
      console.log(`Processed ${results[0].value.length} Reddit/Fallback posts`);
    } else {
      // Should not happen if helper always resolves, but handle defensively
      console.error(
        "CRITICAL: Reddit fetch helper REJECTED:",
        results[0].reason
      );
      combinedFeed.push(...fallbackContent.reddit); // Use fallback
    }

    // Process Twitter results (Index 1)
    if (results[1].status === "fulfilled" && results[1].value?.data) {
      const twitterPosts = results[1].value.data.map((post, index) => ({
        ...post,
        id: `twitter_${index}_${Date.now()}`, // Ensure unique ID
        createdAt: new Date(),
      }));
      combinedFeed.push(...twitterPosts);
      console.log(`Processed ${twitterPosts.length} Twitter/Fallback posts`);
    } else {
      console.error(
        "CRITICAL: Twitter fetch helper REJECTED or returned invalid data:",
        results[1].reason || results[1].value
      );
      combinedFeed.push(...fallbackContent.twitter); // Use fallback
    }

    // --- Shuffle and Cache ---
    console.log(
      `Combined feed has ${combinedFeed.length} posts before shuffle/cache.`
    );
    if (combinedFeed.length > 0) {
      combinedFeed.sort(() => Math.random() - 0.5); // Shuffle only if not empty
    }

    // Update cache
    feedCache.data = combinedFeed;
    feedCache.lastFetched = now;

    res.json(combinedFeed); // Send the final combined feed
  } catch (error) {
    // Catch unexpected errors during Promise.allSettled or processing
    console.error("!!! Feed Controller Main Catch Block Error !!!:", error);

    // Attempt to serve stale cache as a last resort
    if (feedCache.data) {
      console.warn("Serving stale cache due to main processing error.");
      return res.json(feedCache.data);
    }

    // If no cache and error, send only fallback data
    console.error(
      "Serving fallback data only due to main processing error and no cache."
    );
    const ultimateFallback = [
      ...fallbackContent.reddit,
      ...fallbackContent.twitter,
    ];
    res.status(500).json(ultimateFallback.sort(() => Math.random() - 0.5));

    // Optionally pass to global error handler
    // next(new Error("Failed to fetch or process feed data"));
  }
};

// Note: The setInterval logic for cache warming/staleness was removed
// as simple TTL expiration is generally more reliable for this use case.
