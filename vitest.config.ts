import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Enable coverage reporting
        coverage: {
            provider: 'istanbul', // Use Istanbul for coverage
            reporter: [
                ['text', { file: 'report.txt' }], // Output coverage to coverage.txt
            ],
            reportsDirectory: 'coverage',
            // Minimum coverage thresholds
            lines: 80,
            functions: 80,
            branches: 70,
            statements: 80,
        },
    },
});