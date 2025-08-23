describe('App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('shows the Memories title', async () => {
    await expect(element(by.text('Memories'))).toBeVisible();
  });
});
