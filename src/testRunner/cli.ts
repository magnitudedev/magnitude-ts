#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { Magnitude, TestCase } from '..';
import TestRegistry from './testRegistry';
import { TestRunner } from './testRunner';
import { TestCompiler } from './testCompiler';
import { TestGlobalConfig } from './types';

interface CliOptions {
    workers?: number;
}

async function findProjectRoot(startDir: string = process.cwd()): Promise<string | null> {
    let currentDir = startDir;

    // Keep track of the root directory to avoid infinite loops
    const rootDir = path.parse(currentDir).root;

    while (currentDir !== rootDir) {
        const packagePath = path.join(currentDir, 'package.json');

        try {
            // Check if package.json exists in this directory
            await fs.promises.access(packagePath, fs.constants.F_OK);
            return currentDir; // Found it!
        } catch (error) {
            // Move up one directory
            const parentDir = path.dirname(currentDir);

            // If we haven't moved up, we're at the root
            if (parentDir === currentDir) {
                return null;
            }

            currentDir = parentDir;
        }
    }

    return null; // No package.json found
}


async function discoverTestFiles(patterns: string[], cwd: string = process.cwd()): Promise<string[]> {
    //console.log(`Searching for test files matching patterns: ${patterns.join(', ')}`);

    try {
        // Use glob once with all patterns
        // Positive patterns are included, negative (! prefixed) patterns are excluded
        const files = await glob(patterns, {
            cwd,
            dot: true,        // Ignore dot files by default
            nodir: true,       // Only return files, not directories
            absolute: true    // Return paths relative to cwd
        });

        if (files.length === 0) {
            console.log(`No test files found matching patterns: ${patterns.join(', ')}`);
        } else {
            //console.log(`Found ${files.length} test file(s)`);
        }

        return files.map(file => path.resolve(cwd, file));
    } catch (error) {
        console.error('Error discovering test files:', error);
        return [];
    }
}
// async function discoverTestFiles(patterns: string[], cwd: string = process.cwd()): Promise<string[]> {
//     console.log(`Searching for test files matching patterns: ${patterns.join(', ')}`);

//     try {
//         // Use glob to find files matching all patterns
//         const allFiles: string[] = [];

//         for (const pattern of patterns) {
//             const files = await glob(pattern, { cwd });
//             allFiles.push(...files);
//         }

//         // Remove duplicates (in case files match multiple patterns)
//         const uniqueFiles = [...new Set(allFiles)];

//         if (uniqueFiles.length === 0) {
//             console.log(`No test files found matching patterns: ${patterns.join(', ')}`);
//         } else {
//             console.log(`Found ${uniqueFiles.length} unique test file(s)`);
//         }

//         return uniqueFiles.map(file => path.resolve(cwd, file));
//     } catch (error) {
//         console.error('Error discovering test files:', error);
//         return [];
//     }
// }

function getRelativePath(projectRoot: string, absolutePath: string): string {
    // Ensure both paths are absolute and normalized
    const normalizedAbsolutePath = path.normalize(absolutePath);
    const normalizedProjectRoot = path.normalize(projectRoot);

    // Check if the path is inside the project root
    if (!normalizedAbsolutePath.startsWith(normalizedProjectRoot)) {
        // If the path is not within the project root, return the original path
        return absolutePath;
    }

    return path.relative(normalizedProjectRoot, normalizedAbsolutePath);
}

// async function registerTestFile(registry: TestRegistry, projectRoot: string, absolutePath: string) {
//     const relativePath = getRelativePath(projectRoot, absolutePath);

//     registry.setCurrentFilePath(relativePath);

//     // Execute test file to register it
//     try {
//         // Convert file path to module path
//         const modulePath = `file://${absolutePath}`;

//         // Dynamically import the test file
//         await import(modulePath);
//         console.log(`Loaded test file: ${relativePath}`);
//     } catch (error) {
//         console.error(`Failed to load test file ${relativePath}:`, error);
//     }

//     registry.unsetCurrentFilePath();
// }

function findConfig(searchRoot: string): string | null {
    try {
        // Use glob to find the first magnitude.config.ts file
        // Excluding node_modules and dist directories
        const configFiles = glob.sync('**/magnitude.config.ts', {
            cwd: searchRoot,
            ignore: ['**/node_modules/**', '**/dist/**'],
            absolute: true
        });

        return configFiles.length > 0 ? configFiles[0] : null;
    } catch (error) {
        console.error('Error finding config file:', error);
        return null;
    }
}

async function readConfig(configPath: string): Promise<any> {
    try {
      const compiler = new TestCompiler();
      
      // Use the compiler to transform the TypeScript config file
      const compiledPath = await compiler.compileFile(configPath);
      
      // Import the compiled module
      const configModule = await import(`file://${compiledPath}`);
      
      // Extract the default export
      const config = configModule.default;
      
      return config;
    } catch (error) {
      console.error(`Error reading config from ${configPath}:`, error);
      return null;
    }
  }

const program = new Command();

program
    .name('magnitude')
    .description('Run Magnitude test cases')
    .argument('[...filters]', 'glob patterns for test files')
    .option('-w, --workers <number>', 'number of parallel workers for test execution', '1')
    .action(async (filters, options: CliOptions) => {
        //const patterns = [];
        const patterns = [
            '!**/node_modules/**',
            '!**/dist/**'
        ];

        // Add direct arguments (filters)
        if (filters && filters.length > 0) {
            patterns.push(...filters);
        } else {
            patterns.push('**/*.{mag,magnitude}.{js,jsx,ts,tsx}',)
        }

        // Parse worker count
        const workerCount = options.workers ? parseInt(options.workers as unknown as string, 10) : 1;

        // Validate worker count
        if (isNaN(workerCount) || workerCount < 1) {
            console.error('Invalid worker count. Using default of 1.');
        }

        const absoluteFilePaths = await discoverTestFiles(patterns);
        // only matters to show file names nicely
        const projectRoot = await findProjectRoot() ?? process.cwd();

        const configPath = findConfig(projectRoot);

        //console.log(configPath)

        const config: TestGlobalConfig = configPath ? await readConfig(configPath) : {};

        //console.log(config)

        const registry = TestRegistry.getInstance();
        registry.setGlobalOptions(config);

        // Create test runner with worker count
        const runner = new TestRunner(workerCount);

        // if (workerCount > 1) {
        //     console.log(`Running tests with ${workerCount} parallel workers`);
        // }

        for (const filePath of absoluteFilePaths) {
            await runner.loadTestFile(filePath, getRelativePath(projectRoot, filePath));
        }

        const success = await runner.runTests();

        if (!success) {
            console.error('Tests failed');
            process.exit(1);
        } else {
            console.log('All tests passed');
            process.exit(0);
        }
    });

program.parse();
