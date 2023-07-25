#!/usr/bin/env node

import cac from "cac";
const cli = cac("prevent-test");

cli
  // Simply omit the command name, just brackets
  .command("[...files]", "Check files")
  .option("--name <type>", "Annotation matching identification", {
    default: "test",
  })
  .action((files, options) => {
    console.log(files);
    console.log(options.name);
  });

cli.help();
cli.version("1.0.0");
cli.parse();
