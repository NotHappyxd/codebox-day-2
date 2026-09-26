const users = [
  { id: 1, name: 'Alex' },
  { id: 2, name: 'Sam' },
];

export function getUsers() {
  return users;
}

export function findUserById(id) {
  return users.find((user) => user.id === id);
}
