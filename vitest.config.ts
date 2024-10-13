import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Enable coverage reporting
        coverage: {
            provider: 'istanbul', // Use Istanbul for coverage
            reporter: [
                'text', // Output coverage to console
                ['text', { file: 'report.txt' }], // Output coverage to coverage.txt
            ],
            reportsDirectory: 'coverage',
            thresholds: {
                lines: 100,
                functions: 100,
                branches: 100,
                statements: 100,
            }
        },
    },
});
