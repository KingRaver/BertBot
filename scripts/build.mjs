import { execSync } from "child_process";

execSync("tsc -p tsconfig.json", { stdio: "inherit" });
