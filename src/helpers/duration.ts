import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import NodeCache from "node-cache";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const START_TIME = "START_TIME";
const cache = new NodeCache();

export const setStartTime = () => {
  cache.set(START_TIME, dayjs());
};

export const getDuration = () => {
  const startTime = cache.get<Dayjs>(START_TIME);

  return dayjs().diff(startTime, "seconds");
};
