import { Todo } from './todo';

describe('Todo', () => {
  it('should create an instance', () => {
    expect(new Todo()).toBeTruthy();
  });

  it('should accept values in the constructor', () => {
    const todo = new Todo({
      title: 'hello'
    });
    expect(todo.title).toEqual('hello');
  });
});
