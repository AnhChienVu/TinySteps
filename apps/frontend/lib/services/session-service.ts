export async function createAppSession() {
  const response = await fetch('/api/session', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Unable to create a login session.');
  }
}

export async function clearAppSession() {
  const response = await fetch('/api/session', {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Unable to clear the login session.');
  }
}
