import { apiCli } from "./presentation/cli/ApiCli";
import { firecrawlCli } from "./presentation/cli/FirecrawlCli";
import { configCli } from "./presentation/cli/configCli";


async function main() {
  const modeArg = process.argv.find(arg => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : null;

  switch (mode) {
    case "api":
      await apiCli();
      break;
    case "firecrawl":
      await firecrawlCli();
      break;
    case "config":
      await configCli();
      break;
    default:
      console.log("Specifica la modalità: --mode=api | --mode=firecrawl | --mode=config");
  }
}

main().catch(console.error);
