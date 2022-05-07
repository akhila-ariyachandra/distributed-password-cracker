import express from "express";
import bodyParser from "body-parser";
import nodes from "./nodes";
import router from "./router";
import { BASE_INDEX } from "./constants";
import { startElection } from "./helpers/bully";

const { hostname, port } = nodes[BASE_INDEX];

const app = express();
app.use(bodyParser.json());
app.use("/", router);

app.listen(port, hostname, () => {
  console.log(`> Node ${BASE_INDEX} listening on http://${hostname}:${port}`);
});

// Start election
const firstNode = nodes[0];

if (port === firstNode.port) {
  setTimeout(startElection, 5000);
}
