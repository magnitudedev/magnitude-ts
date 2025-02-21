import { Magnitude, TestCase } from 'magnitude-ts';

async function runLoginTest() {
    // Initialize client
    const client = new Magnitude(); // assumes MAGNITUDE_API_KEY is set

    // Create test case
    const loginTest: TestCase = {
        id: "login-test",
        name: "Basic Login Test",
        url: "https://qa-bench.com/",
        steps: [
            {
                description: "Login with valid credentials",
                checks: [
                    "Can see the dashboard"
                ],
                test_data: {
                    data: [
                        {
                            key: "username",
                            value: "test-user@magnitude.run",
                            sensitive: false
                        },
                        {
                            key: "password",
                            value: "test",
                            sensitive: true
                        }
                    ],
                    other: ""
                }
            }
        ]
    };

    // Use the default progress handler
    const progressHandler = Magnitude.createDefaultProgressHandler();

    // Run the test with progress tracking
    const result = await client.runTestCase(loginTest, progressHandler);

    // Parse and display results
    console.log(client.parseTestRun(result));
}

runLoginTest().catch(console.error);