# LearnLab Platform

## **An Adaptive Discrete Mathematics Practice Platform with Topic-Based Spaced Repetition**

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

LearnLab is a Progressive Web Application (PWA) designed to replace passive video consumption with active, algorithmically-scheduled problem-solving for discrete mathematics. It combats the "illusion of competence" by prioritizing retrieval practice over passive reading.

### Learning model

Learners **enroll** in the subtopics they want to study. Enrollment is what
isolates a learner's experience: questions, study sessions, and spaced-repetition
scheduling are all scoped to a learner's enrolled subtopics, so progress never
crosses between students or leaks in from subtopics they haven't started.
Scheduling is driven by the **FSRS-5** spaced-repetition algorithm, which tracks
per-subtopic memory state (stability, difficulty, next-review date) and resurfaces
each subtopic exactly when a learner is about to forget it.
