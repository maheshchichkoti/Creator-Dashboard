// controllers/feedController.js

const axios = require("axios");
const User = require("../models/User"); // For potentially awarding points later

// Simple in-memory cache (Replace with Redis for production/extra points)
const feedCache = {
  data: null,
  lastFetched: 0,
  ttl: 5 * 60 * 1000, // Cache for 5 minutes
};

exports.getFeed = async (req, res, next) => {
  // Use next for error handling
  const now = Date.now();

  // Check cache first
  if (feedCache.data && now - feedCache.lastFetched < feedCache.ttl) {
    console.log("Serving feed from cache");
    return res.json(feedCache.data);
  }

  console.log("Fetching fresh feed data");
  try {
    // --- Fetch External APIs ---
    // Wrap individual fetches in Promise.allSettled for resilience
    const results = await Promise.allSettled([
      axios.get("https://www.reddit.com/r/developersIndia/best.json?limit=20"), // Fetch a few more
      // Add more API calls here (e.g., Hacker News, simulated Twitter)
      Promise.resolve({
        // Simulated Twitter success
        data: [
          {
            title: "VertxAI is hiring! 🚀 Join the future of AI.",
            url: "https://twitter.com/vertxai",
            source: "Twitter",
          },
          {
            title: "When you fix a bug after 6 hours of debugging... and it was a typo. 🤦‍♂️",
            url: "https://twitter.com/funnydev",
            source: "Twitter",
          },
          {
            title: "Deploying on Friday? Bold move, Cotton. Let's see how it plays out. 😅",
            url: "https://twitter.com/devhumor",
            source: "Twitter",
          },
          {
            title: "Me: I'll just make a small CSS change.  
            Also me: Redesigns the entire website. 🎨",
            url: "https://twitter.com/frontendfun",
            source: "Twitter",
          },
          {
            title: "Git commit -m 'final final FINAL version' 🤣",
            url: "https://twitter.com/gitgood",
            source: "Twitter",
          },
          {
            title: "Why write tests when you can... pray? 🙏 #DevLife",
            url: "https://twitter.com/testless",
            source: "Twitter",
          },
          {
            title: "404: Motivation not found. Please try again later. 💤",
            url: "https://twitter.com/motivationbot",
            source: "Twitter",
          },
          {
            title: "StackOverflow: Where 90% of my code comes from. 📚",
            url: "https://twitter.com/stackoverflowfan",
            source: "Twitter",
          },
          {
            title: "Junior Dev: 'Is this a bug or a feature?'  
            Senior Dev: 'Yes.' 😎",
            url: "https://twitter.com/devjokes",
            source: "Twitter",
          },
          {
            title: "Me explaining to my code why it should work: 🧠💥",
            url: "https://twitter.com/codingstruggles",
            source: "Twitter",
          },
        ]
      }),
      // Example: Hacker News Top Stories (requires another axios call)
      // axios.get('https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=10&orderBy="$key"'),
    ]);

    let combinedFeed = [];

    // Process Reddit results
    if (
      results[0].status === "fulfilled" &&
      results[0].value.data?.data?.children
    ) {
      const redditPosts = results[0].value.data.data.children.map((post) => ({
        id: `reddit_${post.data.id}`, // Add unique ID
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        source: "Reddit",
        score: post.data.score, // Include score or other relevant data
        thumbnail:
          post.data.thumbnail && post.data.thumbnail.startsWith("http")
            ? post.data.thumbnail
            : null, // Basic thumbnail handling
        createdAt: new Date(post.data.created_utc * 1000), // Convert UTC seconds to Date
      }));
      combinedFeed.push(...redditPosts);
    } else {
      console.error(
        "Failed to fetch Reddit posts:",
        results[0].reason || "No data"
      );
    }

    // Process Simulated Twitter results
    if (results[1].status === "fulfilled") {
      const twitterPosts = results[1].value.data.map((post, index) => ({
        ...post,
        id: `twitter_sim_${index}`, // Add unique ID
        createdAt: new Date(), // Add timestamp
      }));
      combinedFeed.push(...twitterPosts);
    } else {
      console.error("Failed simulated Twitter fetch:", results[1].reason);
    }

    // Add more processors for other APIs...

    // --- Shuffle and Cache ---
    // Shuffle the combined feed for variety
    combinedFeed.sort(() => Math.random() - 0.5);

    // Update cache
    feedCache.data = combinedFeed;
    feedCache.lastFetched = now;

    // --- TODO: Award Credits for Feed Interaction ---
    // This would typically happen on *specific user actions* (like viewing the feed first time today)
    // NOT just on fetching the feed data itself.
    // Example (needs to be moved to appropriate trigger):
    // await User.findByIdAndUpdate(req.user.id, { $inc: { credits: 1 } });

    res.json(combinedFeed); // Send the combined, shuffled feed
  } catch (error) {
    // Catch any unexpected errors during processing
    console.error("Feed Controller Error:", error);
    // Pass error to the global error handler
    next(new Error("Failed to fetch or process feed data"));
  }
};
