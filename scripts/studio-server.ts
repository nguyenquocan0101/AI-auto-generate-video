import { join } from "node:path";
import { createStudioServer } from "../src/studio/server.js";

const server = createStudioServer({
  outputRoot: join(process.cwd(), "output"),
  studioRoot: join(process.cwd(), "studio"),
});

server.listen(4173, () => {
  console.log("Video pipeline studio: http://localhost:4173");
});
