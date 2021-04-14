import TodoList from './models/todolist'; 
import Todo from './models/todo';

let list = new TodoList();
let filterTodo = 'all'; 
const TODO_ADD = document.getElementById('todo-add');
const FILTER = document.getElementById('filter');
const TODO_ALL_COMPLETED = document.getElementById('todo-all-completed');
const TODO_ALL_ACTIVE = document.getElementById('todo-all-active')
const TODOS_DESTROY = document.getElementById('todos-destroy');
const TODOS_LIST = document.getElementById('list');
const TODO_ADD_KEYDOWM = document.getElementById('todo-input');
let ul = document.querySelector('ul#list');

function addTodoFromInput() {
    let input = document.querySelector('#todo-input');
    if (!input || input.value.trim().length === 0) {
        return;
    }
    let todo = input.value.trim();
    todo = new Todo({title: todo})
    input.value = '';
    list.addTodo(todo);
    addNewItem(todo);
}

function handlerRemove(e) {
    let isDelete = confirm('Delete current Todo?')
    if (isDelete) {
        let elem = this.parentNode;
        list.removeTodo(+elem.getAttribute('id'));
        elem.remove();
    }
}

function render() {
    ul.innerHTML = '';
    list.filterTodos(filterTodo).forEach(todo => addNewItem(todo));
}

function addNewItem(todo) {
    let li = document.createElement('li');
    let btnDelete = document.createElement('button');
    let input = document.createElement('input');

    li.classList.add('list-group-item', 'draggable');
    input.type = 'checkbox';
    if (todo.getTodoItem('isDone')) {
        input.checked = true;
    }
    input.addEventListener('click', toggle);
    input.classList.add('status');
    btnDelete.classList.add('delete');
    btnDelete.addEventListener('click', handlerRemove)
    btnDelete.innerHTML = 'x'
    li.append(input, `${todo.title}`, btnDelete)
    li.id = todo.getTodoItem('id');
    ul.append(li);
}

function toggle(e) {
    list.toggleTodo(+this.parentNode.getAttribute('id'));
    if (this.checked && filterTodo === 'active') this.parentNode.remove();
    if (!this.checked && filterTodo === 'completed') this.parentNode.remove();
}

function toggleAlltodo(e) {
    let bool;
    if (this.id === 'todo-all-completed') bool = true;
    if (this.id === 'todo-all-active') bool = false;
    let elems = document.querySelectorAll('input.status');
    elems.forEach( elem => elem.checked = bool);
    list.toggleAll(bool);
}

function filterTodoList(e) {
    filterTodo = e.target.getAttribute('id');
    let btnActiveOld = document.querySelector('.active');
    btnActiveOld.classList.remove('active');
    let btnActive = document.getElementById(filterTodo);
    btnActive.classList.add('active');
    render();
}

function deleteCompleted() {
    let isDelete = confirm('Delete completed Todo(s)?')
    if (isDelete) {
        list.removeCopleted().then(() => render())
    }
}

function updateIndexTodo(currentElem, prevElem) {
    let currentTodoId = +currentElem.getAttribute('id');
    let prevTodoId = prevElem ? +prevElem.getAttribute('id') : null;
    list.updateList(currentTodoId, prevTodoId);
}

function initApp(){
    list.todoFromServer().then(() => render());
}

function dragAndDrop(e) {
    const listTodo = document.getElementById('list');
    if (e.target.type === 'checkbox' || e.target.type === 'button' || e.target.type === 'input' ) {
        return;
    }

    let draggingEle;
    let placeholder;
    let isDraggingStarted = false;
    let oldChek;
    let oldBtn;

    let x = 0;
    let y = 0;

    const swap = function(nodeA, nodeB) {
        const parentA = nodeA.parentNode;
        const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

        nodeB.parentNode.insertBefore(nodeA, nodeB);

        parentA.insertBefore(nodeB, siblingA);
    };

    const isAbove = function(nodeA, nodeB) {
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();

        return (rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2);
    };

    const mouseDownHandler = function(e) {
        e.stopPropagation();
        draggingEle = e.target;
        oldChek = draggingEle.querySelector('input');
        oldBtn = draggingEle.querySelector('button');
        draggingEle.removeChild(oldBtn);
        draggingEle.removeChild(oldChek);

        const rect = draggingEle.getBoundingClientRect();
        x = e.pageX - rect.left;
        y = e.pageY - rect.top;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function(e) {
        const draggingRect = draggingEle.getBoundingClientRect();

        if (!isDraggingStarted) {
            isDraggingStarted = true;
            
            placeholder = document.createElement('div');
            placeholder.classList.add('placeholder');
            draggingEle.parentNode.insertBefore(placeholder, draggingEle.nextSibling);
            placeholder.style.height = `${draggingRect.height}px`;
        }

        draggingEle.style.position = 'absolute';
        draggingEle.style.top = `${e.pageY - y}px`; 
        draggingEle.style.left = `${e.pageX - x}px`;

        const prevEle = draggingEle.previousElementSibling;
        const nextEle = placeholder.nextElementSibling;
        
        if (prevEle && isAbove(draggingEle, prevEle)) {
            swap(placeholder, draggingEle);
            swap(placeholder, prevEle);
            return;
        }
        if (nextEle && isAbove(nextEle, draggingEle)) {
            swap(nextEle, placeholder);
            swap(nextEle, draggingEle);
        }

        
    };

    const mouseUpHandler = function() {
        placeholder && placeholder.parentNode.removeChild(placeholder);

        draggingEle.style.removeProperty('top');
        draggingEle.style.removeProperty('left');
        draggingEle.style.removeProperty('position');



        const prevEle = draggingEle.previousElementSibling;
        draggingEle.prepend(oldChek);
        draggingEle.append(oldBtn);
        updateIndexTodo(draggingEle, prevEle);

        x = null;
        y = null;
        draggingEle = null;
        isDraggingStarted = false;

       
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    list.todos.slice.call(listTodo.querySelectorAll('.draggable')).forEach(function(item) {

        item.addEventListener('mousedown', mouseDownHandler);
    });
}

TODOS_LIST.addEventListener('click', dragAndDrop);
TODO_ADD.addEventListener('click', addTodoFromInput);
FILTER.addEventListener('click', filterTodoList);
TODO_ALL_COMPLETED.addEventListener('click', toggleAlltodo);
TODOS_DESTROY.addEventListener('click', deleteCompleted);
TODO_ALL_ACTIVE.addEventListener('click', toggleAlltodo);
TODO_ADD_KEYDOWM.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') {
        addTodoFromInput();
    }
})

initApp()