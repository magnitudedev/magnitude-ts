import { test, expect, type Page } from '@playwright/test';
import { TestCase } from '../../../dist/index.cjs';

test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
});

const TODO_ITEMS = [
    'buy some cheese',
    'feed the cat',
    'book a doctors appointment'
] as const;

test.describe('Playwright Todo Tests', () => {
    test('should allow me to add todo items', async ({ page }) => {
        // create a new todo locator
        const newTodo = page.getByPlaceholder('What needs to be done?');

        // Create 1st todo.
        await newTodo.fill(TODO_ITEMS[0]);
        await newTodo.press('Enter');

        // Make sure the list only has one todo item.
        await expect(page.getByTestId('todo-title')).toHaveText([
            TODO_ITEMS[0]
        ]);

        // Create 2nd todo.
        await newTodo.fill(TODO_ITEMS[1]);
        await newTodo.press('Enter');

        // Make sure the list now has two todo items.
        await expect(page.getByTestId('todo-title')).toHaveText([
            TODO_ITEMS[0],
            TODO_ITEMS[1]
        ]);
    });

    test('should allow me to mark items as completed', async ({ page }) => {

        const newTodo = page.getByPlaceholder('What needs to be done?');

        for (const item of TODO_ITEMS) {
            await newTodo.fill(item);
            await newTodo.press('Enter');
        }

        // Complete all todos.
        const toggles = page.getByRole('checkbox', { name: 'Toggle Todo' });
        const count = await toggles.count();
        
        for (let i = 0; i < count; i++) {
            await toggles.nth(i).check();
        }

        // Ensure all todos have 'completed' class.
        await expect(page.getByTestId('todo-item')).toHaveClass(['completed', 'completed', 'completed']);
    })
});


test.describe('Magnitude Todo Tests', () => {
    // The same tests using Magnitude instead
    test('should allow me to add todo items', async () => {
        const addTodoTest = new TestCase({
            id: 'add-todo',
            url: 'https://demo.playwright.dev/todomvc'
        });

        // No locators needed :)
        addTodoTest.addStep("Create a todo")
            .data(TODO_ITEMS[0])
            .check("Todo is added");
        
        addTodoTest.addStep("Create another todo")
            .data(TODO_ITEMS[1])
            .check("There should be 2 todos");
        
        await addTodoTest.run();
    });

    test('should allow me to mark items as completed', async () => {
        const markItems = new TestCase({
            id: 'mark-all',
            url: 'https://demo.playwright.dev/todomvc'
        });

        markItems.addStep("Add 3 todos")
            .data(TODO_ITEMS.join("\n"));

        markItems.addStep("Mark each item as complete")
            .check("All items are marked complete");
        
        await markItems.run();
    });
});