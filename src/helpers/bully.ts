import axios from "axios";
import { BASE_INDEX, NODE_ID } from "../constants";
import { type Result } from "../types";
import { otherNodes } from "../nodes";
import { startCracking } from "./password";

export let master: number;

export const setLeader = (index: number) => {
  master = index;
};

export const startElection = async () => {
  console.log(`> Node ${BASE_INDEX} is starting an election`);

  let answered = false;

  for (const node of otherNodes) {
    const response = await axios.post<Result>(
      `http://${node.hostname}:${node.port}/election`,
      { id: NODE_ID }
    );

    if (response.data === "OK" && !answered) {
      // The first node to say OK to an election
      // is set as the coordinator
      answered = true;

      await axios.put(`http://${node.hostname}:${node.port}/coordinator`);

      break;
    }
  }

  // If no node answered, with "OK",
  // then this node is the master
  setTimeout(async () => {
    if (!answered) {
      setLeader(BASE_INDEX);

      console.log(`> Node ${BASE_INDEX} is the master`);

      // Set the master value in the other nodes
      for (const node of otherNodes) {
        await axios.post<Result>(
          `http://${node.hostname}:${node.port}/master`,
          { index: BASE_INDEX }
        );
      }

      // Verify the master node in the slave nodes
      for (const node of otherNodes) {
        const { data } = await axios.get<string>(
          `http://${node.hostname}:${node.port}/master`
        );

        console.log(
          `> The slave node with port ${node.port} has node ${data} as master`
        );
      }

      // Start cracking passwords
      startCracking();
    }
  }, 5000);
};
