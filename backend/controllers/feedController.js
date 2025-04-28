// controllers/feedController.js

const axios = require("axios");
const User = require("../models/User");

const feedCache = {
  data: null,
  lastFetched: 0,
  ttl: 5 * 60 * 1000, // 5 minutes cache
};

// Fallback Reddit posts in case API fails
const fallbackRedditPosts = [
  {
    id: "reddit_fallback_1",
    title: "Check out r/developersIndia for developer discussions",
    url: "https://www.reddit.com/r/developersIndia",
    source: "Reddit",
    score: 100,
    thumbnail: null,
    createdAt: new Date(),
  },
  {
    id: "reddit_fallback_2",
    title: "Join the developersIndia community on Reddit",
    url: "https://www.reddit.com/r/developersIndia",
    source: "Reddit",
    score: 85,
    thumbnail: null,
    createdAt: new Date(Date.now() - 3600000),
  },
];

// Helper function to fetch Reddit posts with proper headers and timeout
const fetchRedditPosts = async () => {
  try {
    const response = await axios.get(
      "https://www.reddit.com/r/StartUpIndia/best.json?limit=20",
      {
        timeout: 8000, // 8 second timeout
        headers: {
          "User-Agent": "MyApp/1.0.0 (by /u/puddlethink)",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
      }
    );

    if (response.data?.data?.children?.length > 0) {
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
    }
    return fallbackRedditPosts;
  } catch (error) {
    console.error("Reddit API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
      },
    });
    return fallbackRedditPosts;
  }
};

exports.getFeed = async (req, res, next) => {
  const now = Date.now();

  // Serve from cache if available and valid
  if (feedCache.data && now - feedCache.lastFetched < feedCache.ttl) {
    console.log("Serving feed from cache");
    return res.json(feedCache.data);
  }

  console.log("Fetching fresh feed data (Deployed Check)");

  try {
    const results = await Promise.allSettled([
      fetchRedditPosts(), // Using the new fetch function
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
          {
            title: "Me explaining to my code why it should work: 🧠💥",
            url: "https://twitter.com/codingstruggles",
            source: "Twitter",
          },
        ],
      }),
    ]);

    let combinedFeed = [];

    // Process Reddit results (Index 0)
    if (results[0].status === "fulfilled") {
      combinedFeed.push(...results[0].value);
      console.log(`Processed ${results[0].value.length} Reddit posts`);
    } else {
      console.error("Unexpected Reddit fetch rejection:", results[0].reason);
      combinedFeed.push(...fallbackRedditPosts);
    }

    // Process Twitter results (Index 1)
    if (results[1].status === "fulfilled") {
      const twitterPosts = results[1].value.data.map((post, index) => ({
        ...post,
        id: `twitter_sim_${index}`,
        createdAt: new Date(),
      }));
      combinedFeed.push(...twitterPosts);
      console.log(`Processed ${twitterPosts.length} Twitter posts`);
    } else {
      console.error("Unexpected Twitter fetch rejection:", results[1].reason);
    }

    // Shuffle and cache the results
    console.log(
      `Combined feed has ${combinedFeed.length} posts before shuffle`
    );
    combinedFeed.sort(() => Math.random() - 0.5);

    // Update cache
    feedCache.data = combinedFeed;
    feedCache.lastFetched = now;

    res.json(combinedFeed);
  } catch (error) {
    console.error("Feed controller main error:", error);

    // Try to serve from cache even if stale
    if (feedCache.data) {
      console.log("Falling back to stale cache due to error");
      return res.json(feedCache.data);
    }

    // Ultimate fallback
    const fallbackFeed = [...fallbackRedditPosts, ...twitterFallbackPosts];
    res.json(fallbackFeed.sort(() => Math.random() - 0.5));
  }
};

// Twitter fallback data
const twitterFallbackPosts = [
  {
    id: "twitter_fallback_1",
    title: "VertxAI is hiring! 🚀 Join the future of AI.",
    url: "https://twitter.com/vertxai",
    source: "Twitter",
    createdAt: new Date(),
  },
  // ... other fallback tweets ...
];
