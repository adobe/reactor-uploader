module.exports = {
  auth: jest.fn().mockImplementation(() => Promise.resolve({ 'access_token': 'auto mocked access token' }))
}
