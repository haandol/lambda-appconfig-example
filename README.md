# CDK Lambda Appconfig Example

Managing dynamically updating configurations with AWS AppConfig can help you avoid cold-start when you invoke a lambda.

# Prerequisites

- awscli
- Nodejs 12.16+
- Python 3.8
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ cd infra
$ npm i
```

Install cdk in global context and run `cdk bootstrap` if you did not initailize cdk yet.

```bash
$ npm i -g cdk@1.112.0
$ cdk bootstrap
```

Deploy CDK Stacks on AWS

```bash
$ cdk deploy "*" --require-approval never
```

# Usage

1. invoking lambda for the first time will be cold-started

2. change `configContent` on [**infra/lib/interfaces/config.ts**](/infra/lib/interfaces/config.ts)

3. run `cdk deploy` again.

4. further invokings would returns updated configurations but they were not cold-started.