import { test } from 'magnitude-ts';

// // error thrown properly
// test('giraffe').step('giraffe is visible')
// test('bar').step("login visible")

// error thrown IMPROPERLY (2 workers)
// test('bar').step("login visible")
// test('giraffe').step('giraffe is visible')
// test('bar').step("login visible")

// // If we reduce to 1 worker, error throws properly again
// test('bar').step("login visible")
// test('giraffe').step('giraffe is visible')
// test('bar').step("login visible")