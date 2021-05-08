import Todo from './todo';
import {config} from '../config';

export default class TodoList {
    constructor() {
        this.todos = [];
    }

    get todoList() {
        return this.todos;
    }

    async todoFromServer() {
        let todolst = await fetch(`http://${config.development.host}:${config.development.port}/todos`)
            .then(response => response.json())
            .catch(error => console.error('Error:', error));
        // todolst.todos.sort((a,b) => {
        //     if (a.position < b.position) return -1;
        //     if (a.position > b.position) return 1;
        //     return 0;
        //     });
        todolst.todos.forEach(todo => {
            this.todos.push(new Todo(todo));
        });
    }

    async addTodo(todo) {
        await fetch(`http://${config.development.host}:${config.development.port}/todos`, {
            method: 'POST',
            body: JSON.stringify(todo),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.text())
        .catch(error => console.error('Error:', error));
        this.todos.push(todo);
    }

    async removeTodo(id) {
        let todoIdx = this.todos.findIndex(t => t.id === id);
        if (todoIdx === -1) {
            console.log('Nothing to remove!');
            return;
        }

        await fetch(`http://${config.development.host}:${config.development.port}/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.text())
        .catch(error => console.error('Error:', error));;
 
        let todo = this.todos[todoIdx];
        this.todos = [...this.todos.slice(0, todoIdx), ...this.todos.slice(todoIdx + 1)];
        return todo;
    }

    async toggleAll(bool) {
        await fetch(`http://${config.development.host}:${config.development.port}/todos`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([bool])
            })
            .then(response => response.text())
            .catch(error => console.error('Error:', error));
        
        if (bool) {
            for (let todo of this.todos) {
                todo.markDone();
            }
        } else {
            for (let todo of this.todos) {
                todo.markNotDone();
            }
        }
    }

    async removeCopleted() {
        let idstodos = [];
        for (let todo of this.getCompletedTodo()) {
            idstodos.push(todo.getTodoItem('id'));  
        }
        await fetch(`http://${config.development.host}:${config.development.port}/todos`, {
            method: 'DELETE',
            body: JSON.stringify(idstodos),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.text())
        .catch(error => console.error('Error:', error));
        this.todos = this.getActiveTodo();
    }

    async toggleTodo(id) {
        let todoIdx = this.todos.findIndex(t => t.id === id);
        await fetch(`http://${config.development.host}:${config.development.port}/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => response.text())
            .catch(error => console.error('Error:', error));
        
        if (this.todos[todoIdx].isDone) {
            this.todos[todoIdx].markNotDone();
        } else {
            this.todos[todoIdx].markDone();
        }
    }

    filterTodos(filter) {
        if (filter === 'active') {
          return this.getActiveTodo();
        }
        if (filter === 'completed') {
          return this.getCompletedTodo();
        }
        return this.todoList;
    }
    
    getCompletedTodo() {
        return this.todoList.filter((todo) => todo.isDone === true);
    }
    
    getActiveTodo() {
        return this.todoList.filter((todo) => todo.isDone === false);
    }

    async updateList(currentTodoId, prevTodoId, nextTodoId) {
        let newPos;
        let currentTodoIdx = this.todos.findIndex(t => t.id === currentTodoId);
        if (prevTodoId) {
            let prevTodoIdx = this.todos.findIndex(t => t.id === prevTodoId);
            let posPrev = this.todos[prevTodoIdx].getTodoItem('position');
            newPos = posPrev + posPrev.substring((posPrev.length / 2), (posPrev.length / 2 + 1));
            this.todos[currentTodoIdx].updatePosition(newPos);
        } else if (!prevTodoId) {
            let nextTodoIdx = this.todos.findIndex(t => t.id === nextTodoId);
            let posNext = this.todos[nextTodoIdx].getTodoItem('position');
            newPos = posNext.substring(0, posNext.length - 1);
        }
        
        await fetch(`http://${config.development.host}:${config.development.port}/todos/dnd/${currentTodoId}`, {
            method: 'PUT',
            headers: {
                    'Content-Type': 'application/json'
            },
            body: JSON.stringify([newPos])
        }).then(response => response.text())
        .catch(error => console.error('Error:', error));
    }
}