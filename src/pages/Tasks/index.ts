// src/pages/Tasks/index.ts
export { default as TasksManager } from './TasksManager';
export { default as TasksAuthor } from './TasksAuthor';

// Для обратной совместимости (если где-то используется старый импорт)
export { default } from './TasksManager';