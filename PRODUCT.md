# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals managing personal work. They need a clear, fast way to collect tasks and move them through their own workflow.

## Product Purpose

Taskstack is a private, account-based personal todo board. Success means a person can sign in, see their work at a glance, add a task without friction, and move it from planned to complete.

## Positioning

Each account owns a single focused Trello-style board: the spatial clarity of a kanban board without team administration or collaboration noise.

## Operating Context

Users revisit the board throughout a workday, often to capture a task quickly or to reprioritize work by dragging it between columns.

## Capabilities and Constraints

- Vue web client with Express API.
- MongoDB is provided by the local development environment.
- Account creation, login, logout, and authenticated personal todos.
- Todos can be created, edited, and moved among Backlog, In progress, and Done.
- Authentication is a short-lived JWT in an HttpOnly cookie; tokens are not persisted in localStorage.

## Brand Commitments

Neo-brutalist interface requested by the user, with a Trello-inspired board workflow.

## Evidence on Hand

No production content or visual assets were supplied. Board tasks shown before a user creates their own are synthetic demonstration content.

## Product Principles

- Make the next action obvious.
- Keep each account's work private and separate.
- Let movement across the board communicate progress.
- Prefer direct manipulation over configuration.
