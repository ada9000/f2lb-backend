import { laceToAda } from "../util/utils";

export async function epochsAllowed(lace: number) {
  const ada = laceToAda(lace.toString());
  let epochsGranted = 0;
  if (ada > 1000) {
    epochsGranted = 1;
  }
  if (ada > 3000) {
    epochsGranted = 2;
  }
  if (ada > 10000) {
    epochsGranted = 3;
  }
  if (ada > 40000) {
    epochsGranted = 4;
  }
  return epochsGranted;
}
