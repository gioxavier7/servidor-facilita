const redis = require('./utils/redis');

async function main() {
  try {
    await redis.set("teste", "ok", "EX", 10);
    const value = await redis.get("teste");
    console.log("Valor:", value);
  } catch (err) {
    console.error(err);
  }
}

main();
