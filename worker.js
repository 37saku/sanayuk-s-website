export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    try {
      // Step 1: Check Token
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
      
      if (!tokenData.access_token) {
        return new Response(JSON.stringify({ 
          error: "Failed to get access token", 
          spotify_response: tokenData 
        }), { headers: corsHeaders });
      }

      // Step 2: Check Player
      const npResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (npResponse.status === 204) {
        return new Response(JSON.stringify({ 
          error: "Spotify API returned 204: It thinks nothing is playing right now." 
        }), { headers: corsHeaders });
      }

      const npData = await npResponse.json();
      return new Response(JSON.stringify({ 
        success: "Connection working!", 
        raw_data: npData 
      }), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders });
    }
  }
};
