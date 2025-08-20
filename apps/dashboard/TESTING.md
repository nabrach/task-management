# Dashboard App Testing Guide

This document provides comprehensive information about testing the Dashboard application using Jest and Karma.

## Test Configuration

### Karma Configuration
- **File**: `karma.conf.js`
- **Coverage**: Configured to generate HTML, text-summary, and LCOV reports
- **Coverage Thresholds**: 80% for statements, branches, functions, and lines
- **Browsers**: Chrome (with headless option for CI)
- **Watch Mode**: Enabled for development

### Test Setup
- **File**: `src/test.ts`
- **Environment**: Angular testing environment with Zone.js
- **Framework**: Jasmine with Angular testing utilities

## Test Scripts

```bash
# Run tests in watch mode (default)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (headless, no watch, with coverage)
npm run test:ci

# Run tests in debug mode
npm run test:debug
```

## Test Structure

### Services Tests
All services are thoroughly tested with mocked HTTP requests and comprehensive error handling scenarios.

#### AuthService (`auth.service.spec.ts`)
- **Coverage**: Login, register, logout, token management, user state
- **Mocking**: HTTP requests, sessionStorage, JWT token validation
- **Scenarios**: Success cases, error handling, edge cases, token expiration

#### TasksService (`tasks.service.spec.ts`)
- **Coverage**: CRUD operations, HTTP methods, error responses
- **Mocking**: HTTP requests, various response types
- **Scenarios**: Success, validation errors, server errors, not found cases

#### UsersService (`users.service.spec.ts`)
- **Coverage**: User fetching, organization-based queries, error handling
- **Mocking**: HTTP requests, different user data structures
- **Scenarios**: Success, empty results, organization not found, validation errors

#### ThemeService (`theme.service.spec.ts`)
- **Coverage**: Theme switching, localStorage persistence, system preferences
- **Mocking**: localStorage, matchMedia, DOM manipulation
- **Scenarios**: Light/dark themes, system preference detection, persistence

### Component Tests
All components are tested with mocked dependencies and comprehensive input/output validation.

#### TaskAnalyticsComponent (`task-analytics.component.spec.ts`)
- **Coverage**: Chart updates, statistics calculations, data processing
- **Mocking**: ChangeDetectorRef, chart data structures
- **Scenarios**: Empty data, various task statuses, edge cases, chart configurations

#### LoginComponent (`login.component.spec.ts`)
- **Coverage**: Form submission, authentication flow, error handling
- **Mocking**: AuthService, Router, HTTP responses
- **Scenarios**: Success, validation errors, network errors, navigation

#### RegisterComponent (`register.component.spec.ts`)
- **Coverage**: User registration, form validation, organization loading
- **Mocking**: AuthService, Router, HTTP responses
- **Scenarios**: Success, validation errors, organization selection, data cleaning

#### DashboardComponent (`dashboard.component.spec.ts`)
- **Coverage**: User management, task loading, navigation
- **Mocking**: AuthService, Router, ChangeDetectorRef, TasksComponent
- **Scenarios**: User login/logout, ViewChild lifecycle, error handling

#### TasksComponent (`tasks.component.spec.ts`)
- **Coverage**: Task management, drag & drop, permissions, CRUD operations
- **Mocking**: TasksService, AuthService, UsersService, ChangeDetectorRef
- **Scenarios**: Task creation/editing, permissions, filtering, sorting, analytics

#### TaskFormComponent (`task-form.component.spec.ts`)
- **Coverage**: Form validation, data cleaning, input handling
- **Mocking**: FormBuilder, ReactiveFormsModule
- **Scenarios**: Create/edit modes, validation, data transformation, edge cases

#### TaskListComponent (`task-list.component.spec.ts`)
- **Coverage**: Task display, event emission, date formatting
- **Mocking**: Task data, event emitters
- **Scenarios**: Task operations, date handling, event handling, edge cases

#### DataDisplayComponent (`data-display.spec.ts`)
- **Coverage**: HTTP data fetching, error handling, data processing
- **Mocking**: HttpClient, HTTP responses
- **Scenarios**: Success, network errors, various HTTP status codes, data structures

### Guard Tests
Authentication and authorization logic is thoroughly tested.

#### AuthGuard (`auth.guard.spec.ts`)
- **Coverage**: Route protection, authentication checks, navigation
- **Mocking**: AuthService, Router, user state
- **Scenarios**: Authenticated access, unauthenticated redirects, token validation

### Interceptor Tests
HTTP request/response interception is tested comprehensively.

#### AuthInterceptor (`auth.interceptor.spec.ts`)
- **Coverage**: Token injection, error handling, authentication failures
- **Mocking**: HTTP requests, responses, errors
- **Scenarios**: Token addition, 401 handling, error propagation, header management

## Test Patterns

### Mocking Strategy
- **Services**: Mocked with `jasmine.createSpyObj`
- **HTTP**: `HttpClientTestingModule` with `HttpTestingController`
- **Router**: Mocked navigation methods
- **Storage**: Mocked localStorage/sessionStorage
- **DOM**: Mocked document methods and properties

### Test Organization
- **Describe blocks**: Logical grouping of related tests
- **BeforeEach**: Setup common test state
- **AfterEach**: Cleanup and verification
- **Nested describes**: Detailed test categorization

### Assertion Patterns
- **HTTP requests**: Verify method, URL, headers, body
- **Service calls**: Verify method calls with correct parameters
- **State changes**: Verify component/service state updates
- **Navigation**: Verify router calls with correct routes
- **Error handling**: Verify error scenarios and recovery

## Coverage Goals

### Current Coverage
- **Statements**: Target 80%
- **Branches**: Target 80%
- **Functions**: Target 80%
- **Lines**: Target 80%

### Coverage Areas
- **Happy Path**: All success scenarios
- **Error Handling**: All error conditions and edge cases
- **Edge Cases**: Boundary conditions, null/undefined handling
- **Integration**: Component interaction and service communication

## Running Tests

### Development
```bash
# Start tests in watch mode
npm test

# Tests will automatically re-run when files change
```

### Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# Coverage reports available in:
# - HTML: coverage/dashboard/index.html
# - LCOV: coverage/dashboard/lcov.info
# - Console: Summary in terminal
```

### Continuous Integration
```bash
# Run tests for CI environment
npm run test:ci

# Headless mode, no watch, with coverage
# Suitable for automated testing environments
```

## Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Opens Chrome browser for debugging
# Set breakpoints in test files
```

### Console Logging
- Tests include comprehensive console logging for debugging
- Use `spyOn(console, 'log')` to verify logging behavior
- Logs help track component lifecycle and state changes

### Test Isolation
- Each test is isolated with proper setup/teardown
- Mock objects are recreated for each test
- No shared state between tests

## Best Practices

### Test Naming
- Use descriptive test names that explain the scenario
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests in describe blocks

### Mock Management
- Create mocks in beforeEach for consistent setup
- Use type-safe mocking with proper interfaces
- Verify mock calls to ensure correct behavior

### Error Testing
- Test both success and failure scenarios
- Verify error handling and recovery
- Test edge cases and boundary conditions

### Async Testing
- Use proper async test patterns with done() callback
- Handle Observable streams correctly
- Test timing and state changes

## Troubleshooting

### Common Issues
1. **Mock not working**: Ensure proper TestBed configuration
2. **Async test failures**: Check done() callback usage
3. **Coverage gaps**: Add tests for untested code paths
4. **Test isolation**: Verify proper beforeEach/afterEach setup

### Debug Tips
1. Use `fdescribe` to focus on specific test suites
2. Use `fit` to focus on specific tests
3. Add console.log statements for debugging
4. Check mock configurations and return values

## Future Improvements

### Planned Enhancements
- **E2E Testing**: Add Cypress or Playwright tests
- **Performance Testing**: Add performance benchmarks
- **Accessibility Testing**: Add a11y testing utilities
- **Visual Regression**: Add visual testing capabilities

### Test Maintenance
- **Regular Updates**: Keep test dependencies current
- **Coverage Monitoring**: Track coverage trends over time
- **Test Refactoring**: Improve test structure and readability
- **Documentation**: Keep testing guide updated

## Conclusion

This comprehensive testing suite ensures the Dashboard application is robust, reliable, and maintainable. The tests cover all major functionality, edge cases, and error scenarios, providing confidence in the application's behavior across different conditions and user interactions.
