import { BASE_INDEX } from "./constants";

const nodes = [
  {
    hostname: "0.0.0.0",
    port: 3000,
  },
  {
    hostname: "0.0.0.0",
    port: 3001,
  },
  {
    hostname: "0.0.0.0",
    port: 3002,
  },
  {
    hostname: "0.0.0.0",
    port: 3003,
  },
];

export default nodes;

const { port } = nodes[BASE_INDEX];

export const otherNodes = nodes.filter((node) => node.port !== port);
