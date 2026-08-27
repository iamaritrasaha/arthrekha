# Arthrekha

**India's public finances, made visible.**

Arthrekha is a production-quality public finance exploration website that helps ordinary people in India understand how the Union Government raises money, allocates it, spends it, borrows, services debt, and performs against its budget through beautiful interactive visualizations and plain-language explanations.

## Vision

Help anyone — including people with almost no finance or economics background — understand Indian government finances through:

- Interactive visual storytelling
- Budget execution tracking
- Plain-language education
- Historical context
- Meticulous data provenance

## V1 Scope

**Union Government of India**

- Overview (expenditure, receipts, deficits)
- Allocation by ministries and sectors
- Execution tracking (Budget vs Actual)
- Historical trends (5-10 years)
- Debt and interest burden
- Beginner-friendly explanations

Future expansion will cover Indian states.

## Philosophy

We don't dumb down the data. We make sophisticated data understandable.

## Key Features

- **₹100 Mode**: "Where does ₹100 of government spending go?"
- **Budget → Reality**: Track actual spending vs budget estimates
- **Explain Everything**: Contextual education for every technical term
- **Data Provenance**: Every number is traceable to its official source
- **Political Neutrality**: Show data, explain terminology, provide context

## Official Data Sources

Prioritized hierarchy:

1. Union Budget / Ministry of Finance
2. Controller General of Accounts (CGA)
3. Department of Economic Affairs (DEA)
4. Reserve Bank of India (RBI)
5. Comptroller and Auditor General of India (CAG)
6. State Finance Departments
7. data.gov.in

## Technology

- **Frontend**: React + TypeScript + Vite
- **Data Pipeline**: Python
- **Visualization**: D3, Recharts/ECharts
- **Design**: Editorial + analytical + calm + premium

## Project Structure

```
arthrekha/
├── app/                    # Application entry
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── charts/            # Visualization components
│   ├── features/          # Feature modules
│   ├── pages/             # Page components
│   ├── data/              # Client-side data utilities
│   ├── lib/               # Utilities
│   ├── types/             # TypeScript types
│   └── content/           # Educational content
├── pipeline/              # Data engineering
│   ├── sources/           # Source definitions
│   ├── parsers/           # PDF/Excel parsers
│   ├── normalizers/       # Data normalization
│   ├── validators/        # Data validation
│   └── scripts/           # ETL scripts
├── datasets/              # Data storage
│   ├── raw/               # Original source files
│   ├── processed/         # Normalized JSON
│   └── metadata/          # Provenance records
├── public/                # Static assets
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## Development Principles

1. **No Fake Data**: Never invent government financial numbers
2. **Provenance First**: Every metric must be traceable
3. **Beginner-First**: Make technical terms understandable
4. **Accounting Precision**: Distinguish BE/RE/Actual clearly
5. **Political Neutrality**: Show facts, not opinions
6. **Mobile-First**: Charts work on phones
7. **Accessibility**: WCAG-conscious, keyboard accessible
8. **Performance**: Fast first load, optimized assets

## Getting Started

(Instructions will be added as setup is completed)

## License

(To be determined)

## Contact

(To be determined)
