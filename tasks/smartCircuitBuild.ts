import fs from 'fs';
import * as fsPromise from 'fs/promises';
import * as path from "path";

import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { string } from 'hardhat/internal/core/params/argumentTypes';
import camelcase from "camelcase";



/**
 * @description Script (re)building circom circuits when needed
 */
async function smartCircuitBuild(
  // place for task arguments:
  {}: {},
  hre: HardhatRuntimeEnvironment) {
    console.log("Smart circuit build:");
    
    // read the list of circuits from a config file
    
    await hre.config.circom.circuits.forEach(async (circuit: any) => {
      const rootPath = hre.config.paths.root;
      
      const verifierName = camelcase(circuit.name, {
        pascalCase: true,
        preserveConsecutiveUppercase: true,
        locale: false,
      });
      const verifierPath = path.join(rootPath, "contracts", verifierName + "Verifier.sol");
      
      const outputFiles = [
        verifierPath,
        path.join(circuit.wasm ? circuit.wasm : circuit.name + ".wasm"),
        path.join(circuit.zkey ? circuit.zkey : circuit.name + ".zkey"),
      ];
      
      const sourceFiles = findAllImportedSourceFiles(circuit.circuit, []);

      // TODO: remember last config to detect build config changes for a circuit
      
      // check build file existance
      let buildNeeded = false;
      for (const outputFile of outputFiles) {
        if (!fs.existsSync(outputFile)) {
          buildNeeded = true;
          console.log(`Rebuilding ${circuit.name} because ${outputFile} does not exist`);
          break;
        }
      }
      if (!buildNeeded){
        // check if source files changed
        let oldestOutputModificationTime = Number.MAX_SAFE_INTEGER;
        for (const file of outputFiles) {
          const modificationTime = fs.statSync(file).mtimeMs;
          if (modificationTime < oldestOutputModificationTime) {
            oldestOutputModificationTime = modificationTime;
          }
        }
        let latestSourseModificationTime = 0;
        for (const file of sourceFiles) {
          const modificationTime = fs.statSync(file).mtimeMs;
          if (modificationTime > latestSourseModificationTime) {
            latestSourseModificationTime = modificationTime;
          }
        }

        if (latestSourseModificationTime > oldestOutputModificationTime) {
          buildNeeded = true;
          console.log(`Rebuilding ${circuit.name} because source files changed`);
        }
      }

      if (!buildNeeded) {
        console.log(`${circuit.name} is up to date`);
      } else {
        console.log(`Compining circuit ${circuit.name}. This might take a while...`);
        hre.run("circom", {circuit: circuit.name})

        // Make contract names unique so that hardhat does not complain
        const contentBefore = fs.readFileSync(verifierPath, 'utf8');
        var contentAfter = contentBefore.replace(/contract Verifier {/g, `contract ${verifierName}Verifier {`);
        fs.writeFileSync(verifierPath, contentAfter, 'utf8');
      }
    });

    console.log("done");
}
  
// register task in hardhat
task("smartCircuitBuild", "Task (re)building circom circuits when source files changed")
  .setAction(async (taskArgs, hre) => {
    await smartCircuitBuild(taskArgs, hre).catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
  });
 
/**
 * @description Helper function to recursively find all imported files
 */
function findAllImportedSourceFiles(rootCircuit: string, visited: string[]) : string[] {
  let res = [rootCircuit];
  visited.push(rootCircuit);

  const fileContent = fs.readFileSync(rootCircuit, 'utf-8');

  for (const line of fileContent.split('\n')) {
    if (line.startsWith("include")) {
      const includedFile = line.split('"')[1];
      const includedFilePath = path.join(path.dirname(rootCircuit), includedFile);
      if (visited.includes(includedFilePath)) {
        continue;
      }
      const newImports = findAllImportedSourceFiles(includedFilePath, visited);
      res.push(...newImports);
      visited.push(...newImports);
    } 
  }

  return res;
}
