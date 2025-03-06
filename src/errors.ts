import { Problem, Warning } from './dataWrappers';
import chalk from 'chalk';

export class ProblemError extends Error {
    private problem: Problem;

    constructor(problem: Problem) {
        // Create a nicely formatted error message
        const title = problem.getTitle();
        const severity = problem.getSeverity();
        const category = problem.getCategory();

        const severityColor = {
            critical: chalk.red.bold,
            high: chalk.red,
            medium: chalk.yellow,
            low: chalk.blue,
            cosmetic: chalk.gray
        }[severity];

        // Format the main message
        const mainMessage = `${severityColor(`[${severity.toUpperCase()}]`)} ${chalk.bold(title)} (${category})`;

        // Format the expected vs actual results
        const expected = problem.getExpectedResult();
        const actual = problem.getActualResult();

        const detailedMessage = `
${mainMessage}

${chalk.green('Expected:')} ${expected}
${chalk.red('Actual:')}   ${actual}
    `.trim();

        super(detailedMessage);
        this.name = 'ProblemError';
        this.problem = problem;

        //Error.captureStackTrace(this, ProblemError);
    }

    getProblem(): Problem {
        return this.problem;
    }
}

export class WarningError extends Error {
    private warning: Warning;

    constructor(warning: Warning) {
        // Create a nicely formatted warning message
        const title = warning.getTitle();
        const severity = warning.getSeverity();
        const category = warning.getCategory();

        const severityColor = {
            critical: chalk.red.bold,
            high: chalk.red,
            medium: chalk.yellow,
            low: chalk.blue,
            cosmetic: chalk.gray
        }[severity];

        // Format the main message
        const mainMessage = `${severityColor(`[WARNING: ${severity.toUpperCase()}]`)} ${chalk.bold(title)} (${category})`;

        // Format the expected vs actual results
        const expected = warning.getExpectedResult();
        const actual = warning.getActualResult();

        const detailedMessage = `
${mainMessage}

${chalk.green('Expected:')} ${expected}
${chalk.red('Actual:')}   ${actual}
    `.trim();

        super(detailedMessage);
        this.name = 'WarningError';
        this.warning = warning;
    }

    getWarning(): Warning {
        return this.warning;
    }
}