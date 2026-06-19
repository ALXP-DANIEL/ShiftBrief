// Demo seed: the "Evening Café Shift" with five worker updates. Used by the
// "Demo Room" button so the full flow can be shown on one device.

import type { TeamType, UpdateSource } from "./types";

export const SEED_SHIFT: { title: string; teamType: TeamType } = {
  title: "Evening Café Shift",
  teamType: "cafe",
};

export const SEED_UPDATES: Array<{
  workerName: string;
  role: string;
  transcript: string;
  source: UpdateSource;
}> = [
  {
    workerName: "Aina",
    role: "Cashier",
    source: "seed",
    transcript:
      "Customer complained coffee machine was slow. Ali belum close cash drawer because system lag.",
  },
  {
    workerName: "Farid",
    role: "Kitchen",
    source: "seed",
    transcript:
      "Plastic cups tinggal sikit. Maybe enough until morning only. Need buy tomorrow if supplier open.",
  },
  {
    workerName: "Mei",
    role: "Supervisor",
    source: "seed",
    transcript:
      "Freezer belakang bunyi kuat but still cold. Please check tomorrow morning before opening.",
  },
  {
    workerName: "Kumar",
    role: "Floor",
    source: "seed",
    transcript:
      "Table area near window still sticky after cleaning. Also one chair loose screw.",
  },
  {
    workerName: "Sara",
    role: "Closing",
    source: "seed",
    transcript:
      "Delivery came late so some items still not arranged. Need check invoice and store chilled items properly.",
  },
];
