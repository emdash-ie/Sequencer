/**
 * A min heap.
 *
 * Enables quick (constant-time) access to the minimum value it contains,
 * as well as logarithmic-time addition of new elements and removal of
 * minimum elements.
 *
 * @typedef {Object} MinHeap
 * @property {function} add – Adds a new element.
 * @property {function} removeMin – Removes and returns the minimum element.
 * @property {function} min – Returns the minimum element (without removing it).
 * @property {function} size – Reports the number of elements in the heap.
 * @property {function} isEmpty – Reports whether the heap is empty.
 */
let MinHeap = {
    /** Creates the tree structure of the heap. */
    createTree: function(elements) {
       this.tree = [];
    },
    /** Adds a new element to the heap. */
    add: function(element) {
        this.tree.push(element);
        this.bubbleUp(this.tree.length - 1);
    },
    /** Removes the minimum element from the heap and returns it. */
    removeMin: function() {
        this.swapElements(0, this.tree.length - 1);
        minElement = this.tree.pop();
        this.bubbleDown(0);
        return minElement;
    },
    /** Returns the minimum element in the heap (without removing it). */
    min: function() {
        return this.tree[0];
    },
    /** Returns the number of elements in the heap. */
    size: function() {
        return this.tree.length;
    },
    /** Returns true if the heap is empty, and false otherwise. */
    isEmpty: function() {
        return this.size() === 0;
    },
    toString: function() {
        return '[' + this.tree.join(', ') + ']';
    },
    /**
     * Restructures the heap to preserve its heap property, working up from
     * the given index.
     *
     * @private
     * @param childIndex The index to start bubbling up from.
     */
    bubbleUp: function(childIndex) {
        parentIndex = this.parentIndex(childIndex);

        if (this.tree[childIndex] < this.tree[parentIndex]) {
            this.swapElements(childIndex, parentIndex);
            this.bubbleUp(parentIndex);
        }
    },
    /**
     * Restructures the heap to preserve its heap property, working down from
     * the given index.
     *
     * @private
     * @param parentIndex The index to start bubbling down from.
     */
    bubbleDown: function(parentIndex) {
        leftChildIndex = this.leftChildIndex(parentIndex);
        rightChildIndex = this.rightChildIndex(parentIndex);
        leftChild = this.tree[leftChildIndex] || Infinity;
        rightChild = this.tree[rightChildIndex] || Infinity;

        if (leftChild < rightChild) {
            minChildIndex = leftChildIndex;
        } else {
            minChildIndex = rightChildIndex;
        }

        if (this.tree[minChildIndex] < this.tree[parentIndex]) {
            this.swapElements(minChildIndex, parentIndex);
            this.bubbleDown(minChildIndex);
        }
    },
    /**
     * Calculates the right child index for a given index.
     *
     * @private
     * @param parentIndex The index of the node whose right child should be
     * found.
     * @returns {number} The index of the given node's right child.
     */
    leftChildIndex: function(parentIndex) {
        return (parentIndex * 2) + 1;
    },
    /**
     * Calculates the left child index for a given index.
     *
     * @private
     * @param parentIndex The index of the node whose left child should be
     * found.
     * @returns {number} The index of the given node's left child.
     */
    rightChildIndex: function(parentIndex) {
        return (parentIndex * 2) + 2;
    },
    /**
     * Calculates the parent index for a given index.
     *
     * @private
     * @param childIndex The index of the node whose parent should be found.
     * @returns {number} The index of the given node's parent.
     */
    parentIndex: function(childIndex) {
        return Math.trunc((childIndex - 1) / 2);
    },
    /**
     * Swaps two elements within the heap.
     *
     * @private
     * @param firstIndex The array index of the first element to swap.
     * @param secondIndex The array index of the second element to swap.
     */
    swapElements: function(firstIndex, secondIndex) {
        let swap = this.tree[firstIndex];
        this.tree[firstIndex] = this.tree[secondIndex];
        this.tree[secondIndex] = swap;
    }
};

/**
 * Returns a random integer between min (inclusive) and max (exclusive).
 */
function randomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Generates a sequence of random integers.
 *
 * @param length The number of random integers to generate.
 * @param min The lower limit for the random integers.
 * @param max The upper limit for the random integers.
 * @yields {number} A random integer between min (inclusive) and max
 * (exclusive).
 */
function* randomIntegerGenerator(length, min, max) {
    for (let i = 1; i <= length; i++) {
        yield randomInteger(min, max);
    }
}

/**
 * Tests the min heap.
 *
 * <p>Fills it with random numbers and then empties it, checking that
 * the numbers are removed in non-descending order.
 *
 * @param min The lower limit to use for generating the random numbers.
 * @param max The upper limit to use for generating the random numbers.
 * @param length The number of random numbers to generate.
 * @return {boolean} true if the heap passes the test, false otherwise
 */
function testMinHeap(length = 10, min = 0, max = 100) {
    let testHeap = Object.create(MinHeap);
    testHeap.createTree();
    for (let number of randomIntegerGenerator(length, min, max)) {
        testHeap.add(number);
    }

    let lastValue;

    while (!testHeap.isEmpty()) {
        let thisValue = testHeap.removeMin();
        if (lastValue !== undefined && thisValue < lastValue) {
            return false;
        }
        lastValue = thisValue
    }

    return true;
}