// Files picked in one admin page that another page should pick up (e.g. several videos chosen in the
// single add form are handed to the bulk uploader). Held in memory only; cleared as soon as it is read.
let pending: File[] = [];

export const setPendingFiles = (files: File[]) => {
  pending = files;
};

export const takePendingFiles = () => {
  const files = pending;
  pending = [];
  return files;
};
