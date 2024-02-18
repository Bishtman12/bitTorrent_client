class Queue {

    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    enqueueFront(element) {
        this.items.unshift(element);
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

module.exports = Queue