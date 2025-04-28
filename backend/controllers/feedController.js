// controllers/feedController.js

const axios = require("axios");
const User = require("../models/User");

const feedCache = {
  data: null,
  lastFetched: 0,
  ttl: 5 * 60 * 1000,
};

exports.getFeed = async (req, res, next) => {
  const now = Date.now();

  if (feedCache.data && now - feedCache.lastFetched < feedCache.ttl) {
    console.log("Serving feed from cache");
    return res.json(feedCache.data);
  }

  console.log("Fetching fresh feed data (Deployed Check)");
  try {
    const results = await Promise.allSettled([
      // Added User-Agent header attempt
      axios.get("https://www.reddit.com/r/developersIndia/best.json?limit=20", {
        timeout: 10000, // Added timeout (10 seconds)
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }),
      Promise.resolve({
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
          // ... (rest of twitter data) ...
          {
            title: "Me explaining to my code why it should work: 🧠💥",
            url: "https://twitter.com/codingstruggles",
            source: "Twitter",
          },
        ],
      }),
    ]);

    let combinedFeed = []; // Initialize empty array

    // Process Reddit results (Index 0)
    if (
      results[0].status === "fulfilled" &&
      results[0].value.data?.data?.children?.length > 0 // Check length too
    ) {
      const redditPosts = results[0].value.data.data.children.map((post) => ({
        id: `reddit_${post.data.id}`,
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        source: "Reddit",
        score: post.data.score,
        thumbnail:
          post.data.thumbnail && post.data.thumbnail.startsWith("http")
            ? post.data.thumbnail
            : null,
        createdAt: new Date(post.data.created_utc * 1000),
      }));
      combinedFeed.push(...redditPosts);
      console.log(
        `Successfully fetched ${redditPosts.length} Reddit posts (Deployed Check)`
      );
    } else {
      // --- >>> CORRECTED & DETAILED LOGGING BLOCK <<< ---
      console.error(
        "!!! Reddit Fetch Failed or Data Missing/Empty (Deployed Check) !!!"
      );
      if (results[0].status === "rejected") {
        const redditError = results[0].reason; // Get the raw reason object
        console.error("--- Raw Reddit Error Reason Object (if rejected) ---");
        console.error(redditError); // Log the raw object
        console.error("--- End Raw Reddit Error Reason Object ---");

        console.error("Detailed Reddit Fetch Error Properties:", {
          isAxiosError: redditError?.isAxiosError,
          message: redditError?.message,
          code: redditError?.code, // Important for network errors
          status: redditError?.response?.status,
          config_url: redditError?.config?.url,
        });
      } else {
        // Status was 'fulfilled' but data structure was wrong or children array was empty
        console.error(
          "Reddit Fetch Fulfilled but data invalid or no posts found. Status:",
          results[0].status,
          "Value received:",
          results[0].value // Log the whole value received
        );
      }
      // --- >>> END CORRECTED & DETAILED LOGGING BLOCK <<< ---
    }

    // Process Simulated Twitter results (Index 1)
    if (results[1].status === "fulfilled") {
      const twitterPosts = results[1].value.data.map((post, index) => ({
        ...post,
        id: `twitter_sim_${index}`,
        createdAt: new Date(),
      }));
      combinedFeed.push(...twitterPosts); // Add Twitter posts
      console.log(
        `Successfully processed ${twitterPosts.length} Twitter posts (Deployed Check)`
      );
    } else {
      console.error(
        "Simulated Twitter Promise Failed (Unexpected - Deployed Check):",
        results[1].reason
      );
    }

    // --- Shuffle and Cache ---
    console.log(
      `Combined feed has ${combinedFeed.length} posts before shuffle/cache (Deployed Check)`
    );
    combinedFeed.sort(() => Math.random() - 0.5);
    feedCache.data = combinedFeed;
    feedCache.lastFetched = now;

    res.json(combinedFeed); // Send the combined, shuffled feed
  } catch (error) {
    // Catch errors from Promise.allSettled or other processing steps
    console.error(
      "!!! Feed Controller Main Catch Block Error (Deployed Check) !!!:",
      error
    );
    next(new Error("Failed to fetch or process feed data"));
  }
};
