import { test } from 'magnitude-ts';

test('login')
    .step("Log in to the app")
        .data({ email: 'test-user@magnitude.run' })
        .secureData({ password: 'test' })
        .check('dashboard is visible');

test.group('Company Management', { url: 'https://qa-bench.com' }, () => {
    // Adding a bug, should show a problem
    test('company-create', { url: `https://qa-bench.com?bugs=["companies.create.failSilently"]` })
        .step("Login to the app")
            .check("Can see dashboard")
            .data({ username: "test-user@magnitude.run" })
            .secureData({ password: "test" })
        .step("Create a new company")
            .data("Make up the first 2 values and use defaults for the rest")
            .check("Company added successfully");  
});
