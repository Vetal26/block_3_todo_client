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
        todolst.todos.forEach(todo => {
            this.todos.push(new Todo(todo));
        });
        console.log(this.todos)
    }

    async addTodo(todo) {
        if (this.todoList.length >= 1) {
            let posLastTodo = this.todoList[this.todoList.length - 1].getTodoItem('position');
            if (posLastTodo > todo.getTodoItem('position')) {
                let newPosTodo = posLastTodo + Math.random().toString(36).slice(-1);
                todo.updatePosition(newPosTodo);
            }
        }

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
        let todoIdx = getIdxTodo(id);
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
        let idsTodos = [];
        for (let todo of this.getCompletedTodo()) {
            idsTodos.push(todo.getTodoItem('id'));  
        }
        await fetch(`http://${config.development.host}:${config.development.port}/todos`, {
            method: 'DELETE',
            body: JSON.stringify(idsTodos),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.text())
        .catch(error => console.error('Error:', error));
        this.todos = this.getActiveTodo();
    }

    async toggleTodo(id) {
        let todoIdx = getIdxTodo(id);
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

    getIdxTodo(id) {
        return this.todos.findIndex(t => t.id === id)
    }

    isTodo(id) {
        if (!id) return null;
        return this.todos[this.getIdxTodo(id)].getTodoItem('position');
    }

    async updateList(prevTodoId, currentTodoId, nextTodoId) {
        let prevTodoPosition = this.isTodo(prevTodoId);
        let nextTodoPosition = this.isTodo(nextTodoId);
        let todosPosition = [prevTodoPosition, nextTodoPosition]

        await fetch(`http://${config.development.host}:${config.development.port}/dnd/${currentTodoId}`, {
            method: 'PUT',
            headers: {
                    'Content-Type': 'application/json'
            },
            body: JSON.stringify(todosPosition)
        }).then(response => response.text())
        .catch(error => console.error('Error:', error));
    }
}