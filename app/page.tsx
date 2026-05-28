"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  deleteCloudPupilData,
  loadCloudProfileData,
  loadCloudPupilProfiles,
  saveCloudLessonProgress,
  saveCloudProfile,
} from "@/lib/cloudProgress";

type TermName = "Summer Term 1" | "Summer Term 2";
type PlatformName = "Scratch" | "MakeCode";

type Lesson = {
  id: number;
  week: number;
  term: TermName;
  platform: PlatformName;
  title: string;
  shortTitle: string;
  description: string;
  objective: string;
  overview: string;
  whyItMatters: string;
  retrievalQuestion: string;
  teachingPoints: string[];
  vocab: string[];
  guidedSteps: string[];
  practiceTask: string;
  challengeTask: string;
  keyQuestion: string;
  misconception: string;
  correctOutcome: string;
  wrongOutcome: string;
  projectLink: string;
};

type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
};

type QuizQuestionView = QuizQuestion & {
  originalOptionIndexes: number[];
};

type QuizResult = {
  submitted: boolean;
  score: number;
  answers: number[];
};

type ScreenshotMap = Record<number, string>;
type QuizOrderMap = Record<number, number[][]>;

type LearnerProfile = {
  className: string;
  studentName: string;
  storageKey: string;
  accessCode?: string;
};

type PupilExport = {
  app: "year8-computing";
  version: 1;
  exportedAt: string;
  profile: LearnerProfile;
  completedLessonIds: number[];
  quizResults: Record<number, QuizResult>;
  quizOrder: QuizOrderMap;
  screenshots: ScreenshotMap;
};

type StartMode = "existing" | "new";

const CLASS_OPTIONS = ["Year 8A", "Year 8B"];

const REGISTRY_KEY = "year8-pupil-registry";
const CURRENT_PROFILE_KEY = "year8-current-profile";
const DEFAULT_ACCESS_CODE = "123456";

const pastel = {
  page: "#f8fafc",
  text: "#334155",
  title: "#1e293b",
  panel: "#ffffff",
  panelSoft: "#fdf2f8",
  panelBlue: "#eff6ff",
  panelMint: "#ecfeff",
  panelLilac: "#f5f3ff",
  panelPeach: "#fff7ed",
  panelSky: "#f0f9ff",
  border: "#dbe4f0",
  accent: "#7c3aed",
  accentSoft: "#ede9fe",
  navy: "#334155",
  green: "#10b981",
  greenSoft: "#d1fae5",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  rose: "#f43f5e",
  roseSoft: "#fff1f2",
  blueSoft: "#dbeafe",
  slateSoft: "#f8fafc",
  shadow: "0 10px 30px rgba(148, 163, 184, 0.14)",
};

const lessons: Lesson[] = [
{
    id: 1,
    week: 1,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Sequencing and Precision",
    shortTitle: "Exact Instructions",
    description: "Exploring how computers follow instructions precisely and why sequencing must be exact.",
    objective: "I can explain why computer instructions must be sequenced precisely.",
    overview: "In programming, sequence means the exact order in which instructions run. Computers do not infer meaning like humans do, so a vague or misordered instruction causes the wrong output.",
    whyItMatters: "Programming succeeds when instructions are clear, ordered, and unambiguous. Precision is the foundation of all later coding.",
    retrievalQuestion: "Think back to earlier programming work: what happens when steps are missing or in the wrong order?",
    teachingPoints: [
      "Computers follow instructions literally.",
      "Sequence means the exact order of commands.",
      "A small change in order can change the whole outcome.",
      "Programmers must remove ambiguity from instructions."
    ],
    vocab: [
      "sequence",
      "instruction",
      "algorithm",
      "precision",
      "order",
      "command"
    ],
    guidedSteps: [
      "Open Scratch and start a new project.",
      "Create a very short sequence that makes a sprite move, speak, and turn.",
      "Run the code and observe the order of actions.",
      "Swap two blocks and test again.",
      "Notice how the outcome changes when the order changes.",
      "Add another instruction and decide where it should go in the sequence.",
      "Test carefully and refine the order until it behaves as intended.",
      "Explain why your final sequence is the most accurate one."
    ],
    practiceTask: "Build a short Scratch sequence that makes a sprite complete three clear actions in the correct order.",
    challengeTask: "Create a sequence with at least five steps and then deliberately reorder one step to show how precision affects the result.",
    keyQuestion: "Why is precision essential when writing instructions for a computer?",
    misconception: "Computers do not guess what the programmer meant. They only follow the sequence they are given.",
    correctOutcome: "The project runs in a clear, intended order and the pupil can explain why the sequence works.",
    wrongOutcome: "The project runs, but the order is confused or the pupil cannot explain why each instruction is placed where it is.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 2,
    week: 2,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Variables and Program Flow",
    shortTitle: "Tracking Change",
    description: "Using variables to store changing values and tracing how they change through a program.",
    objective: "I can use and trace a variable as a program runs.",
    overview: "A variable stores data that may change while a program runs. In Scratch, variables allow programmers to track values such as score, timer, attempts, or level.",
    whyItMatters: "Variables make programs dynamic. Without them, a program cannot keep track of changing information.",
    retrievalQuestion: "What is sequence, and why does order still matter when a variable is involved?",
    teachingPoints: [
      "A variable stores a value with a name.",
      "The value can be set, changed, and checked.",
      "Tracing means following the value step by step.",
      "Program flow is easier to understand when variable values are tracked carefully."
    ],
    vocab: [
      "variable",
      "value",
      "trace",
      "flow",
      "store",
      "update"
    ],
    guidedSteps: [
      "Open Scratch and create a variable called counter.",
      "Add code to set counter to 0 when the green flag is clicked.",
      "Add actions that change counter by different amounts.",
      "Run the program and watch the variable monitor.",
      "Pause after each stage and record the value.",
      "Explain why the value changed at each point.",
      "Change one value in the code and predict the new outcome.",
      "Run again and compare your prediction with the result."
    ],
    practiceTask: "Create a short program with one variable that changes at least three times, then trace the value after each change.",
    challengeTask: "Use two variables in the same sequence and explain how both values change as the program runs.",
    keyQuestion: "How does tracing a variable help a programmer understand program flow?",
    misconception: "A variable is not just a label on the screen. It stores a value that can change during execution.",
    correctOutcome: "The pupil can trace the variable accurately and explain how the code changed its value.",
    wrongOutcome: "The value changes on screen, but the pupil cannot explain when or why those changes happened.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 3,
    week: 3,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Selection with If Statements",
    shortTitle: "True or False",
    description: "Controlling program flow using conditions and if statements.",
    objective: "I can use an if statement to make a program respond to a condition.",
    overview: "Selection allows a program to choose between different paths. An if statement checks whether a condition is true, and only then runs the code inside it.",
    whyItMatters: "Selection makes programs interactive and responsive rather than fixed and predictable.",
    retrievalQuestion: "How does a variable help a program keep track of information before a decision is made?",
    teachingPoints: [
      "Selection changes the path a program follows.",
      "Conditions evaluate as true or false.",
      "If statements run code only when the condition is true.",
      "Selection is often linked to variables, input, or scoring systems."
    ],
    vocab: [
      "selection",
      "condition",
      "if statement",
      "true",
      "false",
      "branch"
    ],
    guidedSteps: [
      "Open Scratch and add a simple variable or input trigger.",
      "Create an if statement using a clear condition.",
      "Place an action inside the if block such as saying a message.",
      "Run the program with the condition false and observe what happens.",
      "Now make the condition true and test again.",
      "Compare the two outcomes carefully.",
      "Edit the condition so it uses a different value or event.",
      "Retest and explain how selection controlled the program flow."
    ],
    practiceTask: "Build a Scratch script that uses an if statement to display a different response when a chosen condition is met.",
    challengeTask: "Create a short program with two separate if statements controlling different outcomes.",
    keyQuestion: "How does an if statement change the behaviour of a program?",
    misconception: "An if statement does not always run. It only runs when its condition is true.",
    correctOutcome: "The pupil creates a working if statement and explains why the action only happens in the correct circumstances.",
    wrongOutcome: "The action appears random because the condition is unclear or does not control the code properly.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 4,
    week: 4,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Operators and Complex Conditions",
    shortTitle: "Compare and Combine",
    description: "Using comparison and logical operators to build more precise decisions.",
    objective: "I can use comparison and logical operators to create complex conditions.",
    overview: "Operators allow programs to compare values and combine conditions. Comparison operators test values such as greater than, less than, or equal to. Logical operators such as AND, OR, and NOT make decisions more complex.",
    whyItMatters: "More advanced programs need more precise logic. Operators help programmers create sophisticated rules.",
    retrievalQuestion: "What does an if statement need in order to decide whether code should run?",
    teachingPoints: [
      "Comparison operators test relationships between values.",
      "Logical operators combine or reverse conditions.",
      "AND requires both conditions to be true.",
      "OR requires at least one condition to be true."
    ],
    vocab: [
      "operator",
      "comparison",
      "logical operator",
      "AND",
      "OR",
      "NOT"
    ],
    guidedSteps: [
      "Open Scratch and build a simple if statement.",
      "Add a comparison such as score > 5.",
      "Test what happens when the comparison is false and when it is true.",
      "Now combine two conditions with an AND block.",
      "Run the code and decide when both conditions are satisfied.",
      "Replace AND with OR and compare the difference.",
      "Try a NOT block to reverse a condition.",
      "Explain which operator is most suitable for your final logic."
    ],
    practiceTask: "Create a Scratch condition using a comparison operator and test it with different values.",
    challengeTask: "Build a complex condition using AND or OR and justify why that operator is the right choice.",
    keyQuestion: "Why do programmers need operators to make decisions more precise?",
    misconception: "AND and OR do not mean the same thing. They produce different results and must be chosen carefully.",
    correctOutcome: "The pupil creates and tests a complex condition accurately and can justify the logic used.",
    wrongOutcome: "The pupil combines conditions, but the logic does not match the intended rule or cannot be explained.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 5,
    week: 5,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Iteration and Count-Controlled Loops",
    shortTitle: "Repeat Efficiently",
    description: "Using loops to repeat instructions efficiently and avoid unnecessary repetition.",
    objective: "I can use count-controlled iteration to make a program more efficient.",
    overview: "Iteration repeats instructions. A count-controlled loop repeats a known number of times, making code shorter, clearer, and easier to maintain.",
    whyItMatters: "Loops reduce repetition and help programmers write efficient, readable code.",
    retrievalQuestion: "How might a loop improve a sequence that currently repeats similar instructions many times?",
    teachingPoints: [
      "Iteration means repetition in code.",
      "A count-controlled loop repeats a fixed number of times.",
      "Loops make code more efficient and easier to edit.",
      "The same outcome can often be achieved with fewer blocks using iteration."
    ],
    vocab: [
      "iteration",
      "loop",
      "repeat",
      "count-controlled",
      "efficient",
      "pattern"
    ],
    guidedSteps: [
      "Open Scratch and create a repeated movement pattern manually.",
      "Count how many times the pattern repeats.",
      "Replace the repeated blocks with a repeat block.",
      "Put the repeated actions inside the loop.",
      "Run the project and compare the result with the original version.",
      "Change the repeat number and observe the effect.",
      "Decide which version is easier to maintain and why.",
      "Explain how iteration improved the code."
    ],
    practiceTask: "Use a repeat block to recreate a pattern that would otherwise need several repeated instructions.",
    challengeTask: "Build a loop-based animation or movement pattern and explain why iteration is more efficient than copying blocks.",
    keyQuestion: "How does iteration improve the efficiency of a program?",
    misconception: "Using a loop does not make code more random. It makes repeated behaviour more controlled and efficient.",
    correctOutcome: "The pupil uses a repeat loop correctly and explains why it is better than copying the same instructions multiple times.",
    wrongOutcome: "The project repeats actions, but the loop is used incorrectly or the efficiency gain cannot be explained.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 6,
    week: 6,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Combining Constructs for Problem Solving",
    shortTitle: "Build with Logic",
    description: "Combining sequence, variables, selection, and iteration to solve structured programming problems.",
    objective: "I can combine multiple programming constructs to solve a problem.",
    overview: "Real programs rarely rely on one construct alone. Strong programmers combine sequence, variables, selection, and iteration to create effective solutions.",
    whyItMatters: "Programming is problem solving. The skill lies in choosing and combining the right constructs for the task.",
    retrievalQuestion: "Which construct would be most useful for repetition, and which would be most useful for decision-making?",
    teachingPoints: [
      "Different problems need different combinations of constructs.",
      "Variables track data, selection controls decisions, and iteration handles repetition.",
      "Debugging is easier when the logic of the solution is planned first.",
      "A program can often be improved by simplifying its structure."
    ],
    vocab: [
      "construct",
      "problem solving",
      "logic",
      "debug",
      "solution",
      "structure"
    ],
    guidedSteps: [
      "Read a short programming problem or challenge.",
      "Identify which parts need sequence, variables, selection, or iteration.",
      "Plan the order of your solution before building.",
      "Create the program in Scratch one section at a time.",
      "Test each section after building it.",
      "Check whether the parts work together logically.",
      "Refine any part that is unclear or repetitive.",
      "Explain why you chose each construct in your solution."
    ],
    practiceTask: "Create a Scratch solution to a structured problem using at least three different programming constructs.",
    challengeTask: "Improve your program by simplifying the code, removing repetition, or making the logic more efficient.",
    keyQuestion: "How do programmers decide which constructs to combine when solving a problem?",
    misconception: "Programming is not just adding blocks until something works. A strong solution is planned, purposeful, and logical.",
    correctOutcome: "The pupil combines constructs coherently and can justify why each one was used.",
    wrongOutcome: "The project contains several constructs, but they do not work together logically or solve the intended problem.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 7,
    week: 7,
    term: "Summer Term 1",
    platform: "Scratch",
    title: "Assessment Project: Structured Scratch Build",
    shortTitle: "Independent Project",
    description: "Applying sequence, variables, selection, and iteration independently in a structured Scratch project.",
    objective: "I can independently design and build a Scratch project using the key constructs from this term.",
    overview: "This assessment project asks pupils to bring together the core ideas from the term in one coherent program. The focus is on quality of logic, independence, and control.",
    whyItMatters: "Assessment shows whether pupils can transfer learning into an independent programming task.",
    retrievalQuestion: "Which four constructs have been central to your programming work this term?",
    teachingPoints: [
      "A strong project has a clear purpose and structure.",
      "Core constructs should be used deliberately, not just included at random.",
      "Testing and refinement are part of independent programming.",
      "Evaluation matters as much as construction."
    ],
    vocab: [
      "independent",
      "assessment",
      "design",
      "refine",
      "evaluate",
      "purpose"
    ],
    guidedSteps: [
      "Choose or receive the project brief.",
      "Plan the purpose and main features of your project.",
      "Decide where sequence, variables, selection, and iteration will be used.",
      "Build the project step by step in Scratch.",
      "Test after each major section.",
      "Debug any issues methodically.",
      "Review whether the project meets the brief.",
      "Make final refinements and prepare to explain your code."
    ],
    practiceTask: "Build an assessment project that includes sequence, a variable, selection, and iteration.",
    challengeTask: "Add an extra feature that improves the user experience while keeping the logic clear and efficient.",
    keyQuestion: "What makes an independent project logically strong rather than just visually impressive?",
    misconception: "A good programming project is not judged only by how it looks. The quality of the logic matters most.",
    correctOutcome: "The completed project works logically, includes the key constructs, and can be explained clearly by the pupil.",
    wrongOutcome: "The project looks busy or decorative but lacks secure logic or control of the required constructs.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 8,
    week: 1,
    term: "Summer Term 2",
    platform: "Scratch",
    title: "Decomposition and Subroutines",
    shortTitle: "Custom Blocks",
    description: "Breaking larger problems into manageable parts and using custom blocks to structure code.",
    objective: "I can decompose a problem and use custom blocks to organise a solution.",
    overview: "Decomposition means breaking a large problem into smaller parts. In Scratch, custom blocks act like subroutines, allowing repeated or related code to be grouped into a named block.",
    whyItMatters: "As programs become larger, structure matters. Decomposition and subroutines make code clearer, reusable, and easier to manage.",
    retrievalQuestion: "Why can large programs become difficult to manage if everything is kept in one long script?",
    teachingPoints: [
      "Decomposition breaks a problem into smaller manageable parts.",
      "Subroutines group instructions into reusable chunks.",
      "Custom blocks improve clarity and organisation.",
      "Structured programs are easier to debug and improve."
    ],
    vocab: [
      "decomposition",
      "subroutine",
      "custom block",
      "reuse",
      "structure",
      "modular"
    ],
    guidedSteps: [
      "Open Scratch and consider a larger project idea.",
      "List the separate jobs the program needs to do.",
      "Choose one repeated or self-contained task.",
      "Create a custom block for that task.",
      "Move the relevant instructions into the custom block definition.",
      "Call the custom block from the main program.",
      "Test that the project still behaves correctly.",
      "Explain how decomposition improved the structure of your code."
    ],
    practiceTask: "Create a Scratch project that uses at least one custom block to organise part of the program.",
    challengeTask: "Use more than one custom block and explain how each one helps break the problem into smaller parts.",
    keyQuestion: "How do decomposition and subroutines help programmers manage larger programs?",
    misconception: "Custom blocks are not just shortcuts. They improve organisation, readability, and reuse.",
    correctOutcome: "The pupil creates and uses a custom block meaningfully and explains how it supports decomposition.",
    wrongOutcome: "A custom block is created, but it does not organise the program clearly or its purpose cannot be explained.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 9,
    week: 2,
    term: "Summer Term 2",
    platform: "Scratch",
    title: "Condition-Controlled Iteration",
    shortTitle: "Repeat Until",
    description: "Using loops that continue until a condition is met.",
    objective: "I can use condition-controlled iteration in a Scratch program.",
    overview: "Condition-controlled iteration repeats instructions until a condition changes. In Scratch, this is often seen in repeat until loops or forever loops combined with conditions.",
    whyItMatters: "Not all repetition should run a fixed number of times. Sometimes a loop must continue until a target is reached or an event occurs.",
    retrievalQuestion: "How is a count-controlled loop different from a loop that depends on a condition?",
    teachingPoints: [
      "Condition-controlled loops depend on logic rather than a fixed count.",
      "The loop stops when a condition becomes true.",
      "These loops are useful in games, chasing actions, or repeated checks.",
      "Programmers must design the condition carefully to avoid infinite loops."
    ],
    vocab: [
      "condition-controlled",
      "repeat until",
      "forever",
      "target",
      "infinite loop",
      "terminate"
    ],
    guidedSteps: [
      "Open Scratch and create a variable or condition to monitor.",
      "Add a repeat until block.",
      "Choose a sensible stopping condition such as score = 10.",
      "Place repeated actions inside the loop.",
      "Run the project and watch whether the condition changes.",
      "Check that the loop stops at the correct point.",
      "Adjust the logic if the loop never ends or stops too soon.",
      "Explain why this problem needed condition-controlled iteration."
    ],
    practiceTask: "Build a Scratch program that uses a repeat until loop to continue until a target condition is reached.",
    challengeTask: "Compare a count-controlled loop and a condition-controlled loop, then justify which is better for your task.",
    keyQuestion: "When is a condition-controlled loop more suitable than a count-controlled loop?",
    misconception: "A loop does not stop automatically unless the programmer creates logic that allows the stopping condition to be reached.",
    correctOutcome: "The pupil creates a working condition-controlled loop and explains why it fits the problem.",
    wrongOutcome: "The loop runs endlessly, stops incorrectly, or the pupil cannot explain the purpose of the condition.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 10,
    week: 3,
    term: "Summer Term 2",
    platform: "Scratch",
    title: "Evaluating Different Loop Types",
    shortTitle: "Choose the Best Loop",
    description: "Comparing iteration types and justifying which is best for a given problem.",
    objective: "I can evaluate different loop types and justify my choice.",
    overview: "Programmers do not choose loops at random. They evaluate the task and select the loop that best matches the logic of the problem.",
    whyItMatters: "Evaluation is a key KS3 skill. Pupils need to explain not only what works, but why it is the most suitable solution.",
    retrievalQuestion: "What is the difference between count-controlled and condition-controlled iteration?",
    teachingPoints: [
      "Different loops solve different kinds of repetition problems.",
      "Evaluation involves comparison and justification.",
      "A suitable solution is efficient, logical, and easy to understand.",
      "Programmers should be able to explain their design decisions."
    ],
    vocab: [
      "evaluate",
      "justify",
      "suitable",
      "count-controlled",
      "condition-controlled",
      "efficiency"
    ],
    guidedSteps: [
      "Look at two similar Scratch solutions using different loop types.",
      "Run both versions and compare the outcomes.",
      "Identify what each loop is doing well.",
      "Decide which version is more suitable for the task.",
      "Record your reasoning using precise vocabulary.",
      "Modify one version to improve it.",
      "Retest and compare again.",
      "Write a short evaluation explaining your final choice."
    ],
    practiceTask: "Compare two loop-based solutions and explain which one is more suitable for the problem.",
    challengeTask: "Design your own example where two different loops could work, then justify which is better and why.",
    keyQuestion: "What makes one loop more suitable than another for a particular task?",
    misconception: "If two solutions both run, that does not mean they are equally strong. One may still be more suitable or efficient.",
    correctOutcome: "The pupil compares loop types thoughtfully and justifies the best choice using accurate reasoning.",
    wrongOutcome: "The pupil chooses a loop without meaningful explanation or cannot compare the strengths of each approach.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 11,
    week: 4,
    term: "Summer Term 2",
    platform: "Scratch",
    title: "Lists and Data Structures",
    shortTitle: "Store Multiple Values",
    description: "Using lists in Scratch to store and manage multiple pieces of related data.",
    objective: "I can use a list to store and manipulate multiple values in a program.",
    overview: "A list is a data structure that stores multiple items in one place. In Scratch, lists are useful when a program needs to store more than one value, such as answers, names, or collected items.",
    whyItMatters: "Lists help programmers manage larger sets of data efficiently instead of creating many separate variables.",
    retrievalQuestion: "Why might a single variable be a poor choice when a program needs to store many related values?",
    teachingPoints: [
      "A list stores multiple values in one structure.",
      "Lists are useful for collections of related data.",
      "Programmers can add, remove, and read items from a list.",
      "Lists support more advanced problem solving than single variables alone."
    ],
    vocab: [
      "list",
      "data structure",
      "item",
      "store",
      "remove",
      "collection"
    ],
    guidedSteps: [
      "Open Scratch and create a new list.",
      "Give the list a clear name related to your project.",
      "Add several items to the list manually or through code.",
      "Display the list on screen and observe its contents.",
      "Use blocks to add or delete an item.",
      "Test how the list changes during the program.",
      "Link the list to a small interaction such as choosing or checking an answer.",
      "Explain why a list is more suitable than many separate variables in this case."
    ],
    practiceTask: "Create a Scratch list and use code to add, view, or remove items from it.",
    challengeTask: "Build a small program that uses a list meaningfully, such as storing quiz answers, names, or collected objects.",
    keyQuestion: "Why is a list often more useful than several separate variables?",
    misconception: "A list is not just a display box. It is a structure for storing and manipulating multiple related values.",
    correctOutcome: "The pupil uses a list correctly and can explain why it is the right structure for the task.",
    wrongOutcome: "A list is present, but it is not used meaningfully or its purpose is unclear.",
    projectLink: "https://scratch.mit.edu/"
  },
{
    id: 12,
    week: 5,
    term: "Summer Term 2",
    platform: "Scratch",
    title: "Final Project: Translate Quiz",
    shortTitle: "Large-Scale Build",
    description: "Decomposing and building a larger Scratch project using subroutines, lists, selection, and iteration.",
    objective: "I can design and build a larger Scratch project using advanced structures from this term.",
    overview: "The final project challenges pupils to design a larger interactive program such as a translate quiz. Success depends on decomposition, structured code, and secure use of lists, selection, iteration, and custom blocks.",
    whyItMatters: "This project demonstrates whether pupils can solve a larger problem independently using KS3-level computational thinking.",
    retrievalQuestion: "Which advanced ideas from this term would help you structure a larger project most effectively?",
    teachingPoints: [
      "Large projects need decomposition and planning.",
      "Lists and subroutines support scale and organisation.",
      "Selection and iteration control interaction and flow.",
      "Testing and evaluation are essential for a strong final outcome."
    ],
    vocab: [
      "final project",
      "translate quiz",
      "decompose",
      "subroutine",
      "list",
      "evaluate"
    ],
    guidedSteps: [
      "Read the final project brief and define the user goal.",
      "Break the project into smaller parts such as questions, scoring, and feedback.",
      "Decide where lists will store data.",
      "Decide where custom blocks will organise repeated logic.",
      "Build the program section by section in Scratch.",
      "Test each section thoroughly before moving on.",
      "Refine the interaction and debug any issues.",
      "Evaluate how effectively your final design solves the problem."
    ],
    practiceTask: "Plan and build a larger Scratch project that uses at least a list, selection, iteration, and one custom block.",
    challengeTask: "Extend the project with extra polish, clearer feedback, or a more efficient structure while keeping the code organised.",
    keyQuestion: "What features make a larger programming project well structured and effective?",
    misconception: "A larger project is not just a longer script. It must be structured carefully so that the logic stays clear and manageable.",
    correctOutcome: "The final project is organised, functional, and shows secure use of advanced programming ideas.",
    wrongOutcome: "The project contains some advanced features, but the structure is unclear, the logic is weak, or the parts do not work together reliably.",
    projectLink: "https://scratch.mit.edu/"
  }
];

const quizBank: Record<number, QuizQuestion[]> = {
  1: [
    {
      prompt: "What does sequence mean in programming?",
      options: [
        "The order in which instructions run",
        "A type of sprite costume",
        "A way to store many values",
        "A block that repeats forever"
      ],
      answer: 0
    },
    {
      prompt: "Why must computer instructions be precise?",
      options: [
        "Because computers do exactly what they are told",
        "Because computers can guess missing steps",
        "Because order does not matter",
        "Because precise code only matters in games"
      ],
      answer: 0
    },
    {
      prompt: "Which action best demonstrates sequencing?",
      options: [
        "Placing commands in the correct order",
        "Choosing a brighter backdrop",
        "Adding more sprites to the stage",
        "Changing the font of a title"
      ],
      answer: 0
    },
    {
      prompt: "What is likely to happen if two key instructions are swapped?",
      options: [
        "The output may change or fail",
        "The project will always improve",
        "The variable will delete itself",
        "The code will become a list"
      ],
      answer: 0
    },
    {
      prompt: "Why are humans often better than computers at dealing with vague instructions?",
      options: [
        "Humans can infer meaning from context",
        "Humans only follow one instruction at a time",
        "Humans never make mistakes",
        "Humans always think in code"
      ],
      answer: 0
    },
    {
      prompt: "Which term best describes a clear set of steps for solving a problem?",
      options: [
        "Algorithm",
        "Costume",
        "Monitor",
        "Broadcast"
      ],
      answer: 0
    },
    {
      prompt: "A programmer writes unclear instructions. What is the biggest risk?",
      options: [
        "The computer produces the wrong outcome",
        "The sprite becomes invisible forever",
        "The project saves automatically",
        "The keyboard stops working"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is true about sequence?",
      options: [
        "Even a small change in order can change the result",
        "Sequence is only important in maths",
        "Sequence does not matter once code runs",
        "Sequence and repetition are exactly the same"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil do when a sequence is not working?",
      options: [
        "Check the order of the instructions carefully",
        "Delete every block immediately",
        "Ignore the output and keep going",
        "Change the project title"
      ],
      answer: 0
    },
    {
      prompt: "The main idea of this lesson is:",
      options: [
        "Computers need exact, correctly ordered instructions",
        "Variables are more important than sequence",
        "Every program must use lists",
        "Precision is only needed for advanced coders"
      ],
      answer: 0
    }
  ],
  2: [
    {
      prompt: "What is a variable?",
      options: [
        "A named place that stores a value",
        "A block that creates a sprite",
        "A type of sound effect",
        "A loop that never stops"
      ],
      answer: 0
    },
    {
      prompt: "Why is tracing useful?",
      options: [
        "It helps a programmer follow how values change",
        "It makes the project run faster automatically",
        "It removes the need for testing",
        "It turns conditions into loops"
      ],
      answer: 0
    },
    {
      prompt: "What does set counter to 0 do?",
      options: [
        "Gives the variable an exact starting value",
        "Adds 0 repeatedly",
        "Deletes the variable",
        "Hides the variable monitor"
      ],
      answer: 0
    },
    {
      prompt: "What does change counter by 1 do?",
      options: [
        "Adds 1 to the current value",
        "Resets the value to 1 every time",
        "Creates a second variable",
        "Turns the variable into text"
      ],
      answer: 0
    },
    {
      prompt: "Which value is being traced in a variable program?",
      options: [
        "The current stored value as code runs",
        "The colour of the stage",
        "The name of the project",
        "The size of the browser window"
      ],
      answer: 0
    },
    {
      prompt: "Why are variables important in programs?",
      options: [
        "They allow data to change while the program runs",
        "They stop all bugs from happening",
        "They replace every other block",
        "They only make code look neater"
      ],
      answer: 0
    },
    {
      prompt: "What should a programmer do after changing a value in code?",
      options: [
        "Predict and then test the new outcome",
        "Assume the result will stay the same",
        "Delete the variable",
        "Replace it with a list"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is correct?",
      options: [
        "A variable can be set, changed, and checked",
        "A variable is always fixed forever",
        "A variable only stores pictures",
        "A variable is the same as a loop"
      ],
      answer: 0
    },
    {
      prompt: "What is meant by program flow?",
      options: [
        "How the program moves from one instruction or value change to the next",
        "How quickly the computer starts up",
        "How bright the monitor looks",
        "How many sprites are on the stage"
      ],
      answer: 0
    },
    {
      prompt: "The key focus of this lesson is:",
      options: [
        "Using and tracing variables through a program",
        "Building a title screen",
        "Recording sounds in Scratch",
        "Changing a sprite costume"
      ],
      answer: 0
    }
  ],
  3: [
    {
      prompt: "What is selection in programming?",
      options: [
        "Choosing a path based on a condition",
        "Repeating code many times",
        "Saving a project to the cloud",
        "Drawing a sprite on the stage"
      ],
      answer: 0
    },
    {
      prompt: "What does an if statement do?",
      options: [
        "Runs code only when a condition is true",
        "Runs code forever",
        "Stores many values in one place",
        "Changes a variable at random"
      ],
      answer: 0
    },
    {
      prompt: "A condition in Scratch usually evaluates as:",
      options: [
        "True or false",
        "Fast or slow",
        "Large or small",
        "Private or public"
      ],
      answer: 0
    },
    {
      prompt: "Why does selection make programs more interactive?",
      options: [
        "Because the program can respond differently in different situations",
        "Because it removes the need for variables",
        "Because it makes every script identical",
        "Because it hides all outputs"
      ],
      answer: 0
    },
    {
      prompt: "What is needed inside an if statement?",
      options: [
        "A condition to test",
        "A list of student names",
        "A costume number only",
        "A random backdrop"
      ],
      answer: 0
    },
    {
      prompt: "Which is a good example of selection?",
      options: [
        "If score = 10, show 'You win'",
        "Repeat move 10 steps",
        "Set timer to 0",
        "Add a new sprite"
      ],
      answer: 0
    },
    {
      prompt: "What happens if the condition is false?",
      options: [
        "The code inside the if block does not run",
        "The whole project is deleted",
        "Every other block stops forever",
        "The variable becomes a list"
      ],
      answer: 0
    },
    {
      prompt: "Which word best describes the two possible outcomes of a condition?",
      options: [
        "Branch",
        "Costume",
        "Backdrop",
        "Coordinate"
      ],
      answer: 0
    },
    {
      prompt: "Why might a programmer use selection with a variable?",
      options: [
        "To make decisions based on stored values",
        "To draw more accurate sprites",
        "To save the project automatically",
        "To stop all debugging"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly teaches pupils to:",
      options: [
        "Use if statements to control program behaviour",
        "Use lists to store answers",
        "Create complex art in Scratch",
        "Build a website"
      ],
      answer: 0
    }
  ],
  4: [
    {
      prompt: "What does a comparison operator do?",
      options: [
        "Checks a relationship between values",
        "Stores many values at once",
        "Repeats code forever",
        "Renames a sprite"
      ],
      answer: 0
    },
    {
      prompt: "Which is a comparison operator?",
      options: [
        "Greater than",
        "Repeat",
        "Broadcast",
        "Clone"
      ],
      answer: 0
    },
    {
      prompt: "What does AND mean in logic?",
      options: [
        "Both conditions must be true",
        "Only one condition must be true",
        "The condition becomes false",
        "The program should stop"
      ],
      answer: 0
    },
    {
      prompt: "What does OR mean in logic?",
      options: [
        "At least one condition must be true",
        "Both conditions must be false",
        "The variable must reset",
        "The code repeats exactly ten times"
      ],
      answer: 0
    },
    {
      prompt: "What does NOT do to a condition?",
      options: [
        "Reverses it",
        "Stores it in a variable",
        "Repeats it forever",
        "Deletes the code"
      ],
      answer: 0
    },
    {
      prompt: "Why are logical operators useful?",
      options: [
        "They allow more precise and complex decisions",
        "They replace every if statement",
        "They only make code longer",
        "They stop values from changing"
      ],
      answer: 0
    },
    {
      prompt: "Which condition is more complex?",
      options: [
        "score > 5 AND lives > 0",
        "score = 0",
        "say 'Hello'",
        "move 10 steps"
      ],
      answer: 0
    },
    {
      prompt: "When should a programmer choose OR?",
      options: [
        "When either of two conditions should trigger the result",
        "When both conditions must happen together",
        "When the code should never run",
        "When a loop must repeat a fixed number of times"
      ],
      answer: 0
    },
    {
      prompt: "What is the main risk of using AND and OR carelessly?",
      options: [
        "The program logic may not match the intended rule",
        "The project cannot be saved",
        "Variables will disappear",
        "The stage will turn black"
      ],
      answer: 0
    },
    {
      prompt: "The central skill in this lesson is:",
      options: [
        "Building and testing precise conditions with operators",
        "Drawing a better backdrop",
        "Adding sounds to every sprite",
        "Making the project open faster"
      ],
      answer: 0
    }
  ],
  5: [
    {
      prompt: "What is iteration?",
      options: [
        "Repetition in code",
        "A type of variable",
        "A way to compare values",
        "A method of storing many items"
      ],
      answer: 0
    },
    {
      prompt: "What is a count-controlled loop?",
      options: [
        "A loop that repeats a fixed number of times",
        "A loop that always runs forever",
        "A loop that stores values",
        "A loop that only checks one condition"
      ],
      answer: 0
    },
    {
      prompt: "Why are loops efficient?",
      options: [
        "They reduce repeated code",
        "They remove the need for testing",
        "They make programs random",
        "They automatically fix logic errors"
      ],
      answer: 0
    },
    {
      prompt: "Which Scratch block is count-controlled?",
      options: [
        "Repeat 10",
        "If then",
        "Make a list",
        "Ask and wait"
      ],
      answer: 0
    },
    {
      prompt: "What is the main advantage of replacing repeated blocks with a loop?",
      options: [
        "The code becomes shorter and easier to maintain",
        "The output always changes completely",
        "The project no longer needs variables",
        "The sprite becomes more colourful"
      ],
      answer: 0
    },
    {
      prompt: "If a pattern must happen six times, which construct is most suitable?",
      options: [
        "A repeat loop",
        "A list",
        "A forever loop with no reason",
        "A custom block on its own"
      ],
      answer: 0
    },
    {
      prompt: "What should a programmer check after creating a loop?",
      options: [
        "That it repeats the correct number of times",
        "That the backdrop name changed",
        "That the browser tab is correct",
        "That the monitor is hidden"
      ],
      answer: 0
    },
    {
      prompt: "Why might copied code be weaker than a loop?",
      options: [
        "It is longer and harder to edit consistently",
        "It always crashes Scratch",
        "It cannot produce repetition",
        "It turns conditions into variables"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is true?",
      options: [
        "A loop can create the same outcome with fewer blocks",
        "A loop is only useful in advanced text coding",
        "A loop removes the need for all sequence",
        "A loop is the same as a list"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly focuses on:",
      options: [
        "Using count-controlled loops for efficiency",
        "Designing logos",
        "Recording narration",
        "Creating online accounts"
      ],
      answer: 0
    }
  ],
  6: [
    {
      prompt: "What does it mean to combine constructs?",
      options: [
        "Use more than one programming idea together to solve a problem",
        "Place every block in one script at random",
        "Only use loops",
        "Only use variables"
      ],
      answer: 0
    },
    {
      prompt: "Which construct is best for storing changing data?",
      options: [
        "Variable",
        "Loop",
        "Backdrop",
        "Sound"
      ],
      answer: 0
    },
    {
      prompt: "Which construct is best for decision-making?",
      options: [
        "Selection",
        "Sequence only",
        "Costume",
        "Broadcast alone"
      ],
      answer: 0
    },
    {
      prompt: "Why do programmers combine constructs?",
      options: [
        "Because real problems usually need more than one kind of logic",
        "Because one construct is never allowed",
        "Because Scratch requires it in every project",
        "Because it makes the code decorative"
      ],
      answer: 0
    },
    {
      prompt: "What is a strong first step before building a solution?",
      options: [
        "Plan which constructs are needed",
        "Add as many sprites as possible",
        "Choose a random background",
        "Hide all variables"
      ],
      answer: 0
    },
    {
      prompt: "Why is testing important when combining constructs?",
      options: [
        "It checks whether the different parts work together",
        "It makes the code shorter automatically",
        "It removes the need for debugging",
        "It turns loops into conditions"
      ],
      answer: 0
    },
    {
      prompt: "What is the main purpose of variables, selection, and iteration together?",
      options: [
        "To build a logical solution to a problem",
        "To make the project save online",
        "To stop the stage from changing",
        "To create faster internet"
      ],
      answer: 0
    },
    {
      prompt: "What might show weak problem solving?",
      options: [
        "Adding blocks without a clear reason",
        "Explaining why each part is needed",
        "Testing each section step by step",
        "Improving repeated code"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil be able to do after finishing a combined-constructs task?",
      options: [
        "Explain why each construct was chosen",
        "Only describe the colour scheme",
        "Rename every sprite",
        "Delete any code that looks complex"
      ],
      answer: 0
    },
    {
      prompt: "This lesson is mainly about:",
      options: [
        "Solving problems by combining key programming constructs",
        "Building a poster in Scratch",
        "Using one block repeatedly without logic",
        "Changing fonts"
      ],
      answer: 0
    }
  ],
  7: [
    {
      prompt: "What is the main goal of an assessment project?",
      options: [
        "To show independent understanding and application of learning",
        "To copy the teacher’s exact example only",
        "To use the most colourful sprites possible",
        "To avoid testing"
      ],
      answer: 0
    },
    {
      prompt: "Which set of constructs should appear in this assessment?",
      options: [
        "Sequence, variable, selection, and iteration",
        "Only sequence and sound",
        "Lists only",
        "Custom blocks only"
      ],
      answer: 0
    },
    {
      prompt: "Why is planning important in an assessment project?",
      options: [
        "It helps the logic stay clear and purposeful",
        "It removes the need to code",
        "It guarantees full marks automatically",
        "It makes the project shorter than required"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil do after building each main section?",
      options: [
        "Test it",
        "Delete it",
        "Rename the whole project",
        "Add random effects"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is strongest?",
      options: [
        "Logical quality matters more than decoration alone",
        "A good background is the most important feature",
        "Projects should never be debugged",
        "All assessment tasks need lists"
      ],
      answer: 0
    },
    {
      prompt: "What makes a project independent?",
      options: [
        "The pupil can explain and justify their own code choices",
        "The pupil copies every block without understanding",
        "The project uses three backdrops",
        "The teacher builds the difficult parts"
      ],
      answer: 0
    },
    {
      prompt: "Why is refinement part of the project process?",
      options: [
        "Because programmers improve and polish their work after testing",
        "Because the first version is always perfect",
        "Because refinement only changes colours",
        "Because code cannot be evaluated"
      ],
      answer: 0
    },
    {
      prompt: "What would weaken an assessment project?",
      options: [
        "Using key constructs without understanding them",
        "Testing carefully",
        "Explaining the purpose clearly",
        "Planning the structure first"
      ],
      answer: 0
    },
    {
      prompt: "What is evaluation in this context?",
      options: [
        "Reviewing how well the project meets the brief",
        "Changing the sprite size",
        "Downloading the project",
        "Printing the code"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly develops:",
      options: [
        "Independent programming competence",
        "Poster design skills",
        "Data entry skills",
        "Typing speed"
      ],
      answer: 0
    }
  ],
  8: [
    {
      prompt: "What is decomposition?",
      options: [
        "Breaking a large problem into smaller parts",
        "Repeating instructions many times",
        "Comparing two values",
        "Storing several items in a list"
      ],
      answer: 0
    },
    {
      prompt: "What is a subroutine in Scratch usually created as?",
      options: [
        "A custom block",
        "A backdrop",
        "A variable monitor",
        "A costume"
      ],
      answer: 0
    },
    {
      prompt: "Why are custom blocks useful?",
      options: [
        "They organise and reuse code",
        "They replace every script in a project",
        "They stop all bugs permanently",
        "They are only used for artwork"
      ],
      answer: 0
    },
    {
      prompt: "What problem does decomposition help solve?",
      options: [
        "Managing complexity in larger programs",
        "Changing the keyboard language",
        "Saving projects more quickly",
        "Making the screen brighter"
      ],
      answer: 0
    },
    {
      prompt: "What should a programmer do before making a custom block?",
      options: [
        "Identify a repeated or self-contained task",
        "Delete all other scripts",
        "Hide every variable",
        "Choose a new font"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is true about subroutines?",
      options: [
        "They make code easier to read and maintain",
        "They only work in tiny projects",
        "They remove the need for sequence",
        "They cannot be called more than once"
      ],
      answer: 0
    },
    {
      prompt: "Why might a larger script become difficult to manage?",
      options: [
        "Everything is placed in one long section with no structure",
        "It uses a clear variable name",
        "It is tested carefully",
        "It contains comments"
      ],
      answer: 0
    },
    {
      prompt: "What does reusable mean in programming?",
      options: [
        "A section of code can be used again where needed",
        "A sprite can only be used once",
        "A list can be saved twice",
        "A variable never changes"
      ],
      answer: 0
    },
    {
      prompt: "What is the strongest reason to use a custom block?",
      options: [
        "To give a clear job a clear name and structure",
        "To make the stage look busier",
        "To avoid all planning",
        "To hide the logic from the user"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly teaches pupils to:",
      options: [
        "Use decomposition and custom blocks to structure code",
        "Replace every variable with a list",
        "Create a website menu",
        "Record audio effects"
      ],
      answer: 0
    }
  ],
  9: [
    {
      prompt: "What is condition-controlled iteration?",
      options: [
        "Repetition that continues until a condition is met",
        "A loop that always repeats a fixed number of times",
        "A variable that stores several answers",
        "A custom block with no inputs"
      ],
      answer: 0
    },
    {
      prompt: "Which Scratch loop is often condition-controlled?",
      options: [
        "Repeat until",
        "Repeat 10",
        "Wait 1 seconds",
        "Go to x: y:"
      ],
      answer: 0
    },
    {
      prompt: "What causes a condition-controlled loop to stop?",
      options: [
        "Its stopping condition becomes true",
        "The stage background changes",
        "A sprite costume changes",
        "The project title is edited"
      ],
      answer: 0
    },
    {
      prompt: "Why is a condition-controlled loop useful?",
      options: [
        "Because some tasks should continue until a target or event occurs",
        "Because it removes all need for variables",
        "Because it is shorter than every other block",
        "Because it always runs faster than any other solution"
      ],
      answer: 0
    },
    {
      prompt: "What is an infinite loop?",
      options: [
        "A loop that never reaches its stopping point",
        "A loop with exactly ten repetitions",
        "A list that stores too many values",
        "A variable set to zero"
      ],
      answer: 0
    },
    {
      prompt: "How can a programmer avoid an infinite loop?",
      options: [
        "Make sure the condition can change and eventually be met",
        "Use more backdrops",
        "Hide the variable monitor",
        "Delete the input blocks"
      ],
      answer: 0
    },
    {
      prompt: "When is condition-controlled iteration better than count-controlled iteration?",
      options: [
        "When the program should stop based on logic rather than a fixed number",
        "When the answer is always 5",
        "When no condition is available",
        "When the task should never end"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil do after creating a repeat until loop?",
      options: [
        "Test whether it stops at the correct time",
        "Assume it works without running it",
        "Replace it with copied code",
        "Delete the condition"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is true?",
      options: [
        "A loop may depend on logic rather than a set count",
        "All loops work in exactly the same way",
        "Condition-controlled loops never need variables",
        "Repeat until means repeat forever"
      ],
      answer: 0
    },
    {
      prompt: "The main focus of this lesson is:",
      options: [
        "Using loops that continue until a condition is reached",
        "Only drawing patterns on the stage",
        "Naming sprites",
        "Creating a class register"
      ],
      answer: 0
    }
  ],
  10: [
    {
      prompt: "What does it mean to evaluate loop types?",
      options: [
        "Compare them and justify which is most suitable",
        "Use every loop in one script",
        "Delete weaker code without explanation",
        "Only check whether the code runs"
      ],
      answer: 0
    },
    {
      prompt: "Why might two different loops both work for one task?",
      options: [
        "Different constructs can sometimes produce similar outcomes",
        "Scratch chooses a random result",
        "Loops do not affect the program",
        "Variables and loops are the same"
      ],
      answer: 0
    },
    {
      prompt: "What makes one loop more suitable than another?",
      options: [
        "It matches the logic of the problem more clearly and efficiently",
        "It has a nicer colour",
        "It uses more blocks",
        "It appears first in the menu"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil include in a justification?",
      options: [
        "A reason linked to the task and the logic",
        "A comment about their favourite sprite",
        "Only the teacher’s opinion",
        "A description of the backdrop"
      ],
      answer: 0
    },
    {
      prompt: "Which statement shows evaluation rather than description?",
      options: [
        "A repeat until loop is better here because the number of repetitions is unknown",
        "This code has a loop in it",
        "The sprite moves on screen",
        "The project uses Scratch"
      ],
      answer: 0
    },
    {
      prompt: "Why is efficiency part of loop evaluation?",
      options: [
        "A simpler, more suitable solution is usually easier to maintain",
        "Efficiency only matters in websites",
        "Efficient code never needs testing",
        "Efficiency is about adding more blocks"
      ],
      answer: 0
    },
    {
      prompt: "If a pattern repeats exactly 8 times, which loop is often more suitable?",
      options: [
        "A count-controlled loop",
        "A repeat until loop based on score",
        "A forever loop",
        "A list"
      ],
      answer: 0
    },
    {
      prompt: "If a chase continues until the player is caught, which loop is often more suitable?",
      options: [
        "A condition-controlled loop",
        "A repeat 5 loop",
        "A list block",
        "A set variable block"
      ],
      answer: 0
    },
    {
      prompt: "What is the danger of choosing a loop without evaluation?",
      options: [
        "The solution may work but still be weak or unsuitable",
        "The computer will refuse to run it",
        "The project cannot be saved",
        "All variables will reset"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly develops:",
      options: [
        "Comparison and justification of loop choices",
        "Artwork skills",
        "Typing accuracy",
        "Internet research"
      ],
      answer: 0
    }
  ],
  11: [
    {
      prompt: "What is a list?",
      options: [
        "A data structure that stores multiple values",
        "A loop that repeats forever",
        "A comparison operator",
        "A type of sprite"
      ],
      answer: 0
    },
    {
      prompt: "Why might a list be better than several separate variables?",
      options: [
        "It stores related data together more efficiently",
        "It makes conditions unnecessary",
        "It always removes bugs",
        "It stops values from changing"
      ],
      answer: 0
    },
    {
      prompt: "Which task is well suited to a list?",
      options: [
        "Storing a set of quiz answers",
        "Turning a sprite around",
        "Changing the page colour",
        "Unlocking the teacher dashboard"
      ],
      answer: 0
    },
    {
      prompt: "What can a programmer do with list items?",
      options: [
        "Add, read, and remove them",
        "Only look at them",
        "Only delete the whole list",
        "Only use them in art projects"
      ],
      answer: 0
    },
    {
      prompt: "What does a data structure help with?",
      options: [
        "Organising data",
        "Changing sound volume",
        "Connecting to Wi-Fi",
        "Making the project public"
      ],
      answer: 0
    },
    {
      prompt: "What is an item in a list?",
      options: [
        "One value stored inside the list",
        "The name of the list itself",
        "A type of variable monitor",
        "A custom block"
      ],
      answer: 0
    },
    {
      prompt: "Why are lists useful in larger projects?",
      options: [
        "They help manage multiple pieces of related information",
        "They replace all loops",
        "They stop the need for planning",
        "They work only in tiny projects"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is correct?",
      options: [
        "A list can hold many related values in one place",
        "A list can only hold one value ever",
        "A list is the same as a variable",
        "A list cannot be changed by code"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil understand after this lesson?",
      options: [
        "Why a list is suitable for storing collections of data",
        "That lists only make projects look more advanced",
        "That every project must use a list",
        "That lists remove the need for selection"
      ],
      answer: 0
    },
    {
      prompt: "This lesson mainly focuses on:",
      options: [
        "Using lists to store and manage multiple values",
        "Building a poster",
        "Changing project ownership",
        "Recording narration"
      ],
      answer: 0
    }
  ],
  12: [
    {
      prompt: "Why does a larger project need decomposition?",
      options: [
        "It helps organise the solution into manageable parts",
        "It removes the need for code",
        "It is only useful for artwork",
        "It makes lists unnecessary"
      ],
      answer: 0
    },
    {
      prompt: "Which feature is most useful for storing many words or answers in a translate quiz?",
      options: [
        "A list",
        "A single costume",
        "A backdrop",
        "A sound effect"
      ],
      answer: 0
    },
    {
      prompt: "Which feature is most useful for organising repeated logic in a larger project?",
      options: [
        "A custom block",
        "A title screen",
        "A random sprite",
        "A paint editor"
      ],
      answer: 0
    },
    {
      prompt: "Why is selection important in a quiz project?",
      options: [
        "It checks answers and decides what feedback to give",
        "It repeats code a fixed number of times",
        "It stores all values automatically",
        "It renames the stage"
      ],
      answer: 0
    },
    {
      prompt: "Why is iteration useful in a larger project?",
      options: [
        "It helps repeat checks or actions efficiently",
        "It removes every need for input",
        "It stores questions permanently",
        "It replaces all variables"
      ],
      answer: 0
    },
    {
      prompt: "What should a pupil do while building a large project?",
      options: [
        "Test each section as it is built",
        "Finish everything before testing once",
        "Avoid changing any code",
        "Only work on decoration first"
      ],
      answer: 0
    },
    {
      prompt: "What makes a large project well structured?",
      options: [
        "Clear parts, logical flow, and organised code",
        "Lots of colours and sound effects",
        "As many sprites as possible",
        "One very long script with no comments or planning"
      ],
      answer: 0
    },
    {
      prompt: "What is the value of evaluation at the end of the project?",
      options: [
        "It helps the programmer judge how well the design solved the problem",
        "It deletes the old version automatically",
        "It changes the scoring system at random",
        "It replaces debugging"
      ],
      answer: 0
    },
    {
      prompt: "Which statement is strongest?",
      options: [
        "A larger project must be managed carefully so the logic stays clear",
        "Large projects are just long scripts with more decoration",
        "Lists are only for advanced adults",
        "Subroutines are optional extras with no real purpose"
      ],
      answer: 0
    },
    {
      prompt: "This final lesson mainly assesses:",
      options: [
        "Independent problem solving using advanced Scratch structures",
        "Only typing speed",
        "Only visual design",
        "Only how many sprites were added"
      ],
      answer: 0
    }
  ]
};

function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normaliseName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildStorageKey(className: string, studentName: string) {
  return `year8-${className}-${slugifyName(studentName)}`;
}

function getRegistry(): LearnerProfile[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REGISTRY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LearnerProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegistry(registry: LearnerProfile[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function addProfileToRegistry(profile: LearnerProfile) {
  const existing = getRegistry();
  const alreadyExists = existing.some((item) => item.storageKey === profile.storageKey);
  if (!alreadyExists) {
    saveRegistry(
      [...existing, profile].sort((a, b) => {
        if (a.className !== b.className) return a.className.localeCompare(b.className);
        return a.studentName.localeCompare(b.studentName);
      })
    );
  }
}

function upsertProfileInRegistry(profile: LearnerProfile) {
  const profileWithCode = withDefaultAccessCode(profile);
  const existing = getRegistry();
  const updated = existing.some((item) => item.storageKey === profileWithCode.storageKey)
    ? existing.map((item) =>
        item.storageKey === profileWithCode.storageKey ? profileWithCode : item
      )
    : [...existing, profileWithCode];

  saveRegistry(
    updated.sort((a, b) => {
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      return a.studentName.localeCompare(b.studentName);
    })
  );
}

function removeProfileFromRegistry(profile: LearnerProfile) {
  const existing = getRegistry();
  const filtered = existing.filter((item) => item.storageKey !== profile.storageKey);
  saveRegistry(filtered);
}

function withDefaultAccessCode(profile: LearnerProfile): LearnerProfile {
  return {
    ...profile,
    accessCode: profile.accessCode?.trim() || DEFAULT_ACCESS_CODE,
  };
}

function buildQuiz(lessonId: number): QuizQuestion[] {
  return quizBank[lessonId] || [];
}

function safeParseQuizOrderMap(raw: string | null): QuizOrderMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeParseQuizResultMap(raw: string | null): Record<number, QuizResult> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeParseScreenshotMap(raw: string | null): ScreenshotMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function safeParseNumberArray(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => Number.isInteger(item)) : [];
  } catch {
    return [];
  }
}

async function syncProfileDataToCloud(
  profile: LearnerProfile,
  completedLessonIds: number[],
  quizMap: Record<number, QuizResult>,
  screenshots: ScreenshotMap
) {
  await saveCloudProfile(profile);

  const lessonIds = new Set<number>([
    ...completedLessonIds,
    ...Object.keys(quizMap).map(Number),
    ...Object.keys(screenshots).map(Number),
  ]);

  for (const lessonId of lessonIds) {
    if (!Number.isInteger(lessonId)) continue;

    await saveCloudLessonProgress(profile, lessonId, {
      completed: completedLessonIds.includes(lessonId),
      quizResult: quizMap[lessonId],
      screenshot: screenshots[lessonId] || null,
    });
  }
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuizOrder(questions: QuizQuestion[]): number[][] {
  return questions.map((question) =>
    shuffleArray(question.options.map((_, optionIndex) => optionIndex))
  );
}

function applyQuizOrder(questions: QuizQuestion[], quizOrder: number[][]): QuizQuestionView[] {
  return questions.map((question, questionIndex) => {
    const savedOrder = quizOrder[questionIndex];
    const validSavedOrder =
      Array.isArray(savedOrder) &&
      savedOrder.length === question.options.length &&
      question.options.every((_, optionIndex) => savedOrder.includes(optionIndex));

    const optionOrder = validSavedOrder
      ? savedOrder
      : question.options.map((_, optionIndex) => optionIndex);

    return {
      ...question,
      options: optionOrder.map((optionIndex) => question.options[optionIndex]),
      originalOptionIndexes: optionOrder,
    };
  });
}

function getLessonStateLabel(
  lessonId: number,
  completed: number[],
  quizState: Record<number, QuizResult>,
  questionCount: number
) {
  const result = quizState[lessonId];
  const isCompleted = completed.includes(lessonId);

  if (result?.submitted && questionCount > 0) {
    const percent = Math.round((result.score / questionCount) * 100);
    if (percent >= 80) {
      return {
        label: "Mastered",
        bg: "#dcfce7",
        border: "#86efac",
        text: "#166534",
      };
    }
    return {
      label: "Submitted",
      bg: "#fef3c7",
      border: "#fcd34d",
      text: "#92400e",
    };
  }

  if (isCompleted) {
    return {
      label: "Complete",
      bg: "#dbeafe",
      border: "#93c5fd",
      text: "#1d4ed8",
    };
  }

  return {
    label: "Not started",
    bg: "#f8fafc",
    border: "#cbd5e1",
    text: "#475569",
  };
}

function getMasteryText(score: number, total: number) {
  if (total === 0) return "Not attempted";
  const percent = Math.round((score / total) * 100);
  if (percent >= 80) return "Mastered";
  if (percent >= 60) return "Developing well";
  if (percent >= 40) return "Working towards security";
  return "Needs review";
}

export default function Home() {
  const [selectedLessonId, setSelectedLessonId] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [quizState, setQuizState] = useState<Record<number, QuizResult>>({});
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number[]>>({});
  const [screenshots, setScreenshots] = useState<ScreenshotMap>({});
  const [quizOrderMap, setQuizOrderMap] = useState<QuizOrderMap>({});
  const [profile, setProfile] = useState<LearnerProfile | null>(null);

  const [startMode, setStartMode] = useState<StartMode>("existing");
  const [setupClass, setSetupClass] = useState<string>(CLASS_OPTIONS[0]);
  const [setupStudentName, setSetupStudentName] = useState("");
  const [setupAccessCode, setSetupAccessCode] = useState("");
  const [existingClass, setExistingClass] = useState<string>(CLASS_OPTIONS[0]);
  const [accessCodeInputs, setAccessCodeInputs] = useState<Record<string, string>>({});
  const [cloudStatus, setCloudStatus] = useState("Cloud sync has not run yet.");
  const [registry, setRegistry] = useState<LearnerProfile[]>([]);

  useEffect(() => {
    const loadedRegistry = getRegistry().map(withDefaultAccessCode);
    saveRegistry(loadedRegistry);
    setRegistry(loadedRegistry);

    loadCloudPupilProfiles()
      .then((cloudProfiles) => {
        const localProfiles = getRegistry().map(withDefaultAccessCode);
        const merged = new Map<string, LearnerProfile>();

        localProfiles.forEach((item) => merged.set(item.storageKey, item));
        cloudProfiles
          .filter((item) => CLASS_OPTIONS.includes(item.className))
          .map(withDefaultAccessCode)
          .forEach((item) => merged.set(item.storageKey, item));

        const nextRegistry = Array.from(merged.values()).sort((a, b) => {
          if (a.className !== b.className) return a.className.localeCompare(b.className);
          return a.studentName.localeCompare(b.studentName);
        });

        saveRegistry(nextRegistry);
        setRegistry(nextRegistry);
      })
      .catch((error) => {
        console.warn("Could not load cloud pupil list from Supabase.", error);
      });

    const savedProfile = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (savedProfile) {
      try {
        const parsed = withDefaultAccessCode(
          JSON.parse(savedProfile) as LearnerProfile
        );
        localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(parsed));
        setProfile(parsed);
        setSetupClass(parsed.className);
        setSetupStudentName(parsed.studentName);
        setExistingClass(parsed.className);
      } catch {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;
    localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));

    const savedProgress = localStorage.getItem(`${profile.storageKey}-progress`);
    const savedQuiz = localStorage.getItem(`${profile.storageKey}-quiz-results`);
    const savedScreenshots = localStorage.getItem(`${profile.storageKey}-screenshots`);
    const savedQuizOrder = localStorage.getItem(`${profile.storageKey}-quiz-order`);

    const localCompleted = safeParseNumberArray(savedProgress);
    const localQuizState = safeParseQuizResultMap(savedQuiz);
    const localScreenshots = safeParseScreenshotMap(savedScreenshots);

    setCompleted(localCompleted);
    setQuizState(localQuizState);
    setCurrentAnswers({});
    setScreenshots(localScreenshots);
    setQuizOrderMap(safeParseQuizOrderMap(savedQuizOrder));
    setSelectedLessonId(1);

    setCloudStatus("Checking cloud sync...");
    saveCloudProfile(profile)
      .then(() => {
        if (!cancelled) setCloudStatus("Cloud profile connected.");
      })
      .catch((error) => {
        console.warn("Could not save pupil profile to Supabase.", error);
        if (!cancelled) {
          setCloudStatus(`Cloud sync failed: ${error?.message || "check Supabase settings."}`);
        }
      });

    loadCloudProfileData(profile.storageKey)
      .then((cloudData) => {
        if (!cloudData || cancelled) return;
        const mergedCompleted = Array.from(
          new Set([...localCompleted, ...cloudData.completedLessonIds])
        ).sort((a, b) => a - b);
        const mergedQuizState = { ...cloudData.quizMap, ...localQuizState };
        const mergedScreenshots = { ...cloudData.screenshots, ...localScreenshots };
        setCompleted(mergedCompleted);
        setQuizState(mergedQuizState);
        setScreenshots(mergedScreenshots);
        syncProfileDataToCloud(
          profile,
          mergedCompleted,
          mergedQuizState,
          mergedScreenshots
        )
          .then(() => {
            if (!cancelled) setCloudStatus("Cloud profile and progress synced.");
          })
          .catch((error) => {
            console.warn("Could not push merged progress to Supabase.", error);
            if (!cancelled) {
              setCloudStatus(`Cloud sync failed: ${error?.message || "progress not saved."}`);
            }
          });
      })
      .catch((error) => {
        console.warn("Could not load pupil progress from Supabase.", error);
        if (!cancelled) {
          setCloudStatus(`Cloud load failed: ${error?.message || "check Supabase settings."}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(`${profile.storageKey}-progress`, JSON.stringify(completed));
  }, [completed, profile]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(`${profile.storageKey}-quiz-results`, JSON.stringify(quizState));
  }, [quizState, profile]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(`${profile.storageKey}-screenshots`, JSON.stringify(screenshots));
  }, [screenshots, profile]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(`${profile.storageKey}-quiz-order`, JSON.stringify(quizOrderMap));
  }, [quizOrderMap, profile]);

  const selectedLesson =
    lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0];

  const baseQuiz = useMemo(() => buildQuiz(selectedLesson.id), [selectedLesson.id]);

  useEffect(() => {
    if (!profile) return;

    setQuizOrderMap((prev) => {
      const existingOrder = prev[selectedLesson.id];
      const isValidExistingOrder =
        Array.isArray(existingOrder) &&
        existingOrder.length === baseQuiz.length &&
        baseQuiz.every((question, questionIndex) => {
          const orderForQuestion = existingOrder[questionIndex];
          return (
            Array.isArray(orderForQuestion) &&
            orderForQuestion.length === question.options.length &&
            question.options.every((_, optionIndex) => orderForQuestion.includes(optionIndex))
          );
        });

      if (isValidExistingOrder) return prev;

      return {
        ...prev,
        [selectedLesson.id]: buildQuizOrder(baseQuiz),
      };
    });
  }, [profile, selectedLesson.id, baseQuiz]);

  const quiz = useMemo(() => {
    const lessonOrder = quizOrderMap[selectedLesson.id] || [];
    return applyQuizOrder(baseQuiz, lessonOrder);
  }, [baseQuiz, quizOrderMap, selectedLesson.id]);

  const submittedResult = quizState[selectedLesson.id];
  const selectedAnswers =
    currentAnswers[selectedLesson.id] || Array(quiz.length).fill(-1);
  const progress = Math.round((completed.length / lessons.length) * 100);
  const masteredCount = lessons.filter((lesson) => {
    const result = quizState[lesson.id];
    const questionCount = buildQuiz(lesson.id).length;
    return result?.submitted && questionCount > 0 && result.score / questionCount >= 0.8;
  }).length;
  const selectedScreenshot = screenshots[selectedLesson.id];
  const scorePercent =
    submittedResult && quiz.length > 0
      ? Math.round((submittedResult.score / quiz.length) * 100)
      : 0;

  const groupedLessons = useMemo(
    () => ({
      "Summer Term 1": lessons.filter((lesson) => lesson.term === "Summer Term 1"),
      "Summer Term 2": lessons.filter((lesson) => lesson.term === "Summer Term 2"),
    }),
    []
  );

  const existingPupilsForClass = useMemo(() => {
    return registry.filter((item) => item.className === existingClass);
  }, [registry, existingClass]);

  const startNewSession = () => {
    if (!setupClass) {
      alert("Please choose a class.");
      return;
    }

    const cleanName = normaliseName(setupStudentName);
    if (!cleanName) {
      alert("Please enter the student name.");
      return;
    }

    const cleanAccessCode = setupAccessCode.trim() || DEFAULT_ACCESS_CODE;

    const storageKey = buildStorageKey(setupClass, cleanName);
    const newProfile: LearnerProfile = {
      className: setupClass,
      studentName: cleanName,
      storageKey,
      accessCode: cleanAccessCode,
    };

    addProfileToRegistry(newProfile);
    const updatedRegistry = getRegistry();
    setRegistry(updatedRegistry);
    setProfile(newProfile);
    setExistingClass(setupClass);
    setSetupAccessCode("");

    saveCloudProfile(newProfile).catch((error) => {
      console.warn("Could not save pupil profile to Supabase.", error);
      setCloudStatus(`Cloud sync failed: ${error?.message || "profile not saved."}`);
    });
  };

  const openExistingPupil = (selectedProfile: LearnerProfile) => {
    const profileWithCode = withDefaultAccessCode(selectedProfile);
    const savedAccessCode = profileWithCode.accessCode || DEFAULT_ACCESS_CODE;
    const enteredAccessCode = accessCodeInputs[selectedProfile.storageKey]?.trim() || "";

    if (enteredAccessCode !== savedAccessCode) {
      alert("Please enter the correct access code for this pupil.");
      return;
    }
    upsertProfileInRegistry(profileWithCode);
    setRegistry(getRegistry());
    setProfile(profileWithCode);
    setSetupClass(profileWithCode.className);
    setSetupStudentName(profileWithCode.studentName);
    setExistingClass(profileWithCode.className);
  };

  const switchLearner = () => {
    setProfile(null);
    setCurrentAnswers({});
    setQuizOrderMap({});
    setAccessCodeInputs({});
    setStartMode("existing");
    setRegistry(getRegistry());
  };
  const markComplete = () => {
    if (!completed.includes(selectedLesson.id)) {
      setCompleted((prev) => [...prev, selectedLesson.id].sort((a, b) => a - b));
      if (profile) {
        setCloudStatus("Saving lesson completion to cloud...");
        saveCloudLessonProgress(profile, selectedLesson.id, { completed: true })
          .then(() => setCloudStatus("Lesson completion saved to cloud."))
          .catch((error) => {
            console.warn("Could not save lesson completion to Supabase.", error);
            setCloudStatus(`Cloud sync failed: ${error?.message || "lesson not saved."}`);
          });
      }
    }
  };

  const resetCurrentLearnerProgress = () => {
    if (!profile) return;

    const confirmed = window.confirm(
      `Reset all saved progress for ${profile.studentName}? This will clear lesson completion, quiz data, quiz order, and screenshots for this browser.`
    );
    if (!confirmed) return;

    setCompleted([]);
    setQuizState({});
    setCurrentAnswers({});
    setScreenshots({});
    setQuizOrderMap({});

    localStorage.removeItem(`${profile.storageKey}-progress`);
    localStorage.removeItem(`${profile.storageKey}-quiz-results`);
    localStorage.removeItem(`${profile.storageKey}-quiz-order`);
    localStorage.removeItem(`${profile.storageKey}-screenshots`);

    deleteCloudPupilData(profile).catch((error) => {
      console.warn("Could not reset pupil progress in Supabase.", error);
    });
  };

  const exportCurrentLearnerData = () => {
    if (!profile) return;

    const payload: PupilExport = {
      app: "year8-computing",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      completedLessonIds: completed,
      quizResults: quizState,
      quizOrder: quizOrderMap,
      screenshots,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.storageKey}-teacher-results.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const syncCurrentLearnerToCloud = async () => {
    if (!profile) return;

    setCloudStatus("Syncing to cloud...");

    try {
      await syncProfileDataToCloud(profile, completed, quizState, screenshots);

      setCloudStatus(
        `Cloud sync complete at ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}.`
      );
    } catch (error: any) {
      console.warn("Could not sync pupil data to Supabase.", error);
      setCloudStatus(`Cloud sync failed: ${error?.message || "check Supabase settings."}`);
    }
  };

  const saveAndExit = async () => {
    if (!profile) return;

    setCloudStatus("Saving before exit...");

    try {
      await syncProfileDataToCloud(profile, completed, quizState, screenshots);
      setCloudStatus("Saved.");
    } catch (error: any) {
      console.warn("Could not save pupil data before exit.", error);
      setCloudStatus(
        `Cloud sync failed: ${error?.message || "progress not saved."}`
      );

      const exitAnyway = window.confirm(
        "Cloud save failed. Do you still want to exit?"
      );
      if (!exitAnyway) return;
    }

    setProfile(null);
    setCurrentAnswers({});
    setQuizOrderMap({});
    setAccessCodeInputs({});
    setStartMode("existing");
    setRegistry(getRegistry());
  };

  const changeAccessCode = async () => {
    if (!profile) return;

    const savedAccessCode = profile.accessCode?.trim() || DEFAULT_ACCESS_CODE;
    const currentAccessCode = window.prompt("Enter your current access code.");
    if (currentAccessCode === null) return;

    if (currentAccessCode.trim() !== savedAccessCode) {
      alert("That is not the current access code.");
      return;
    }

    const newAccessCode = window.prompt(
      "Enter your new access code. It must be at least 4 characters."
    );
    if (newAccessCode === null) return;

    const cleanAccessCode = newAccessCode.trim();
    if (cleanAccessCode.length < 4) {
      alert("Please enter an access code with at least 4 characters.");
      return;
    }

    const updatedProfile = {
      ...profile,
      accessCode: cleanAccessCode,
    };
    const existingRegistry = getRegistry();
    const updatedRegistry = existingRegistry.some(
      (item) => item.storageKey === updatedProfile.storageKey
    )
      ? existingRegistry.map((item) =>
          item.storageKey === updatedProfile.storageKey ? updatedProfile : item
        )
      : [...existingRegistry, updatedProfile];

    saveRegistry(updatedRegistry);
    localStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(updatedProfile));
    setRegistry(updatedRegistry);
    setProfile(updatedProfile);
    setCloudStatus("Saving new access code to cloud...");

    try {
      await saveCloudProfile(updatedProfile);
      setCloudStatus("Access code updated and saved to cloud.");
    } catch (error: any) {
      console.warn("Could not save new access code to Supabase.", error);
      setCloudStatus(
        `Access code changed locally, but cloud sync failed: ${
          error?.message || "check Supabase settings."
        }`
      );
    }
  };

  const chooseAnswer = (questionIndex: number, optionIndex: number) => {
    if (submittedResult?.submitted) return;
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setCurrentAnswers((prev) => ({ ...prev, [selectedLesson.id]: updated }));
  };

  const submitQuiz = () => {
    if (submittedResult?.submitted) return;

    if (selectedAnswers.some((answer) => answer === -1)) {
      alert("Please answer all 10 questions before submitting.");
      return;
    }

    let score = 0;
    quiz.forEach((question, index) => {
      const displayedIndex = selectedAnswers[index];
      const originalIndex = question.originalOptionIndexes[displayedIndex];
      if (originalIndex === question.answer) {
        score += 1;
      }
    });

    const quizResult: QuizResult = {
      submitted: true,
      score,
      answers: selectedAnswers,
    };

    setQuizState((prev) => ({
      ...prev,
      [selectedLesson.id]: quizResult,
    }));

    if (profile) {
      setCloudStatus("Saving quiz result to cloud...");
      saveCloudLessonProgress(profile, selectedLesson.id, {
        completed: true,
        quizResult,
      })
        .then(() => setCloudStatus("Quiz result saved to cloud."))
        .catch((error) => {
          console.warn("Could not save quiz result to Supabase.", error);
          setCloudStatus(`Cloud sync failed: ${error?.message || "quiz not saved."}`);
        });
    }

    if (!completed.includes(selectedLesson.id)) {
      setCompleted((prev) => [...prev, selectedLesson.id].sort((a, b) => a - b));
    }
  };

  const handleScreenshotUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      alert("Please upload an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setScreenshots((prev) => ({
          ...prev,
          [selectedLesson.id]: result,
        }));

        if (profile) {
          setCloudStatus("Saving screenshot to cloud...");
          saveCloudLessonProgress(profile, selectedLesson.id, {
            completed: completed.includes(selectedLesson.id),
            quizResult: quizState[selectedLesson.id],
            screenshot: result,
          })
            .then(() => setCloudStatus("Screenshot saved to cloud."))
            .catch((error) => {
              console.warn("Could not save screenshot to Supabase.", error);
              setCloudStatus(`Cloud sync failed: ${error?.message || "screenshot not saved."}`);
            });
        }
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const clearScreenshot = () => {
    setScreenshots((prev) => {
      const updated = { ...prev };
      delete updated[selectedLesson.id];
      return updated;
    });

    if (profile) {
      setCloudStatus("Removing screenshot from cloud...");
      saveCloudLessonProgress(profile, selectedLesson.id, {
        completed: completed.includes(selectedLesson.id),
        quizResult: quizState[selectedLesson.id],
        screenshot: null,
      })
        .then(() => setCloudStatus("Screenshot removed from cloud."))
        .catch((error) => {
          console.warn("Could not remove screenshot from Supabase.", error);
          setCloudStatus(`Cloud sync failed: ${error?.message || "screenshot not removed."}`);
        });
    }
  };

  if (!profile) {
    return (
      <main
        style={{
          padding: 32,
          fontFamily: "Inter, Arial, sans-serif",
          maxWidth: 1120,
          margin: "0 auto",
          background: pastel.page,
          color: pastel.text,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            background:
              "linear-gradient(135deg, #fdf2f8 0%, #eff6ff 45%, #ecfeff 100%)",
            border: `1px solid ${pastel.border}`,
            borderRadius: 28,
            padding: 32,
            boxShadow: pastel.shadow,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 14,
                color: pastel.accent,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              APSR Computing Platform
            </div>
            <h1
              style={{
                fontSize: 48,
                lineHeight: 1.05,
                margin: "8px 0 10px",
                color: pastel.title,
              }}
            >
              APSR Year 8 Computing
            </h1>
            <p style={{ fontSize: 20, margin: 0, maxWidth: 860 }}>
              Variables and Loops in Scratch. Choose an existing
              pupil or create a new pupil learning space on this browser, or open the teacher dashboard.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <button
              onClick={() => setStartMode("existing")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border:
                  startMode === "existing"
                    ? "1px solid #c4b5fd"
                    : `1px solid ${pastel.border}`,
                background:
                  startMode === "existing"
                    ? "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)"
                    : pastel.panel,
                color: pastel.title,
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Choose Existing Pupil
            </button>

            <button
              onClick={() => setStartMode("new")}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border:
                  startMode === "new"
                    ? "1px solid #c4b5fd"
                    : `1px solid ${pastel.border}`,
                background:
                  startMode === "new"
                    ? "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)"
                    : pastel.panel,
                color: pastel.title,
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Create New Pupil
            </button>

            <a
              href="/teacher"
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: `1px solid ${pastel.border}`,
                background: pastel.panel,
                color: pastel.title,
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 16,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Teacher Dashboard
            </a>
          </div>

          {startMode === "new" ? (
            <div
              style={{
                background: "rgba(255,255,255,0.82)",
                border: `1px solid ${pastel.border}`,
                borderRadius: 24,
                padding: 24,
                display: "grid",
                gap: 18,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: pastel.title,
                }}
              >
                New Pupil
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontWeight: 700 }}>Class</label>
                <select
                  value={setupClass}
                  onChange={(event) => setSetupClass(event.target.value)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${pastel.border}`,
                    background: "#ffffff",
                    fontSize: 16,
                    color: pastel.title,
                  }}
                >
                  {CLASS_OPTIONS.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontWeight: 700 }}>Student Name</label>
                <input
                  value={setupStudentName}
                  onChange={(event) => setSetupStudentName(event.target.value)}
                  placeholder="Enter pupil name"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${pastel.border}`,
                    background: "#ffffff",
                    fontSize: 16,
                    color: pastel.title,
                  }}
                />
              </div>


              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontWeight: 700 }}>Access Code</label>
                <input
                  value={setupAccessCode}
                  onChange={(event) => setSetupAccessCode(event.target.value)}
                  placeholder="Default: 123456"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${pastel.border}`,
                    background: "#ffffff",
                    fontSize: 16,
                    color: pastel.title,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={startNewSession}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 16,
                    border: "none",
                    background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  Start Learning Space
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.82)",
                border: `1px solid ${pastel.border}`,
                borderRadius: 24,
                padding: 24,
                display: "grid",
                gap: 18,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: pastel.title,
                }}
              >
                Existing Pupils
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ fontWeight: 700 }}>Filter by Class</label>
                <select
                  value={existingClass}
                  onChange={(event) => setExistingClass(event.target.value)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: `1px solid ${pastel.border}`,
                    background: "#ffffff",
                    fontSize: 16,
                    color: pastel.title,
                  }}
                >
                  {CLASS_OPTIONS.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              {existingPupilsForClass.length === 0 ? (
                <div
                  style={{
                    border: `1px dashed ${pastel.border}`,
                    borderRadius: 18,
                    padding: 20,
                    background: pastel.panelSoft,
                    color: "#64748b",
                  }}
                >
                  No saved pupils found for {existingClass} on this browser yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {existingPupilsForClass.map((item) => (
                    <div
                      key={item.storageKey}
                      style={{
                        border: `1px solid ${pastel.border}`,
                        borderRadius: 18,
                        padding: 16,
                        background: "#ffffff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: pastel.title, fontSize: 18 }}>
                          {item.studentName}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 14 }}>{item.className}</div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                          type="password"
                          value={accessCodeInputs[item.storageKey] || ""}
                          onChange={(event) =>
                            setAccessCodeInputs((prev) => ({
                              ...prev,
                              [item.storageKey]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") openExistingPupil(item);
                          }}
                          placeholder="Access code"
                          style={{
                            width: 150,
                            padding: "10px 12px",
                            borderRadius: 999,
                            border: `1px solid ${pastel.border}`,
                            fontWeight: 700,
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => openExistingPupil(item)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 999,
                            border: "none",
                            background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                            color: "#ffffff",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif",
        maxWidth: 1500,
        margin: "0 auto",
        background: pastel.page,
        color: pastel.text,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #fdf2f8 0%, #eff6ff 45%, #ecfeff 100%)",
          border: `1px solid ${pastel.border}`,
          borderRadius: 28,
          padding: 28,
          boxShadow: pastel.shadow,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: pastel.accent,
                fontWeight: 700,
                letterSpacing: 0.3,
                marginBottom: 8,
              }}
            >
              APSR Computing Platform
            </div>

            <h1
              style={{
                fontSize: 50,
                lineHeight: 1.05,
                margin: "0 0 10px",
                color: pastel.title,
              }}
            >
              APSR Year 8 Computing
            </h1>

            <p style={{ fontSize: 22, margin: "0 0 12px" }}>
              Variables and Loops in Scratch
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 14,
                  color: pastel.title,
                }}
              >
                {profile.className}
              </span>

              <span
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 14,
                  color: pastel.title,
                }}
              >
                {profile.studentName}
              </span>

              <button
                onClick={switchLearner}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: pastel.panel,
                  color: pastel.title,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Switch Pupil
              </button>

              <button
                onClick={changeAccessCode}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: pastel.panelLilac,
                  color: pastel.title,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Change Code
              </button>

              <button
                onClick={exportCurrentLearnerData}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: pastel.panelMint,
                  color: pastel.title,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Export for Teacher
              </button>

              <button
                onClick={syncCurrentLearnerToCloud}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: pastel.panelBlue,
                  color: pastel.title,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sync Now
              </button>

              <button
                onClick={saveAndExit}
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  color: "#ffffff",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Save and Exit
              </button>

              <a
                href="/teacher"
                style={{
                  border: `1px solid ${pastel.border}`,
                  background: pastel.panel,
                  color: pastel.title,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Teacher Dashboard
              </a>

              <span
                style={{
                  background: cloudStatus.includes("failed")
                    ? pastel.roseSoft
                    : "rgba(255,255,255,0.8)",
                  border: cloudStatus.includes("failed")
                    ? "1px solid #fecdd3"
                    : `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 700,
                  fontSize: 13,
                  color: cloudStatus.includes("failed")
                    ? pastel.rose
                    : pastel.title,
                }}
              >
                {cloudStatus}
              </span>
            </div>
          </div>

          <div
            style={{
              minWidth: 340,
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${pastel.border}`,
              borderRadius: 22,
              padding: 18,
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
              }}
            >
              <span>Course Progress</span>
              <span>{progress}%</span>
            </div>

            <div
              style={{
                height: 14,
                background: "#e2e8f0",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                }}
              />
            </div>

            <div style={{ fontSize: 14, color: "#64748b" }}>
              {completed.length} of {lessons.length} lessons marked complete
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#166534",
                }}
              >
                Mastered: {masteredCount}
              </span>

              <span
                style={{
                  background: "#dbeafe",
                  border: "1px solid #93c5fd",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1d4ed8",
                }}
              >
                Platform: {selectedLesson.platform}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 28,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: pastel.panel,
            border: `1px solid ${pastel.border}`,
            borderRadius: 24,
            padding: 22,
            boxShadow: pastel.shadow,
            position: "sticky",
            top: 20,
            maxHeight: "calc(100dvh - 40px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            paddingBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: 34, margin: 0, color: pastel.title }}>
              Lessons
            </h2>

            <button
              onClick={resetCurrentLearnerProgress}
              style={{
                border: `1px solid ${pastel.border}`,
                background: pastel.panelLilac,
                color: pastel.title,
                borderRadius: 999,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              paddingRight: 4,
              paddingBottom: 12,
            }}
          >
            {(["Summer Term 1", "Summer Term 2"] as TermName[]).map((term) => (
              <div key={term} style={{ marginBottom: 22 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: pastel.accent,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 10,
                  }}
                >
                  {term}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {groupedLessons[term].map((lesson) => {
                    const lessonQuizCount = buildQuiz(lesson.id).length;
                    const stateLabel = getLessonStateLabel(
                      lesson.id,
                      completed,
                      quizState,
                      lessonQuizCount
                    );
                    const isSelected = lesson.id === selectedLessonId;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: 14,
                          borderRadius: 18,
                          border: isSelected
                            ? "1px solid #c4b5fd"
                            : `1px solid ${pastel.border}`,
                          background: isSelected
                            ? "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)"
                            : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "start",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: pastel.title }}>
                            {lesson.id}. {lesson.shortTitle}
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            Week {lesson.week} • {lesson.platform}
                          </div>
                        </div>

                        <span
                          style={{
                            background: stateLabel.bg,
                            border: `1px solid ${stateLabel.border}`,
                            color: stateLabel.text,
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stateLabel.label}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.45 }}>
                        {lesson.title}
                      </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section style={{ display: "grid", gap: 24 }}>
          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <span
                style={{
                  background: pastel.panelBlue,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 800,
                  color: pastel.title,
                }}
              >
                Lesson {selectedLesson.id}
              </span>

              <span
                style={{
                  background: selectedLesson.platform === "Scratch" ? pastel.panelPeach : pastel.panelMint,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 800,
                  color: pastel.title,
                }}
              >
                {selectedLesson.platform}
              </span>

              <span
                style={{
                  background: pastel.panelSoft,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 800,
                  color: pastel.title,
                }}
              >
                {selectedLesson.term}
              </span>
            </div>

            <h2
              style={{
                fontSize: 38,
                lineHeight: 1.1,
                margin: "0 0 8px",
                color: pastel.title,
              }}
            >
              {selectedLesson.title}
            </h2>

            <p style={{ fontSize: 19, margin: "0 0 16px", color: "#475569" }}>
              {selectedLesson.description}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <div
                style={{
                  background: pastel.panelBlue,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: pastel.accent, marginBottom: 8 }}>
                  OBJECTIVE
                </div>
                <div style={{ color: pastel.title, fontWeight: 700, lineHeight: 1.5 }}>
                  {selectedLesson.objective}
                </div>
              </div>

              <div
                style={{
                  background: pastel.panelMint,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: pastel.accent, marginBottom: 8 }}>
                  OVERVIEW
                </div>
                <div style={{ color: pastel.title, lineHeight: 1.6 }}>
                  {selectedLesson.overview}
                </div>
              </div>

              <div
                style={{
                  background: pastel.panelPeach,
                  border: `1px solid ${pastel.border}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: pastel.accent, marginBottom: 8 }}>
                  WHY IT MATTERS
                </div>
                <div style={{ color: pastel.title, lineHeight: 1.6 }}>
                  {selectedLesson.whyItMatters}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 24,
            }}
          >
            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 24,
                padding: 22,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: pastel.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Retrieval Starter
              </div>
              <div style={{ fontSize: 18, color: pastel.title, lineHeight: 1.6, fontWeight: 700 }}>
                {selectedLesson.retrievalQuestion}
              </div>
            </div>

            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 24,
                padding: 22,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: pastel.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Vocabulary
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selectedLesson.vocab.map((word) => (
                  <span
                    key={word}
                    style={{
                      background: pastel.accentSoft,
                      border: "1px solid #c4b5fd",
                      borderRadius: 999,
                      padding: "8px 12px",
                      fontWeight: 700,
                      color: "#5b21b6",
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: pastel.accent,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Guided Explanation
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {selectedLesson.teachingPoints.map((point, index) => (
                <div
                  key={`${selectedLesson.id}-teaching-${index}`}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "start",
                    background: index % 2 === 0 ? pastel.panelSky : pastel.slateSoft,
                    border: `1px solid ${pastel.border}`,
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      minWidth: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      color: pastel.accent,
                      background: "#ffffff",
                      border: `1px solid ${pastel.border}`,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ lineHeight: 1.6, color: pastel.title }}>{point}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: pastel.accent,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Step-by-Step Guide
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {selectedLesson.guidedSteps.map((step, index) => (
                <div
                  key={`${selectedLesson.id}-step-${index}`}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "start",
                    border: `1px solid ${pastel.border}`,
                    borderRadius: 16,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      minWidth: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      color: "#ffffff",
                      background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <a
                href={selectedLesson.projectLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  borderRadius: 999,
                  padding: "12px 16px",
                  background: pastel.panelLilac,
                  border: `1px solid ${pastel.border}`,
                  color: pastel.title,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Open {selectedLesson.platform}
              </a>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 24,
            }}
          >
            <div
              style={{
                background: pastel.panel,
                border: `1px solid ${pastel.border}`,
                borderRadius: 24,
                padding: 24,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: pastel.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Practice Task
              </div>
              <div style={{ fontSize: 18, color: pastel.title, lineHeight: 1.6 }}>
                {selectedLesson.practiceTask}
              </div>
            </div>

            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fdba74",
                borderRadius: 24,
                padding: 24,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#c2410c",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Challenge Mode
              </div>
              <div style={{ fontSize: 18, color: pastel.title, lineHeight: 1.6 }}>
                {selectedLesson.challengeTask}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                background: pastel.panelBlue,
                border: `1px solid ${pastel.border}`,
                borderRadius: 22,
                padding: 18,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: pastel.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Key Question
              </div>
              <div style={{ lineHeight: 1.6, color: pastel.title, fontWeight: 700 }}>
                {selectedLesson.keyQuestion}
              </div>
            </div>

            <div
              style={{
                background: pastel.roseSoft,
                border: "1px solid #fecdd3",
                borderRadius: 22,
                padding: 18,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#be123c",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Common Misconception
              </div>
              <div style={{ lineHeight: 1.6, color: pastel.title }}>
                {selectedLesson.misconception}
              </div>
            </div>

            <div
              style={{
                background: pastel.greenSoft,
                border: "1px solid #86efac",
                borderRadius: 22,
                padding: 18,
                boxShadow: pastel.shadow,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#166534",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Success Looks Like
              </div>
              <div style={{ lineHeight: 1.6, color: pastel.title }}>
                {selectedLesson.correctOutcome}
              </div>
            </div>
          </div>

          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: pastel.accent,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Watch Out For This
            </div>
            <div style={{ fontSize: 18, lineHeight: 1.6, color: pastel.title }}>
              {selectedLesson.wrongOutcome}
            </div>
          </div>

          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: pastel.accent,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Screenshot Upload
                </div>
                <div style={{ color: "#475569" }}>
                  Upload a screenshot of your work for this lesson.
                </div>
              </div>

              <label
                style={{
                  display: "inline-block",
                  borderRadius: 16,
                  padding: "12px 16px",
                  background: pastel.panelLilac,
                  border: `1px solid ${pastel.border}`,
                  fontWeight: 800,
                  color: pastel.title,
                  cursor: "pointer",
                }}
              >
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {selectedScreenshot ? (
              <div style={{ display: "grid", gap: 16 }}>
                <img
                  src={selectedScreenshot}
                  alt={`Lesson ${selectedLesson.id} screenshot`}
                  style={{
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "contain",
                    borderRadius: 18,
                    border: `1px solid ${pastel.border}`,
                    background: "#ffffff",
                  }}
                />

                <div>
                  <button
                    onClick={clearScreenshot}
                    style={{
                      border: "1px solid #fecdd3",
                      background: "#fff1f2",
                      color: "#be123c",
                      borderRadius: 16,
                      padding: "12px 16px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Remove Screenshot
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: `1px dashed ${pastel.border}`,
                  borderRadius: 18,
                  padding: 20,
                  background: pastel.slateSoft,
                  color: "#64748b",
                }}
              >
                No screenshot uploaded yet for this lesson.
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <button
                onClick={markComplete}
                style={{
                  border: "none",
                  background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                  color: "#ffffff",
                  borderRadius: 16,
                  padding: "14px 18px",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Mark Lesson Complete
              </button>
            </div>
          </div>

          <div
            style={{
              background: pastel.panel,
              border: `1px solid ${pastel.border}`,
              borderRadius: 24,
              padding: 24,
              boxShadow: pastel.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: pastel.accent,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  Quiz
                </div>
                <div style={{ color: "#475569" }}>
                  10 questions • randomised answers • one submission only
                </div>
              </div>

              {submittedResult?.submitted ? (
                <div
                  style={{
                    background:
                      scorePercent >= 80 ? "#dcfce7" : scorePercent >= 60 ? "#fef3c7" : "#fee2e2",
                    border:
                      scorePercent >= 80
                        ? "1px solid #86efac"
                        : scorePercent >= 60
                        ? "1px solid #fcd34d"
                        : "1px solid #fca5a5",
                    color:
                      scorePercent >= 80 ? "#166534" : scorePercent >= 60 ? "#92400e" : "#b91c1c",
                    borderRadius: 18,
                    padding: "12px 16px",
                    fontWeight: 800,
                  }}
                >
                  {submittedResult.score}/{quiz.length} • {scorePercent}% •{" "}
                  {getMasteryText(submittedResult.score, quiz.length)}
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {quiz.map((question, questionIndex) => (
                <div
                  key={`${selectedLesson.id}-question-${questionIndex}`}
                  style={{
                    border: `1px solid ${pastel.border}`,
                    borderRadius: 20,
                    padding: 18,
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: pastel.title,
                      fontSize: 18,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {questionIndex + 1}. {question.prompt}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {question.options.map((option, optionIndex) => {
                      const selected = selectedAnswers[questionIndex] === optionIndex;
                      const submitted = submittedResult?.submitted;
                      const selectedOriginalIndex = submittedResult?.submitted
                        ? question.originalOptionIndexes[submittedResult.answers[questionIndex]]
                        : null;
                      const thisOriginalIndex = question.originalOptionIndexes[optionIndex];
                      const isCorrect = submitted && thisOriginalIndex === question.answer;
                      const isWrongChosen =
                        submitted &&
                        selectedOriginalIndex !== null &&
                        submittedResult.answers[questionIndex] === optionIndex &&
                        selectedOriginalIndex !== question.answer;

                      return (
                        <button
                          key={`${selectedLesson.id}-${questionIndex}-${optionIndex}`}
                          onClick={() => chooseAnswer(questionIndex, optionIndex)}
                          style={{
                            textAlign: "left",
                            padding: "14px 16px",
                            borderRadius: 16,
                            border: isCorrect
                              ? "1px solid #86efac"
                              : isWrongChosen
                              ? "1px solid #fca5a5"
                              : selected
                              ? "1px solid #c4b5fd"
                              : `1px solid ${pastel.border}`,
                            background: isCorrect
                              ? "#ecfdf5"
                              : isWrongChosen
                              ? "#fef2f2"
                              : selected
                              ? "#f5f3ff"
                              : "#ffffff",
                            color: pastel.title,
                            cursor: submitted ? "default" : "pointer",
                            fontWeight: selected ? 800 : 600,
                          }}
                          disabled={submitted}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {submittedResult?.submitted ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 14,
                        background: "#f8fafc",
                        border: `1px solid ${pastel.border}`,
                        color: "#475569",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Correct answer:{" "}
                      <strong>{question.options[question.originalOptionIndexes.indexOf(question.answer)]}</strong>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              {submittedResult?.submitted ? (
                <div
                  style={{
                    background: pastel.panelBlue,
                    border: `1px solid ${pastel.border}`,
                    borderRadius: 18,
                    padding: 16,
                    color: pastel.title,
                    lineHeight: 1.6,
                  }}
                >
                  Quiz already submitted for this lesson. Retakes are disabled. Review the correct
                  answers above and improve your work if needed.
                </div>
              ) : (
                <button
                  onClick={submitQuiz}
                  style={{
                    border: "none",
                    background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    borderRadius: 16,
                    padding: "14px 18px",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
