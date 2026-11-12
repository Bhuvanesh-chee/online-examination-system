import { randomInt } from "node:crypto";

export const SUBJECTS = ["java", "dsa", "frontend"] as const;
export type GeneratorSubject = (typeof SUBJECTS)[number];
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type GeneratorDifficulty = (typeof DIFFICULTIES)[number];
export const OPTION_IDS = ["a", "b", "c", "d"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export const SUBJECT_LABELS: Record<GeneratorSubject, string> = {
  java: "Java Programming",
  dsa: "Data Structures & Algorithms",
  frontend: "Frontend Development",
};

export const DEMO_TOPICS: Record<GeneratorSubject, string[]> = {
  java: ["Fundamentals", "Data Types", "Loops", "OOP", "Collections", "Exceptions", "Strings", "Arrays"],
  dsa: ["Arrays", "Linked Lists", "Stacks & Queues", "Trees", "Graphs", "Sorting", "Dynamic Programming", "Complexity"],
  frontend: ["HTML", "CSS", "JavaScript", "React", "Accessibility", "Responsive Design", "Browser APIs", "Performance"],
};

export interface GeneratedQuestion {
  topic: string;
  difficulty: GeneratorDifficulty;
  questionText: string;
  options: { id: OptionId; text: string }[];
  correctOption: OptionId;
  explanation: string;
  marks: number;
  negativeMarks: number;
}

type DemoSeed = {
  subject: GeneratorSubject;
  topic: string;
  difficulty: GeneratorDifficulty;
  prompt: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
};

function item(
  subject: GeneratorSubject, topic: string, difficulty: GeneratorDifficulty,
  prompt: string, choices: DemoSeed["choices"], answer: DemoSeed["answer"], explanation: string
): DemoSeed {
  return { subject, topic, difficulty, prompt, choices, answer, explanation };
}

/** Human-reviewed offline examples. These are clearly labelled demo mode, not AI output. */
const DEMO_QUESTIONS: DemoSeed[] = [
  // JAVA · Fundamentals
  item("java", "Fundamentals", "easy", "Which component executes compiled Java bytecode?", ["JVM", "JDK compiler", "Browser DOM", "SQL engine"], 0, "The Java Virtual Machine loads and executes platform-neutral .class bytecode."),
  item("java", "Fundamentals", "medium", "What does the Java Development Kit (JDK) include that the runtime alone does not?", ["Only the garbage collector", "Compiler and development tools", "Only the class loader", "A web browser"], 1, "The JDK contains the runtime plus developer tools such as javac, javadoc and jar."),
  item("java", "Fundamentals", "hard", "During class loading, which step runs static initializers and initializes static fields?", ["Loading", "Verification", "Initialization", "Preparation"], 2, "The initialization phase executes class initialization methods and static field initializers."),
  // JAVA · Data Types
  item("java", "Data Types", "easy", "How many bits does a Java int always use?", ["16", "32", "64", "Platform dependent"], 1, "The Java Language Specification fixes int at 32 bits on every supported platform."),
  item("java", "Data Types", "medium", "Which conversion is an implicit widening primitive conversion in Java?", ["double to int", "long to byte", "byte to int", "int to char"], 2, "A byte is widened to int automatically without an explicit cast."),
  item("java", "Data Types", "hard", "For Integer a = 127, b = 127; and Integer c = 128, d = 128;, which is normally true using ==?", ["Both a == b and c == d", "Only a == b", "Only c == d", "Neither expression"], 1, "Boxed Integer values from -128 to 127 are cached by default; 128 normally creates separate objects. Prefer equals() for value comparison."),
  // JAVA · Loops
  item("java", "Loops", "easy", "How many iterations does for (int i = 0; i < 5; i++) execute?", ["4", "5", "6", "Infinitely many"], 1, "The loop runs with i equal to 0, 1, 2, 3 and 4: five iterations."),
  item("java", "Loops", "medium", "What does continue do inside a Java for loop?", ["Terminates the loop", "Skips the remaining body and continues to the next iteration", "Restarts the program", "Throws an exception"], 1, "continue skips the current iteration; the loop update and condition run before the next iteration."),
  item("java", "Loops", "hard", "What is the effect of break outer; inside a nested loop labelled outer?", ["Exits only the innermost loop", "Exits the labelled outer loop", "Skips one iteration of the outer loop", "Compilation fails"], 1, "A labelled break exits the specifically named enclosing loop, not just the inner loop."),
  // JAVA · OOP
  item("java", "OOP", "easy", "Which is NOT one of the four pillars of object-oriented programming?", ["Inheritance", "Encapsulation", "Compilation", "Polymorphism"], 2, "The four pillars are abstraction, encapsulation, inheritance and polymorphism."),
  item("java", "OOP", "medium", "Method overriding demonstrates which kind of polymorphism?", ["Compile-time", "Runtime", "Parametric only", "Operator-based"], 1, "The overridden method is selected at runtime according to the actual object type."),
  item("java", "OOP", "hard", "What happens if a subclass tries to override a final instance method?", ["It overrides normally", "The method becomes static", "A compilation error occurs", "The JVM chooses both implementations"], 2, "A final method cannot be overridden; the compiler rejects the subclass declaration."),
  // JAVA · Collections
  item("java", "Collections", "easy", "Which collection interface does not permit duplicate elements?", ["List", "Set", "Queue", "Map values"], 1, "Set enforces uniqueness as determined by equality and hashing/comparison."),
  item("java", "Collections", "medium", "What is the time complexity of ArrayList.get(index)?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "ArrayList stores elements in an array and performs constant-time indexed access."),
  item("java", "Collections", "hard", "How many null keys can java.util.HashMap contain?", ["None", "Exactly one", "Unlimited", "One per bucket"], 1, "HashMap allows a single null key because keys must be unique, and multiple null values."),
  // JAVA · Exceptions
  item("java", "Exceptions", "easy", "Which block normally executes after try/catch whether an exception occurs or not?", ["throw", "finally", "extends", "assert"], 1, "The finally block runs on normal or exceptional completion (except abrupt JVM termination)."),
  item("java", "Exceptions", "medium", "Which of these is a checked exception?", ["NullPointerException", "IllegalArgumentException", "IOException", "ArithmeticException"], 2, "IOException extends Exception but not RuntimeException and must be handled or declared."),
  item("java", "Exceptions", "hard", "Which interface must a resource implement to work in try-with-resources?", ["Serializable", "Runnable", "AutoCloseable", "Cloneable"], 2, "A try-with-resources variable must implement AutoCloseable; close() runs automatically."),
  // JAVA · Strings
  item("java", "Strings", "easy", "Which method compares the character contents of two Java Strings?", ["==", "equals()", "hashCode()", "getClass()"], 1, "String.equals() compares characters, while == compares object references."),
  item("java", "Strings", "medium", "What happens when you concatenate to a String variable?", ["The original String object is mutated", "A new String value is created", "The JVM throws an error", "The variable becomes final"], 1, "Strings are immutable; concatenation creates a new value (possibly optimized by the compiler/JVM)."),
  item("java", "Strings", "hard", "Which mutable text class is generally preferred for repeated concatenation in one thread?", ["String", "StringBuilder", "Character", "StringTokenizer"], 1, "StringBuilder is mutable and efficient for repeated appends; unlike StringBuffer it is not synchronized."),
  // JAVA · Arrays
  item("java", "Arrays", "easy", "What is the index of the first element in a Java array?", ["-1", "0", "1", "It depends on the array size"], 1, "Java arrays use zero-based indexing."),
  item("java", "Arrays", "medium", "What is the default value of an element in new int[3]?", ["null", "0", "-1", "Undefined"], 1, "New int array elements are initialized to zero."),
  item("java", "Arrays", "hard", "Which prerequisite is needed for a meaningful Arrays.binarySearch(array, key) result?", ["The array is sorted with the same ordering", "The array contains unique items", "The array has an even number of items", "The array is an ArrayList"], 0, "Binary search requires the array to be sorted according to the same comparator/order."),

  // DSA · Arrays
  item("dsa", "Arrays", "easy", "What is the time complexity of accessing an array element by index?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Direct address computation makes indexed access constant time."),
  item("dsa", "Arrays", "medium", "What is the worst-case cost of inserting an item at the beginning of an n-element array?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 2, "Existing elements must be shifted right, requiring O(n) moves."),
  item("dsa", "Arrays", "hard", "What is the amortized cost of appending to a dynamic array that doubles capacity?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Rare O(n) resizes are spread across many constant-time appends, giving O(1) amortized cost."),
  // DSA · Linked Lists
  item("dsa", "Linked Lists", "easy", "What does a node in a singly linked list store besides its value?", ["A pointer to the next node", "An array index", "Two child nodes", "A hash table"], 0, "Each node stores its value and a reference to the next node (or null at the end)."),
  item("dsa", "Linked Lists", "medium", "Which technique finds the middle of a singly linked list in one traversal?", ["Binary search", "Slow and fast pointers", "Heap sort", "Hashing every node"], 1, "A slow pointer advances one node while a fast pointer advances two."),
  item("dsa", "Linked Lists", "hard", "How much auxiliary space is needed to reverse a singly linked list iteratively?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Three pointers (previous, current, next) suffice regardless of list length."),
  // DSA · Stacks & Queues
  item("dsa", "Stacks & Queues", "easy", "Which ordering does a stack follow?", ["FIFO", "LIFO", "Sorted order", "Random order"], 1, "The last item pushed onto a stack is the first popped (LIFO)."),
  item("dsa", "Stacks & Queues", "medium", "Which data structure is used to implement breadth-first search?", ["Stack", "Queue", "Binary search tree", "Heap only"], 1, "BFS explores nodes in discovery order using a FIFO queue."),
  item("dsa", "Stacks & Queues", "hard", "In an array-backed circular queue of capacity n, how is the rear position advanced?", ["rear + n", "(rear + 1) % n", "rear / n", "(rear - 1) % n"], 1, "Modulo n wraps the index back to zero when it reaches the array's end."),
  // DSA · Trees
  item("dsa", "Trees", "easy", "How many edges does a tree with n nodes contain?", ["n - 1", "n", "n + 1", "2n"], 0, "Every node except the root has exactly one incoming edge: n - 1 edges."),
  item("dsa", "Trees", "medium", "What is the search complexity of a height-balanced binary search tree?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 1, "A balanced BST has logarithmic height, so search follows at most O(log n) edges."),
  item("dsa", "Trees", "hard", "What balance factors are permitted at every node in an AVL tree?", ["Only 0", "-1, 0, or 1", "Any integer", "0 or 2"], 1, "AVL balance factor (left height minus right height) must be -1, 0 or 1."),
  // DSA · Graphs
  item("dsa", "Graphs", "easy", "Which data structure naturally implements depth-first graph traversal?", ["Stack", "Queue", "Sorted array", "Hash map only"], 0, "DFS uses an explicit stack or the call stack for recursion."),
  item("dsa", "Graphs", "medium", "Which algorithm finds shortest paths in an unweighted graph?", ["Depth-first search", "Breadth-first search", "Quick sort", "Binary search"], 1, "BFS visits vertices in increasing distance from the source in an unweighted graph."),
  item("dsa", "Graphs", "hard", "What edge-weight condition is required for standard Dijkstra's algorithm?", ["All weights are negative", "Weights are non-negative", "All weights are equal", "The graph is a tree"], 1, "Dijkstra's greedy relaxation assumes no negative-weight edge; Bellman-Ford handles negative edges."),
  // DSA · Sorting
  item("dsa", "Sorting", "easy", "What is the worst-case time complexity of bubble sort?", ["O(1)", "O(log n)", "O(n log n)", "O(n²)"], 3, "Bubble sort compares adjacent elements over up to n passes, yielding O(n²)."),
  item("dsa", "Sorting", "medium", "Which stable sorting algorithm guarantees O(n log n) worst-case time?", ["Quick sort", "Merge sort", "Selection sort", "Bubble sort"], 1, "Merge sort divides into halves and merges in linear time per level; stable merging preserves ties."),
  item("dsa", "Sorting", "hard", "With a consistently poor pivot, what is quicksort's worst-case complexity?", ["O(1)", "O(log n)", "O(n log n)", "O(n²)"], 3, "Severely unbalanced partitions lead to n recursive levels and O(n²) work."),
  // DSA · Dynamic Programming
  item("dsa", "Dynamic Programming", "easy", "Which property makes caching Fibonacci subproblems useful?", ["No repeated work", "Overlapping subproblems", "Already sorted data", "Unique graph paths"], 1, "Naive recursive Fibonacci repeatedly solves the same subproblems; memoization reuses results."),
  item("dsa", "Dynamic Programming", "medium", "What is top-down dynamic programming with a result cache called?", ["Memoization", "Selection sort", "Backtracking only", "Linear probing"], 0, "Memoization caches results from a recursive top-down solution."),
  item("dsa", "Dynamic Programming", "hard", "What is the usual tabulation time complexity for 0/1 knapsack with n items and capacity W?", ["O(n + W)", "O(nW)", "O(log n)", "O(2n)"], 1, "The standard DP fills n × W states; it is pseudo-polynomial in the numeric capacity W."),
  // DSA · Complexity
  item("dsa", "Complexity", "easy", "What is the time complexity of binary search on a sorted array?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 1, "Each comparison halves the remaining search range."),
  item("dsa", "Complexity", "medium", "Two independent nested loops each run n times. What is the total complexity?", ["O(1)", "O(n)", "O(n log n)", "O(n²)"], 3, "The inner loop runs n times for each of n outer iterations: n × n operations."),
  item("dsa", "Complexity", "hard", "What is the asymptotic solution of T(n) = 2T(n/2) + n?", ["O(log n)", "O(n)", "O(n log n)", "O(n²)"], 2, "By the Master theorem (or a recursion tree), each of log n levels costs O(n)."),

  // FRONTEND · HTML
  item("frontend", "HTML", "easy", "Which semantic element represents the main navigation links of a page?", ["<div>", "<nav>", "<span>", "<article>"], 1, "<nav> tells browsers and assistive technology that the region contains navigation."),
  item("frontend", "HTML", "medium", "How is a label explicitly associated with an HTML input?", ["Match label's for attribute to input's id", "Give both the same class", "Put the input after a paragraph", "Use a CSS selector"], 0, "A label's for attribute references the target input's id; clicking the label focuses the input."),
  item("frontend", "HTML", "hard", "When does an external script with defer execute?", ["Before HTML parsing starts", "After HTML parsing, before DOMContentLoaded, preserving order", "Only after all images load", "Immediately in the middle of parsing"], 1, "Deferred scripts download in parallel and execute after parsing, in document order, before DOMContentLoaded."),
  // FRONTEND · CSS
  item("frontend", "CSS", "easy", "Which CSS layout is designed primarily for one-dimensional rows or columns?", ["Flexbox", "Grid only", "Float", "Table layout"], 0, "Flexbox distributes items along one primary axis; CSS Grid handles two-dimensional layouts."),
  item("frontend", "CSS", "medium", "Which selector has higher specificity when all declarations have the same origin and importance?", ["Element selector", "Class selector", "ID selector", "Universal selector"], 2, "ID selectors outrank class and element selectors in normal specificity comparison."),
  item("frontend", "CSS", "hard", "What is required for position: sticky to stick vertically?", ["A specified top/bottom inset and suitable scroll container", "display: none", "position: absolute on its parent", "An SVG wrapper"], 0, "Sticky positioning requires an inset such as top: 0 and is constrained by its nearest scrolling ancestor."),
  // FRONTEND · JavaScript
  item("frontend", "JavaScript", "easy", "Which JavaScript operator compares both value and type without coercion?", ["==", "===", "=", "!==="], 1, "Strict equality === does not coerce operands to the same type."),
  item("frontend", "JavaScript", "medium", "What scope does a variable declared with let have?", ["Global scope only", "Function scope only", "Block scope", "No scope"], 2, "let and const are scoped to their enclosing block; var is function-scoped."),
  item("frontend", "JavaScript", "hard", "What does a JavaScript closure retain after its outer function returns?", ["A copy of the DOM", "Access to lexical bindings in its outer scope", "Only its own parameters", "Only global constants"], 1, "A closure retains access to the lexical environment where it was created, including mutable bindings."),
  // FRONTEND · React
  item("frontend", "React", "easy", "Which prop name attaches a click handler to a React JSX button?", ["onPress", "onClick", "on-click", "clickHandler"], 1, "React JSX uses camelCase event props such as onClick."),
  item("frontend", "React", "medium", "When the next state depends on the previous value, which React update is safest?", ["setCount(count + 1) twice", "setCount(prev => prev + 1)", "count++", "setState(undefined)"], 1, "Functional state updates receive the latest prior state, even when React batches renders."),
  item("frontend", "React", "hard", "Why are stable keys important when rendering a reorderable React list?", ["They improve CSS specificity", "They preserve element identity and state during reconciliation", "They replace the need for state", "They make data fetching synchronous"], 1, "Keys help React match elements across renders; unstable index keys can attach state to the wrong row."),
  // FRONTEND · Accessibility
  item("frontend", "Accessibility", "easy", "What does meaningful alt text provide for an informative image?", ["Visual styling", "An equivalent description for screen readers", "Faster network loading", "An animation"], 1, "Alternative text communicates the image's purpose or content when it cannot be seen."),
  item("frontend", "Accessibility", "medium", "Which element should you use for an action that works with keyboard and pointer?", ["<div> with only onClick", "<span> with CSS cursor", "<button>", "<br>"], 2, "Native buttons support focus, Enter/Space activation and accessible roles without extra code."),
  item("frontend", "Accessibility", "hard", "What does aria-live='polite' do for dynamically updated text?", ["Hides it from screen readers", "Announces updates when the assistive technology is idle", "Changes its CSS display", "Forces an immediate page reload"], 1, "Polite live regions announce changes at the next convenient pause without interrupting current speech."),
  // FRONTEND · Responsive Design
  item("frontend", "Responsive Design", "easy", "What CSS feature adapts styles to different viewport sizes?", ["Media queries", "Cookies", "SQL queries", "Service workers"], 0, "Media queries apply CSS rules based on viewport width, orientation and other media features."),
  item("frontend", "Responsive Design", "medium", "Which viewport meta tag makes a mobile page use the device width?", ["<meta name='viewport' content='width=device-width, initial-scale=1'>", "<meta charset='UTF-8'>", "<meta name='robots' content='index'>", "<meta http-equiv='refresh'>"], 0, "The viewport meta tag avoids the default wide virtual layout on mobile browsers."),
  item("frontend", "Responsive Design", "hard", "In CSS Grid, why can minmax(0, 1fr) be useful for a flexible column?", ["It forces every column to 0px", "It allows the column to shrink below intrinsic content size", "It disables grid layout", "It makes the column fixed-width"], 1, "The zero minimum permits shrinking so long unbroken content is less likely to force grid overflow."),
  // FRONTEND · Browser APIs
  item("frontend", "Browser APIs", "easy", "Which browser storage usually survives closing and reopening the tab?", ["sessionStorage", "localStorage", "A local variable", "The JavaScript call stack"], 1, "localStorage persists until explicitly cleared; sessionStorage is scoped to a tab session."),
  item("frontend", "Browser APIs", "medium", "Does fetch() reject its Promise automatically for HTTP 404 responses?", ["Yes, always", "No; check response.ok or response.status", "Only for JSON", "Only on mobile"], 1, "fetch rejects on network failures, but HTTP 4xx/5xx normally resolve; inspect response.ok."),
  item("frontend", "Browser APIs", "hard", "Which Web API lets you cancel an in-flight fetch request?", ["MutationObserver", "AbortController", "IntersectionObserver", "requestAnimationFrame"], 1, "Pass AbortController.signal to fetch, then call controller.abort() to cancel."),
  // FRONTEND · Performance
  item("frontend", "Performance", "easy", "What does lazy loading below-the-fold images reduce initially?", ["The number of CSS rules", "Unnecessary initial image network requests", "HTML semantics", "The number of users"], 1, "Lazy loading defers off-screen image downloads until they are near the viewport."),
  item("frontend", "Performance", "medium", "What is the main benefit of JavaScript code splitting?", ["More DOM nodes", "Smaller initial bundles by loading code when needed", "Disabling caching", "Removing all CSS"], 1, "Code splitting moves rarely used features into separate chunks, reducing the first-load JS payload."),
  item("frontend", "Performance", "hard", "How should an above-the-fold Largest Contentful Paint (LCP) hero image usually be prioritized?", ["Lazy-load it", "Give it an appropriate high loading priority", "Hide it until after all scripts", "Serve it only from localStorage"], 1, "An LCP image should be requested early (for example fetchpriority='high'); lazy loading delays it."),
];

const ALIASES: Record<GeneratorSubject, Record<string, string>> = {
  java: {
    "jvm": "Fundamentals", "jdk": "Fundamentals", "basics": "Fundamentals",
    "variables": "Data Types", "primitives": "Data Types", "operators": "Data Types",
    "for loop": "Loops", "while loop": "Loops", "iteration": "Loops",
    "inheritance": "OOP", "polymorphism": "OOP", "encapsulation": "OOP", "abstraction": "OOP", "object oriented programming": "OOP",
    "arraylist": "Collections", "hashmap": "Collections", "set": "Collections",
    "exception handling": "Exceptions", "try catch": "Exceptions", "try with resources": "Exceptions",
    "stringbuilder": "Strings", "string manipulation": "Strings", "array": "Arrays",
  },
  dsa: {
    "array": "Arrays", "linked list": "Linked Lists", "stack": "Stacks & Queues", "queue": "Stacks & Queues",
    "binary search tree": "Trees", "bst": "Trees", "avl": "Trees", "tree": "Trees",
    "graph": "Graphs", "bfs": "Graphs", "dfs": "Graphs", "dijkstra": "Graphs",
    "sorting algorithms": "Sorting", "merge sort": "Sorting", "quick sort": "Sorting",
    "dp": "Dynamic Programming", "knapsack": "Dynamic Programming", "memoization": "Dynamic Programming",
    "time complexity": "Complexity", "space complexity": "Complexity", "big o": "Complexity", "binary search": "Complexity",
  },
  frontend: {
    "html5": "HTML", "semantic html": "HTML", "forms": "HTML",
    "flexbox": "CSS", "grid": "CSS", "styling": "CSS",
    "js": "JavaScript", "closures": "JavaScript", "es6": "JavaScript",
    "react hooks": "React", "jsx": "React", "useeffect": "React", "usestate": "React",
    "a11y": "Accessibility", "aria": "Accessibility", "responsive": "Responsive Design", "mobile": "Responsive Design",
    "fetch": "Browser APIs", "localstorage": "Browser APIs", "web apis": "Browser APIs",
    "web performance": "Performance", "lcp": "Performance", "optimization": "Performance",
  },
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function resolveDemoTopic(subject: GeneratorSubject, enteredTopic: string): string | null {
  const normalized = normalize(enteredTopic);
  if (["", "mixed", "all", "general", "mixed topics", "sample pack"].includes(normalized)) return "Mixed topics";
  const exact = DEMO_TOPICS[subject].find((t) => normalize(t) === normalized);
  if (exact) return exact;
  const aliases = ALIASES[subject];
  if (aliases[normalized]) return aliases[normalized];
  // Match a longer phrase such as "Java inheritance and polymorphism".
  const matchingAlias = Object.keys(aliases).filter((alias) => normalized.includes(alias)).sort((a, b) => b.length - a.length)[0];
  if (matchingAlias) return aliases[matchingAlias];
  const matchingTopic = DEMO_TOPICS[subject].find((topic) => normalized.includes(normalize(topic)));
  return matchingTopic ?? null;
}

export function generateOfflineQuestions(
  subject: GeneratorSubject, enteredTopic: string, difficulty: GeneratorDifficulty, count: number
): { questions: GeneratedQuestion[]; resolvedTopic: string | null } {
  const resolvedTopic = resolveDemoTopic(subject, enteredTopic);
  if (!resolvedTopic) return { questions: [], resolvedTopic: null };
  const pool = DEMO_QUESTIONS.filter((candidate) =>
    candidate.subject === subject && candidate.difficulty === difficulty &&
    (resolvedTopic === "Mixed topics" || candidate.topic === resolvedTopic)
  );
  // Fisher-Yates: each mixed-topic sample pack is fresh and has no duplicates.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    resolvedTopic,
    questions: shuffled.slice(0, Math.min(count, pool.length)).map((seed) => ({
      topic: seed.topic,
      difficulty: seed.difficulty,
      questionText: seed.prompt,
      options: seed.choices.map((text, index) => ({ id: OPTION_IDS[index], text })),
      correctOption: OPTION_IDS[seed.answer],
      explanation: seed.explanation,
      marks: 1,
      negativeMarks: 0,
    })),
  };
}
