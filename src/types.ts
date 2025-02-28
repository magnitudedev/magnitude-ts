// Test Case Types
export interface TestDataEntry {
    key: string;
    value: string;
    sensitive?: boolean;
}

export interface TestData {
    data?: TestDataEntry[];
    other?: string;
}

export interface TestStep {
    description: string;
    checks?: string[];
    test_data?: TestData;
}

export interface TestCase {
    // User-defined SDK id e.g. login-test
    id: string;
    //sdk_id: string;
    name: string;
    url: string;
    steps: TestStep[];
}

// Test Run Types
export interface Problem {
    title: string;
    severity: "critical" | "high" | "medium" | "low" | "cosmetic";
    category: "visual" | "functional";
    expected_result: string;
    actual_result: string;
    action_index: number;
    is_fatal: boolean;
}

export interface TestAction {
    variant: "load" | "click" | "hover" | "type" | "scroll" | "wait" | "back";
    description: string;
    screenshot_url: string;
}

export interface TestStepResult {
    description: string;
    status: "pending" | "passed" | "failed";
    last_action_index: number;
    checks: {
        description: string;
        status: "pending" | "passed" | "failed";
        last_action_index: number;
        problems?: Problem[];
    }[];
    problems?: Problem[];
}

export interface TestRun {
    id: string;
    test_case_id: string;
    created_at: string;
    actions: TestAction[];
    steps: TestStepResult[];
    start_screenshot_url?: string;
    is_done: boolean;
    aborted: boolean;
    aborted_reason?: "crash" | "time_limit" | "action_limit";
}
