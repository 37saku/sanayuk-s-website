export default {
  async fetch(request, env) {
    // Enable CORS so your website can fetch from this worker
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Get a new Access Token using your Refresh Token and Secrets
      const authHeader = btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`);
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: env.REFRESH_TOKEN,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // 2. Fetch what you are currently playing
      const npResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // If nothing is playing, Spotify returns a 204 status
      if (npResponse.status === 204 || npResponse.status > 400) {
        return new Response(JSON.stringify({ isPlaying: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const npData = await npResponse.json();
      
      // 3. Format the response for your HTML file
      if (npData.is_playing && npData.item) {
        return new Response(JSON.stringify({
          isPlaying: true,
          title: npData.item.name,
          artist: npData.item.artists.map(a => a.name).join(", ")
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ isPlaying: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Server Error", isPlaying: false }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }
};
