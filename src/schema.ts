import { z } from 'zod';

const TestDataEntrySchema = z.object({
    key: z.string(),
    value: z.string(),
    sensitive: z.boolean().default(false)
});

const TestDataSchema = z.object({
    data: z.array(TestDataEntrySchema).default([]),
    other: z.string().default("")
});

export const TestStepSchema = z.object({
    description: z.string().min(5, 'Description must be at least 5 characters').max(125, 'Description must be at most 125 characters'),
    checks: z.array(z.string().min(5, 'Check must be at least 5 characters').max(125, 'Check must be at most 125 characters')).max(5, 'Maximum of 5 checks allowed').default([]),
    test_data: TestDataSchema.default({
        data: [],
        other: ""
    })
});

const urlSchema = z.string().refine(
    (str) => {
        // Try validating with original string
        const asIs = z.string().url().safeParse(str);
        if (asIs.success) return true;

        // If that fails, try with https:// prefixed
        const withProtocol = z.string().url().safeParse(`https://${str}`);
        return withProtocol.success;
    },
    'Please enter a valid domain (e.g., example.com)'
);

export const TestCaseSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name must be at least 1 character').max(50, 'Name must be at most 50 characters'),
    url: urlSchema,
    steps: z.array(TestStepSchema).min(1, 'At least one step is required'),
});
// Helper function to validate test cases
export function validateTestCase(testCase: unknown) {
    try {
        return TestCaseSchema.parse(testCase);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => {
                return `${issue.path.join('.')} - ${issue.message}`;
            }).join('\n');
            throw new Error(`Invalid test case structure:\n${issues}`);
        }
        throw error;
    }
}

// Helper function to validate multiple test cases
export function validateTestCases(testCases: unknown[]) {
    try {
        return z.array(TestCaseSchema).parse(testCases);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => {
                return `${issue.path.join('.')} - ${issue.message}`;
            }).join('\n');
            throw new Error(`Invalid test cases structure:\n${issues}`);
        }
        throw error;
    }
} 