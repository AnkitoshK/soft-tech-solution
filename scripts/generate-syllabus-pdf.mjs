import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Output path
const outputPath = path.resolve('public', 'syllabus-web-development-course.pdf');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 14;
const contentWidth = pageWidth - margin * 2;
let y = margin;

function checkPage(heightNeeded = 12) {
  if (y + heightNeeded > pageHeight - margin - 8) {
    addFooter();
    doc.addPage();
    y = margin + 4;
    addHeaderSmall();
  }
}

function addFooter() {
  const current = doc.internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Soft Tech Solution — Full Stack Web Development Industrial Cohort (6 Months / 24 Weeks)',
    margin,
    pageHeight - 8
  );
  doc.text(`Page ${current}`, pageWidth - margin - 12, pageHeight - 8);
}

function addHeaderSmall() {
  doc.setFontSize(8);
  doc.setTextColor(233, 119, 45); // Orange
  doc.setFont('helvetica', 'bold');
  doc.text('SOFT TECH SOLUTION | INDUSTRIAL TRAINING & SYLLABUS ROADMAP', margin, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
}

// ================= PAGE 1: TITLE & COVER =================
// Top Banner
doc.setFillColor(15, 23, 42); // #0f172a
doc.rect(margin, y, contentWidth, 38, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.text('SOFT TECH SOLUTION', margin + 6, y + 10);

doc.setFontSize(12);
doc.setTextColor(233, 119, 45);
doc.text('WEB DEVELOPMENT COURSE — OFFICIAL SYLLABUS', margin + 6, y + 18);

doc.setFontSize(9);
doc.setTextColor(203, 213, 225);
doc.setFont('helvetica', 'normal');
doc.text('Complete Syllabus, Learning Roadmap & Industrial Training Strategy', margin + 6, y + 25);
doc.text('Mentored by MCA Software Engineers (Ex-Tata Power & Railworld)', margin + 6, y + 31);

y += 44;

// Quick Stats Grid Box
doc.setFillColor(248, 250, 252);
doc.setDrawColor(226, 232, 240);
doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text('• Duration: 6 Months (24 Weeks)', margin + 5, y + 8);
doc.text('• Schedule: Mon–Fri, 8:00 PM – 9:00 PM', margin + 5, y + 15);
doc.text('• Sundays: Weekly Interview Prep & Assessment', margin + 5, y + 22);

doc.text('• Approach: Fundamentals -> Exercises -> Projects -> Deploy', margin + 92, y + 8);
doc.text('• Portal: softtechsolution.in/training', margin + 92, y + 15);
doc.text('• Mode: Live Online + Mentor Code Reviews', margin + 92, y + 22);

y += 36;

// Course Objective
doc.setFillColor(254, 243, 199);
doc.setDrawColor(251, 191, 36);
doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

doc.setFontSize(9.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(146, 64, 14);
doc.text('COURSE OBJECTIVE', margin + 4, y + 6);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(69, 26, 3);
const objLines = doc.splitTextToSize(
  'To develop practical skills in frontend web development, database management, version control, AI-assisted coding, website deployment, and interview preparation. By the end of the course, learners should be able to design responsive websites, build interactive React applications, manage databases, use GitHub collaboratively, and deploy a project online.',
  contentWidth - 8
);
doc.text(objLines, margin + 4, y + 11);

y += 28;

// Helper to render module
function renderModule(modNum, title, duration, topics, tasks, outcome) {
  checkPage(30);

  // Module Header Bar
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`MODULE ${modNum}: ${title.toUpperCase()}`, margin + 3, y + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(233, 119, 45);
  doc.text(`Duration: ${duration}`, pageWidth - margin - 35, y + 4.8);

  y += 9;

  // Topics
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Topics Covered:', margin + 2, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  topics.forEach((t) => {
    checkPage(5);
    const split = doc.splitTextToSize(`• ${t}`, contentWidth - 4);
    doc.text(split, margin + 2, y);
    y += split.length * 3.4;
  });

  // Practical Tasks
  if (tasks && tasks.length > 0) {
    checkPage(6);
    y += 1;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Practical Tasks:', margin + 2, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    tasks.forEach((tk) => {
      checkPage(5);
      const split = doc.splitTextToSize(`  - ${tk}`, contentWidth - 6);
      doc.text(split, margin + 2, y);
      y += split.length * 3.4;
    });
  }

  // Outcome
  if (outcome) {
    checkPage(6);
    y += 1;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    const outText = doc.splitTextToSize(`Learning Outcome: ${outcome}`, contentWidth - 4);
    doc.text(outText, margin + 2, y);
    y += outText.length * 3.6 + 3;
  }
}

// MODULE 1
renderModule(
  1,
  'HTML3 Fundamentals & HTML5',
  'Weeks 1–2',
  [
    'Introduction to the web, browsers, servers, and websites',
    'HTML structure, tags, elements, and attributes',
    'HTML3: legacy concepts and historical overview',
    'HTML5 document structure and modern standards',
    'Headings, paragraphs, links, images, and lists',
    'Tables, forms, inputs, buttons, and validation',
    'Semantic elements: header, nav, main, section, article, footer',
    'Audio, video, iframe, and embedded content',
    'HTML entities, metadata, favicon, and page titles',
    'Accessibility basics, SEO-friendly structure, and best practices'
  ],
  [
    'Create a personal profile webpage',
    'Build a registration form',
    'Develop a multi-page portfolio using HTML'
  ],
  'Build structured, accessible web pages using modern HTML5.'
);

// MODULE 2
renderModule(
  2,
  'CSS — Styling & Responsive Design',
  'Weeks 3–5',
  [
    'CSS syntax, selectors, properties, and values (inline, internal, external)',
    'Colors, backgrounds, borders, shadows, and gradients',
    'Units: px, %, em, rem, vh, and vw | Typography, fonts, text alignment, and icons',
    'Box model, margin, padding, borders, display, position, z-index, overflow',
    'Flexbox and CSS Grid layout systems',
    'Pseudo-classes, pseudo-elements, combinators',
    'Transitions, transforms, animations, and keyframes',
    'Responsive design, media queries, and mobile-first layouts',
    'CSS variables, reusable styles, and browser developer tools'
  ],
  [
    'Design a responsive landing page',
    'Create a navigation bar and card layouts',
    'Build a responsive portfolio website',
    'Reproduce a sample webpage from a reference design'
  ],
  'Design attractive, responsive websites for mobile, tablet, and desktop.'
);

// MODULE 3
renderModule(
  3,
  'JavaScript — Programming & DOM',
  'Weeks 6–10',
  [
    'JavaScript setup, browser console, variables (var, let, const), data types',
    'Operators, type conversion, conditional statements, and switch',
    'Loops: for, while, do-while, for...of, and for...in',
    'Functions, parameters, return values, arrow functions, scope, closures, hoisting',
    'Arrays, objects, destructuring, and spread/rest operators',
    'Array methods: map, filter, find, reduce, and forEach',
    'DOM selection, manipulation, event handling, and form validation',
    'ES6+ modules, error handling (try/catch), JSON, localStorage, sessionStorage',
    'Callbacks, promises, async/await, event loop, Fetch API & REST fundamentals'
  ],
  [
    'Calculator application',
    'To-do list with localStorage persistence',
    'Interactive form validation system',
    'Search and filter interface',
    'Live weather application using a public REST API'
  ],
  'Write interactive JavaScript applications and master asynchronous programming.'
);

// MODULE 4
renderModule(
  4,
  'Git & GitHub — Version Control',
  'Week 11',
  [
    'Git vs GitHub: core differences and industry use cases',
    'Repository initialization (git init, status, add, commit, log)',
    'Branching: git branch, checkout/switch, and merge',
    'Remote repositories, origin, git push, pull, fetch, and clone',
    'Pull requests, code review basics, merge conflicts and resolution',
    '.gitignore, README.md, branching workflows, and commit conventions'
  ],
  [
    'Push all previous assignments to GitHub',
    'Create feature branches and merge changes',
    'Resolve a simulated merge conflict',
    'Maintain a clean project repository with documentation'
  ],
  'Manage project code safely and collaboratively using Git and GitHub.'
);

// MODULE 5
renderModule(
  5,
  'MySQL, MySQL Workbench & XAMPP',
  'Weeks 12–14',
  [
    'Database fundamentals: relational schemas, tables, rows, columns',
    'MySQL installation, Workbench setup, and XAMPP local environment',
    'Starting/stopping services, database & table creation, constraints, keys',
    'CRUD queries: INSERT, SELECT, UPDATE, DELETE with WHERE, ORDER BY, GROUP BY, HAVING',
    'Aggregate functions, aliases, Joins (INNER, LEFT, RIGHT, Self joins)',
    'Subqueries, views, indexes, normalization, transactions, and ACID basics',
    'Database design, ER diagrams, import, export, backup, and restore'
  ],
  [
    'Create a student management database schema',
    'Design an employee management database',
    'Write complex CRUD queries and multi-table joins',
    'Build an ER diagram and database schema'
  ],
  'Design relational databases and write practical SQL queries using MySQL tools.'
);

// MODULE 6
renderModule(
  6,
  'ChatGPT & Effective Prompting',
  'Week 15',
  [
    'Understanding AI assistants, strengths, and limitations',
    'Writing clear, specific prompts with context, requirements, and examples',
    'Prompting for HTML, CSS, JavaScript, React, and SQL',
    'Asking ChatGPT to explain code line by line, debugging errors with logs',
    'Generating test cases, edge cases, project documentation, and code reviews',
    'Security practices: avoiding sharing passwords, API keys, or private data'
  ],
  [
    'Convert a business requirement into a structured coding prompt',
    'Debug a JavaScript runtime error using AI assistance',
    'Generate SQL queries and validate their results',
    'Use ChatGPT to plan and document a mini-project'
  ],
  'Use AI productively while understanding and verifying code rather than blindly copying.'
);

// MODULE 7
renderModule(
  7,
  'React.js — Frontend Development',
  'Weeks 16–20',
  [
    'React component-based architecture, Node.js, npm, and dev server',
    'JSX syntax, functional components, props, and composition',
    'State management with useState, event handling, and conditional rendering',
    'List rendering with keys, forms, and controlled components',
    'useEffect and component lifecycle concepts, Fetch API & integration',
    'Loading, error, and empty states; React Router & multi-page navigation',
    'Context API (useContext), custom hooks, project structure, and performance'
  ],
  [
    'Build reusable component design library',
    'Create a product listing and live search interface',
    'Build a multi-page React web application',
    'Connect React frontends to external REST APIs'
  ],
  'Build maintainable, component-based frontend applications using React.js.'
);

// MODULE 8
renderModule(
  8,
  'PostgreSQL & Neon Database',
  'Week 21',
  [
    'PostgreSQL fundamentals, comparison with MySQL, and data types',
    'Neon serverless PostgreSQL introduction and project creation',
    'Connecting using connection strings and pooling concepts',
    'Tables, constraints, relationships, CRUD queries, joins, and aggregation',
    'Environment variables, database credentials, security, and backups'
  ],
  [
    'Create a Neon serverless PostgreSQL database',
    'Design tables for the final capstone project',
    'Run CRUD queries and verify results',
    'Configure database credentials securely'
  ],
  'Create and manage cloud-hosted PostgreSQL databases.'
);

// MODULE 9
renderModule(
  9,
  'Vercel — Website Hosting & Deployment',
  'Week 22',
  [
    'Hosting, domains, DNS, and HTTPS fundamentals',
    'Static hosting vs serverless execution; Connecting GitHub to Vercel',
    'Deploying React applications, build commands, and output directories',
    'Environment variables and production configuration',
    'Preview vs Production deployments, auto-deploy on git push, logs & debugging'
  ],
  [
    'Deploy a React project to Vercel',
    'Configure environment variables in Vercel project settings',
    'Push to GitHub and verify automatic redeployment',
    'Test live website responsiveness on mobile, tablet, and desktop'
  ],
  'Publish websites to production and understand modern CI/CD deployment workflows.'
);

// MODULE 10
renderModule(
  10,
  'Final Project & Portfolio',
  'Week 23',
  [
    'Capstone Project: Employee Management System / Job Portal',
    'Responsive interface using HTML, CSS, and React.js',
    'Reusable React components, page navigation, forms, validation, and filtering',
    'Database design using PostgreSQL on Neon with CRUD access layer',
    'GitHub repository documentation and live Vercel deployment'
  ],
  [
    'Requirement analysis and UI planning',
    'Database schema and component architecture design',
    'Frontend implementation and API integration',
    'Live deployment on Vercel with presentation demonstration'
  ],
  'Complete and present a practical project demonstrating end-to-end full stack skills.'
);

// MODULE 11
renderModule(
  11,
  'Revision, Testing & Final Assessment',
  'Week 24',
  [
    'Comprehensive revision of HTML, CSS, JavaScript, and React',
    'SQL query practice, database design review, and GitHub workflow revision',
    'AI prompt-writing and code review exercises',
    'Final practical assessment, code improvements, and portfolio review',
    'Resume and LinkedIn project presentation discussion'
  ],
  [
    'Final practical assessment execution',
    'Complete code review and performance optimization',
    'Resume and portfolio project walkthrough'
  ],
  'Consolidate all knowledge and prepare to explain and demonstrate projects with confidence.'
);

// ================= SUNDAY INTERVIEW SCHEDULE =================
checkPage(24);
doc.setFillColor(15, 23, 42);
doc.rect(margin, y, contentWidth, 7, 'F');
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('WEEKLY INTERVIEW PREPARATION — EVERY SUNDAY (24 WEEKS)', margin + 3, y + 4.8);
y += 10;

doc.setFontSize(7.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(30, 41, 59);

const sundays = [
  'Sunday 1: HTML fundamentals and common interview questions',
  'Sunday 2: HTML5, forms, semantic elements, and accessibility',
  'Sunday 3: CSS selectors, box model, and specificity',
  'Sunday 4: Flexbox, Grid, and responsive design',
  'Sunday 5: CSS practical tasks and layout debugging',
  'Sunday 6: JavaScript variables, data types, and operators',
  'Sunday 7: Conditions, loops, and coding problems',
  'Sunday 8: Functions, scope, and closures',
  'Sunday 9: Arrays, objects, and array methods',
  'Sunday 10: DOM, events, and form validation',
  'Sunday 11: Promises, async/await, and API questions',
  'Sunday 12: Git commands, branching, push/pull, and conflicts',
  'Sunday 13: SQL fundamentals and CRUD queries',
  'Sunday 14: Joins, subqueries, indexes, and database design',
  'Sunday 15: ChatGPT prompting, debugging, and code review',
  'Sunday 16: React components, JSX, and props',
  'Sunday 17: State, events, and conditional rendering',
  'Sunday 18: Hooks and lifecycle concepts',
  'Sunday 19: Routing, forms, and API integration',
  'Sunday 20: React coding test and debugging',
  'Sunday 21: PostgreSQL and Neon database questions',
  'Sunday 22: Vercel deployment and GitHub integration',
  'Sunday 23: Final project review and project-based questions',
  'Sunday 24: Mock interview, technical assessment, and feedback'
];

// 2 column layout for sundays
const colWidth = (contentWidth - 6) / 2;
for (let i = 0; i < sundays.length; i += 2) {
  checkPage(5);
  doc.text(`• ${sundays[i]}`, margin + 2, y);
  if (sundays[i + 1]) {
    doc.text(`• ${sundays[i + 1]}`, margin + 4 + colWidth, y);
  }
  y += 4;
}

y += 4;

// ================= DAILY STRATEGY & OUTCOME =================
checkPage(25);
doc.setFillColor(248, 250, 252);
doc.setDrawColor(226, 232, 240);
doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

doc.setFontSize(8.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text('DAILY LEARNING STRATEGY (Monday–Friday | 8:00 PM – 9:00 PM)', margin + 4, y + 5);

doc.setFontSize(7.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(51, 65, 85);
doc.text('• 8:00–8:10 PM: Revise previous lesson | 8:10–8:35 PM: Learn new concept', margin + 4, y + 10);
doc.text('• 8:35–8:55 PM: Hands-on coding exercises | 8:55–9:00 PM: Summarize & note doubts', margin + 4, y + 14);
doc.text('• Saturday: Self-practice & assignment work | Sunday: Dedicated interview preparation', margin + 4, y + 18);

y += 28;

// Final Footer on last page
addFooter();

// Save to disk
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`✅ PDF successfully generated at: ${outputPath} (${pdfBuffer.length} bytes)`);
