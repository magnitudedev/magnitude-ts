import { runTestCase, runMultipleTestCases, initializeApi, ProgressCallback } from './api';
import { TestCase, TestRun, Problem } from './types';
import { validateTestCase, validateTestCases } from './schema';

export class Magnitude {
    private apiKey: string;

    constructor(apiKey?: string) {
        const resolvedApiKey = apiKey || process.env.MAGNITUDE_API_KEY;

        if (!resolvedApiKey) {
            throw new Error('MAGNITUDE_API_KEY must be provided either through constructor or environment variable');
        }

        this.apiKey = resolvedApiKey;
        initializeApi(this.apiKey);
    }

    /**
     * Creates a default progress handler that prints a simple progress message
     */
    static createDefaultProgressHandler(): ProgressCallback {
        return (testRun: TestRun) => {
            const completedSteps = testRun.steps.filter(step => step.status !== 'pending').length;
            const totalSteps = testRun.steps.length;
            const progress = Math.round((completedSteps / totalSteps) * 100);

            console.log(`\n⏳ Test run ${testRun.id}: ${progress}% complete (${completedSteps}/${totalSteps} steps)`);

            // Show passed steps and their checks
            testRun.steps.forEach((step, index) => {
                if (step.status === 'passed') {
                    console.log(`  ✅ Step ${index + 1}: ${step.description}`);
                    step.checks.forEach((check, checkIndex) => {
                        if (check.status === 'passed') {
                            console.log(`    ✓ ${check.description}`);
                        }
                    });
                } else if (step.status === 'pending' && index === completedSteps) {
                    // Show current step in progress
                    console.log(`  ⏳ Step ${index + 1}: ${step.description}`);
                    step.checks.forEach((check, checkIndex) => {
                        if (check.status === 'passed') {
                            console.log(`    ✓ ${check.description}`);
                        } else if (check.status === 'pending') {
                            console.log(`    ⏳ ${check.description}`);
                        }
                    });
                }
            });
        };
    }

    async runTestCase(testCase: TestCase, onProgress?: ProgressCallback): Promise<TestRun> {
        // Validate the test case structure before running
        validateTestCase(testCase);
        return runTestCase(testCase, onProgress);
    }

    async runMultipleTestCases(testCases: TestCase[], onProgress?: ProgressCallback): Promise<TestRun[]> {
        // Validate all test cases before running
        validateTestCases(testCases);
        return runMultipleTestCases(testCases, onProgress);
    }

    parseTestRun(testRun: TestRun): string {
        const output: string[] = [];

        // Basic information
        output.push('\n=== Test Run Summary ===');
        output.push(`ID: ${testRun.id}`);
        output.push(`Created: ${new Date(testRun.created_at).toLocaleString()}`);
        output.push(`Status: ${testRun.is_done ? 'Completed' : 'In Progress'}`);

        if (testRun.aborted) {
            output.push(`⚠️  Test Aborted: ${testRun.aborted_reason || 'No reason provided'}`);
        }

        // Steps summary
        output.push('\n=== Steps ===');
        testRun.steps.forEach((step, index) => {
            const statusEmoji = step.status === 'passed' ? '✅' :
                step.status === 'failed' ? '❌' : '⏳';
            output.push(`\n${statusEmoji} Step ${index + 1}: ${step.description}`);

            // Checks for each step
            step.checks.forEach((check, checkIndex) => {
                const checkEmoji = check.status === 'passed' ? '✓' :
                    check.status === 'failed' ? '✗' : '⏳';
                output.push(`  ${checkEmoji} Check ${checkIndex + 1}: ${check.description}`);

                // Problems for failed checks
                if (check.problems?.length) {
                    output.push(this.formatProblems(check.problems, '    '));
                }
            });

            // Step-level problems
            if (step.problems?.length) {
                output.push('\n  Step-level problems:');
                output.push(this.formatProblems(step.problems, '    '));
            }
        });

        // Actions taken
        output.push('\n=== Actions Taken ===');
        testRun.actions.forEach((action, index) => {
            output.push(`${index + 1}. [${action.variant}] ${action.description}`);
        });

        return output.join('\n');
    }

    private formatProblems(problems: Problem[], indent: string = ''): string {
        return problems.map(problem => {
            const lines: string[] = [];
            const severityColor = this.getSeveritySymbol(problem.severity);
            lines.push(`${indent}${severityColor} ${problem.title} (${problem.severity} ${problem.category})`);
            lines.push(`${indent}  Expected: ${problem.expected_result}`);
            lines.push(`${indent}  Actual: ${problem.actual_result}`);
            if (problem.is_fatal) {
                lines.push(`${indent}  ⚠️ Fatal Error`);
            }
            return lines.join('\n');
        }).join('\n');
    }

    private getSeveritySymbol(severity: string): string {
        switch (severity) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🔵';
            case 'cosmetic': return '⚪';
            default: return '❓';
        }
    }
}

export default Magnitude;

