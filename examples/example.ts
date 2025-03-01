import { Magnitude, TestCase } from 'magnitude-ts';
//import chalk from 'chalk';

//Magnitude.init("foo");

async function main() {
    const loginTest = new TestCase({
        id: "tunnel-test",
        url: "http://localhost:3000"
    });
    
    loginTest.addStep("Page should show Hello World");
        //.check("Can see dashboard")
        // .data({ username: "test@magnitude.run" })
        // .secureData({ password: "test" })

    await loginTest.run().show();
}

// async function main() {
//     const loginTest = new TestCase({
//         id: "login-test", // any ID you want
//         name: "Basic Login Test", // friendly name
//         url: "https://qa-bench.com" // target site url
//     });
    
//     loginTest.addStep("Login to the app")
//         .check("Can see dashboard") // natural language assertion
//         .data({ username: "test@magnitude.run" }) // plaintext data
//         .secureData({ password: "test" }) // encrypted data
//         // .data({ username: process.env.TEST_USER_EMAIL! }) // plaintext data
//         // .secureData({ password: process.env.TEST_USER_PASSWORD! }) // encrypted data
    
//     //console.log(loginTest);

//     // const result = await loginTest.run();
//     await loginTest.run().show();
    
//     // start the test case!
//     // await loginTest.run()
//     //     .onProblem(problem => console.log("Got a problem!", problem))
//     //     .onProgress(run => console.log("Run progress:", run));
// }

main();
// console.log(chalk.hex('#ff0000')("Critical")); // Custom hex red for critical
// console.log(chalk.hex('#FF4040')("High"));     // Hex bright red for high
// console.log(chalk.hex('#FF0000')("Medium"));   // Hex standard red for medium
// console.log(chalk.hex('#FFFF00')("Low"));

// Critical - Bright Red
// console.log(chalk.hex('#FF0000')("Critical"));

// // High - Orange Red
// console.log(chalk.hex('#FF4500')("High"));

// // Medium - Orange
// console.log(chalk.hex('#FFA500')("Medium"));

// // Low - Yellow
// console.log(chalk.hex('#FFFF00')("Low"));