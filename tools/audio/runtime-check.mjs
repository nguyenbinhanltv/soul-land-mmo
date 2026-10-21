import { readFile } from "node:fs/promises";

export async function assertDockerRuntimeBoundary({ dockerfilePath, dockerignorePath }) {
  const [dockerfile, dockerignore] = await Promise.all([
    readFile(dockerfilePath, "utf8"),
    readFile(dockerignorePath, "utf8"),
  ]);
  if (/npm\s+install(?!\s+--prefix\s+(?:server|client)\b)/.test(dockerfile)) {
    throw new Error("Docker runtime must not install root dependencies");
  }
  if (/ffmpeg-static|node_modules\/ffmpeg|bin\/ffmpeg/i.test(dockerfile)) {
    throw new Error("Docker runtime must not copy or install ffmpeg");
  }
  if (!dockerignore.split(/\r?\n/).some((line) => line.trim() === "**/node_modules")) {
    throw new Error("Docker build context must ignore node_modules");
  }
  return true;
}
