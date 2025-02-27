import { Magnitude, TestCase } from 'magnitude-ts';

//Magnitude.init("foo");

async function main() {
    const loginTest = new TestCase({
        id: "login-test", // any ID you want
        name: "Basic Login Test", // friendly name
        url: "https://qa-bench.com" // target site url
    });
    
    loginTest.addStep("Login to the app")
        .check("Can see dashboard") // natural language assertion
        .data({ username: "test-user@magnitude.run" }) // plaintext data
        .secureData({ password: "test" }) // encrypted data
        // .data({ username: process.env.TEST_USER_EMAIL! }) // plaintext data
        // .secureData({ password: process.env.TEST_USER_PASSWORD! }) // encrypted data
    
    console.log(loginTest);
    
    // start the test case!
    await loginTest.run();
}

main();
