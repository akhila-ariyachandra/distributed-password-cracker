import nodes from "./nodes";
import axios from "axios";
import { Router, type Request } from "express";
import { BASE_INDEX, NODE_ID } from "./constants";
import { startElection, setLeader, master } from "./helpers/bully";
import {
  startCrackingSlave,
  PASSWORDS,
  CURRENT_PASSWORD_INDEX,
  cache,
  stopSlave,
  signalSlaves,
  storeResult,
  displayResults,
} from "./helpers/password";
import { otherNodes } from "./nodes";

const { port } = nodes[BASE_INDEX];
const router = Router();

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const handleRequest = (req: Request) => {
  console.log(
    `> Node ${BASE_INDEX} on port ${port}: Handling request ${req.method} ${req.url}`
  );
};

router.get("/", (req, res) => {
  handleRequest(req);
  res.send("Hello World!");
});

router.post("/election", (req, res) => {
  // This route will be used for election
  // if the ID of the requesting node is lower "OK" will be sent
  handleRequest(req);

  const id: number = req.body.id;

  res.status(200).send(id < NODE_ID ? "OK" : "NO");
});

router.put("/coordinator", (req, res) => {
  // Once a node has been set as the coordinator,
  // it will start an election
  handleRequest(req);

  console.log(`> Node ${BASE_INDEX} is the new coordinator`);

  startElection();

  res.status(200).send("OK");
});

router.post("/master", (req, res) => {
  // Used to set the Master node in the Slave nodes
  handleRequest(req);

  const index: number = req.body.index;
  setLeader(index);

  res.status(200).send("OK");
});

router.get("/master", (req, res) => {
  // Check the assigned Master node to the Slave
  handleRequest(req);

  res.status(200).send(`${master}`);
});

router.post("/crackPassword", (req, res) => {
  handleRequest(req);
  const { startIndex, endIndex } = req.body;

  startCrackingSlave(startIndex, endIndex);

  res.status(200).send("OK");
});

router.post("/verifyPassword", async (req, res) => {
  // handleRequest(req);
  const passwords = cache.get(PASSWORDS) as string[];
  const currentPasswordIndex = cache.get(CURRENT_PASSWORD_INDEX) as number;
  const currentPassword = passwords[currentPasswordIndex];

  const { password, index } = req.body;

  if (password === currentPassword) {
    const result = `> Password ${password} was found by node ${index}`;
    console.log(result);
    storeResult(result);

    // Stop the slaves
    for (const node of otherNodes) {
      await axios.post(`http://${node.hostname}:${node.port}/stopSlave`);
    }

    // Move to next component
    if (currentPasswordIndex < passwords.length - 1) {
      await sleep(2000);

      cache.set(CURRENT_PASSWORD_INDEX, currentPasswordIndex + 1);

      await signalSlaves();
    } else {
      displayResults();
    }

    return res.status(200).send("OK");
  } else {
    return res.status(400).send("NO");
  }
});

router.post("/stopSlave", async (req, res) => {
  handleRequest(req);

  await stopSlave();

  return res.status(200).send("OK");
});

export default router;
