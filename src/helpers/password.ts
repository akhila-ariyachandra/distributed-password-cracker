import fs from "fs";
import readline from "readline";
import path from "path";
import Queue from "bull";
import axios from "axios";
import nodes from "../nodes";
import NodeCache from "node-cache";
import { BASE_INDEX, CHARACTERS, PASSWORD_RANGES } from "../constants";
import { master } from "./bully";
import { otherNodes } from "../nodes";
import { setStartTime, getDuration } from "./duration";

export const PASSWORDS = "PASSWORDS";
export const CURRENT_PASSWORD_INDEX = "CURRENT_PASSWORD_INDEX";
const RESULTS = "RESULTS";
const ACTIVE = "ACTIVE";
export const cache = new NodeCache();

const readPasswordFile = async () => {
  const passwords = [];

  const fileStream = fs.createReadStream(
    path.join(__dirname, "..", "..", "passwords.txt")
  );

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    passwords.push(line);
  }

  return passwords;
};

// Start of Master node to signal other nodes to start cracking
export const startCracking = async () => {
  console.log(`> Start cracking password by master node ${BASE_INDEX}`);
  const passwords = await readPasswordFile();

  cache.set(PASSWORDS, passwords);
  cache.set(CURRENT_PASSWORD_INDEX, 0);

  setStartTime();

  await signalSlaves();
};

// The queue of the slave node to crack the password
const passwordQueue = new Queue<{ startIndex: number; endIndex: number }>(
  `slave-${BASE_INDEX}`,
  process.env.REDIS_HOST as string
);
passwordQueue.process(async (job) => {
  const masterNode = nodes[master];
  const { startIndex, endIndex } = job.data;

  cache.set(ACTIVE, true);

  console.log(
    `> Node ${BASE_INDEX} is cracking password from ${startIndex} to ${endIndex}`
  );

  for (let i = startIndex; i <= endIndex; i++) {
    for (let j = 0; j < CHARACTERS.length; j++) {
      for (let k = 0; k < CHARACTERS.length; k++) {
        for (let l = 0; l < CHARACTERS.length; l++) {
          for (let m = 0; m < CHARACTERS.length; m++) {
            for (let n = 0; n < CHARACTERS.length; n++) {
              const checkingPassword = `${CHARACTERS[i]}${CHARACTERS[j]}${CHARACTERS[k]}${CHARACTERS[l]}${CHARACTERS[m]}${CHARACTERS[n]}`;

              const active = cache.get<boolean>(ACTIVE);
              if (!active) {
                return Promise.resolve();
              }

              try {
                await axios.post(
                  `http://${masterNode.hostname}:${masterNode.port}/verifyPassword`,
                  { password: checkingPassword, index: BASE_INDEX }
                );

                return Promise.resolve();
              } catch (error) {
                //console.log("> error: ", error);
              }
            }
          }
        }
      }
    }
  }

  return Promise.resolve();
});

export const startCrackingSlave = (startIndex: number, endIndex: number) => {
  passwordQueue.add({ startIndex, endIndex });
};

/**
 * Stop any running cracking jobs in the slave
 */
export const stopSlave = async () => {
  cache.set(ACTIVE, false);
};

export const signalSlaves = async () => {
  for (let i = 0; i < otherNodes.length; i++) {
    const node = otherNodes[i];
    const passwordRange = PASSWORD_RANGES[i];

    await axios.post(`http://${node.hostname}:${node.port}/crackPassword`, {
      ...passwordRange,
    });
  }
};

/**
 * Store results
 */
export const storeResult = (result: string) => {
  const results: string[] = cache.get(RESULTS) ?? [];

  results.push(result);

  cache.set(RESULTS, results);
};

/**
 * Display results
 */
export const displayResults = () => {
  console.log("******************************************");
  console.log(`> All passwords were found`);
  console.log(`> Master Node: ${master}`);
  const results: string[] = cache.get(RESULTS) ?? [];
  results.forEach((result) => {
    console.log(result);
  });
  console.log(`> Time taken: ${getDuration()} seconds`);
  console.log("******************************************");
};
