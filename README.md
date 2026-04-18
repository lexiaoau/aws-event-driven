# AWS Event-Driven Architecture

> **DynamoDB Streams → EventBridge Pipes → Lambda → SNS**

An event-driven notification pipeline built with AWS CDK (TypeScript). Changes captured in DynamoDB are streamed through EventBridge Pipes, processed by a Lambda function, and published to SNS for downstream consumers.

---

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌────────────┐    ┌─────┐
│  DynamoDB   │───▶│ EventBridge Pipes│───▶│   Lambda   │───▶│ SNS │
│   (Table)   │    │   (Filter/Enrich)│    │ (Process)  │    │     │
└─────────────┘    └──────────────────┘    └────────────┘    └─────┘
      │
 DynamoDB Streams
 (INSERT / MODIFY / REMOVE)
```

| Component | Role |
|---|---|
| **DynamoDB Streams** | Captures item-level changes (INSERT, MODIFY, REMOVE) in real time |
| **EventBridge Pipes** | Routes and optionally filters/enriches stream records before invoking Lambda |
| **Lambda** | Processes the event payload and publishes structured notifications |
| **SNS** | Fans out notifications to subscribed endpoints (email, SQS, HTTP, etc.) |

---

## Prerequisites

- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) v2 (`npm install -g aws-cdk`)
- AWS CLI configured with appropriate credentials (`aws configure`)
- An AWS account bootstrapped for CDK:

```bash
cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

---

## Project Structure

```
aws-event-driven/
├── bin/                  # CDK app entry point
├── lambda/               # Lambda function source code
├── lib/                  # CDK stack definition
│   └── aws-event-driven-stack.ts
├── cdk.json              # CDK configuration
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Build the project

```bash
npm run build
```

### 3. Review the synthesized CloudFormation template

```bash
cdk synth
```

### 4. Deploy to AWS

```bash
cdk deploy
```

To specify a target AWS profile or region:

```bash
cdk deploy --profile <your-profile> --region <aws-region>
```

---

## How It Works

1. **DynamoDB Streams** is enabled on the table to capture change events.
2. **EventBridge Pipes** connects the stream as a source and Lambda as the target. You can optionally configure:
   - **Filtering** – only forward specific event types (e.g. `INSERT` only).
   - **Enrichment** – invoke a separate Lambda or API Gateway to transform records before processing.
3. **Lambda** receives the filtered/enriched event, extracts relevant data, and publishes a message to the **SNS topic**.
4. **SNS** delivers the notification to all subscribed endpoints.

---

## Configuration

Key configuration is managed inside the CDK stack (`lib/aws-event-driven-stack.ts`). Common values to customise:

| Setting | Description |
|---|---|
| `tableName` | Name of the DynamoDB table |
| `streamViewType` | Stream record type (`NEW_IMAGE`, `OLD_IMAGE`, `NEW_AND_OLD_IMAGES`) |
| `pipeFilterCriteria` | EventBridge Pipes event filter pattern |
| `snsTopicName` | Name of the SNS topic |
| `lambdaHandler` | Path to the Lambda handler in `lambda/` |

---

## Useful CDK Commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and recompile |
| `cdk synth` | Synthesise the CloudFormation template |
| `cdk diff` | Compare deployed stack with current state |
| `cdk deploy` | Deploy the stack to AWS |
| `cdk destroy` | Tear down all deployed resources |

---

## Raw Event example

<details>
  <summary>点击展开内容</summary>

这里是折叠起来的内容。  
你可以放文字、代码块、图片、列表等等。

```js
console.log("代码也可以放在里面")
```

</details>

## Clean Up

To avoid ongoing AWS charges, destroy the stack when it is no longer needed:

```bash
cdk destroy
```

---

## License

This project is open source. See [LICENSE](LICENSE) for details.
