// import { test } from 'magnitude-ts';

// // test.config({
// //     apiKey: "foo",
// //     url: 'https://qa-bench.com'
// // })

// test('foo', { url: 'https://qa-bench.com' })
//     .step("login visible")
//     // .step("Log in to the app")
//     //     .data({ email: 'test-user@magnitude.run' })
//     //     .secureData({ password: 'test' })
//     //     .check('dashboard is visible');

// test.group('Company Management', () => {
//     test('login')
//         .step("Log in to the app")
//             .data({ email: 'test-user@magnitude.run' })
//             .secureData({ password: 'test' })
//             .check('dashboard is visible');
    
//     test('bar')
//         .step("login visible")
    
//     test('baz')
//         .step("login visible")
//     // test('foo')
//     //     .step("Log in to the app")
//     //         .data({ email: 'test-user@magnitude.run' })
//     //         .secureData({ password: 'test' })
//     //         .check('dashboard is visible');
    
//     // test('bar')
//     //     .step("Log in to the app")
//     //         .data({ email: 'test-user@magnitude.run' })
//     //         .secureData({ password: 'test' })
//     //         .check('dashboard is visible');
    
//     test('company-create', { url: `https://qa-bench.com?bugs=["companies.create.failSilently"]` })
//         .step("Login to the app")
//             .check("Can see dashboard")
//             .data({ username: "test-user@magnitude.run" })
//             .secureData({ password: "test" })
//         .step("Create a new company")
//             .data("Make up the first 2 values and use defaults for the rest")
//             .check("Company added successfully");
    
//     // test('company-create', { url: `https://qa-bench.com?bugs=["companies.create.failSilently"]` }, ()=>{
//     //     test.step("Login to the app")
//     //         .check("Can see dashboard")
//     //         .data({ username: "test-user@magnitude.run" })
//     //         .secureData({ password: "test" });
//     //     test.step("Create a new company")
//     //         .data("Make up the first 2 values and use defaults for the rest")
//     //         .check("Company added successfully");
//     // });
    
//     // test('create-company')
//     //     .step('foo')
//     //         .check('as')
//     //     .step('a')
//     //         .data('a');
    

            
// });
