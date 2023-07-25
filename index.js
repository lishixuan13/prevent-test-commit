import chalk from "chalk";
import { readFile } from "node:fs/promises";
function createRegExp(name = "test") {
  return [
    `[ \t]*(?://|/\\*)[ \t]*#(${name})[ \t]+([^\n*]*)(?:\\*(?:\\*|/))?(?:[ \t]*\n+)?`,
    `[ \t]*<!--[ \t]*#(${name})[ \t]+(.*?)[ \t]*(?:-->|!>)(?:[ \t]*\n+)?`,
  ];
}

const errorChalk = chalk.hex("#F52447");

async function matchAll({ source, name, filePath } = {}) {
  const content = source ? source : await readFile(filePath, "utf8");
  const regs = createRegExp(name);
  const result = [];
  regs.forEach((reg) => {
    result.push(...content.matchAll(new RegExp(reg, "g")));
  });

  return result.map((v) => {
    const index = v.index;
    const { codeFrame, line } = generateCodeFrame(content, index + 1);
    return {
      name: v[1],
      content: v[2],
      index,
      codeFrame: codeFrame,
      filePath,
      ci: `${errorChalk(`✖ prevent-test-commit in `)}${
        filePath ? chalk.underline(filePath + ":" + line) : ""
      }\n${codeFrame}`,
    };
  });
}

const splitRE = /\r?\n/;
const range = 2;
function generateCodeFrame(source, start = 0, end) {
  start = start;
  end = end || start;
  let _line = 0;
  const lines = source.split(splitRE);
  let count = 0;
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + 1;
    if (count >= start) {
      _line = i;
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue;
        const line = j + 1;
        res.push(
          `${errorChalk(j === i ? " > " : "   ")}${line}${" ".repeat(
            Math.max(3 - String(line).length, 0)
          )}|  ${lines[j]}`
        );
        const lineLength = lines[j].length;
        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + 1;
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start
          );
          res.push(
            `      |  ` + " ".repeat(pad) + errorChalk("^").repeat(length)
          );
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`      |  ` + errorChalk("^".repeat(length)));
          }
          count += lineLength + 1;
        }
      }
      break;
    }
  }
  return {
    codeFrame: res.join("\n"),
    line: _line + 1,
  };
}

function forceCheck(options) {
  matchAll(options).then((result) => {
    if (result.length > 0) {
      console.log(result.map((v) => v.ci).join("\n\n"));
      process.exit(1);
    }
  });
}

forceCheck({
  filePath: "/Users/edy/Desktop/myGitHub/prevent-test-commit/test.js",
});

// console.log(generateCodeFrame(code, 53));
// console.log(code.substring(53))
