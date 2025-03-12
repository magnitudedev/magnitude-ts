import { test } from 'magnitude-ts';

test('can add a todo')
    .step('Enter and add a todo')
        .data('take out the trash')
        .check('Todo appears')
