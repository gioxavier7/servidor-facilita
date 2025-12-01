const twilio = require("twilio");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

const VideoGrant = twilio.jwt.AccessToken.VideoGrant;

async function createOrGetRoom(roomName) {
    const client = twilio(apiKeySid, apiKeySecret, { accountSid });

    try {
        // Tenta pegar a sala se existir
        let room = await client.video.v1.rooms(roomName).fetch();
        return room;
    } catch (err) {
        if (err.status === 404) {
            // Se não existir, cria
            return await client.video.v1.rooms.create({
                uniqueName: roomName,
                type: "go"
            });
        }
        throw err;
    }
}

function generateVideoToken(identity, roomName) {
    const token = new twilio.jwt.AccessToken(
        accountSid,
        apiKeySid,
        apiKeySecret,
        { identity }
    );

    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return token.toJwt();
}

module.exports = {
    createOrGetRoom,
    generateVideoToken
};
