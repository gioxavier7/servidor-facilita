// utils/livekit.js
const { AccessToken, RoomServiceClient } = require('@livekit/server-sdk');

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

function gerarToken(userId, roomName) {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userId,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return at.toJwt();
}

module.exports = {
  gerarToken,
  livekitUrl
};
